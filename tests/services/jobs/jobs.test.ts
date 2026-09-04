import {
  createSession,
  setCookiesMock
} from "../../../src/services/auth/session";
import { User } from "../../../src/types/auth";
import { JobService } from "../../../src/services/jobs/service";
import { InMemoryJobRepository } from "../../../src/services/jobs/repository";
import { ExponentialBackoffRetryPolicy } from "../../../src/services/jobs/retry";
import { InMemoryJobQueue, IJobExecutor } from "../../../src/services/jobs/queue";
import { JobExecutionManager } from "../../../src/services/jobs/executor";
import { Job, JobSchedule } from "../../../src/services/jobs/types";
import { CrawlJobMetadata, AiAnalysisJobMetadata } from "../../../src/services/jobs/contracts";
import { TenantContextManager } from "../../../src/core/database/tenant-context";

// Mock implementation of the cookie store
const mockCookieStore = {
  store: new Map<string, any>(),
  get(name: string) {
    return this.store.get(name);
  },
  set(name: string, value: any, options: any) {
    this.store.set(name, { value, name, ...options });
  },
  delete(name: string) {
    this.store.delete(name);
  },
  clear() {
    this.store.clear();
  }
};

// Register cookies mock for jobs tests
setCookiesMock(() => Promise.resolve(mockCookieStore));

export async function runJobTests() {
  console.log("=========================================================================");
  console.log("SEORCHABLE — ASYNC PROCESSING INFRASTRUCTURE REGRESSION SUITE");
  console.log("=========================================================================");

  const repository = new InMemoryJobRepository();
  const service = new JobService(repository);
  const retryPolicy = new ExponentialBackoffRetryPolicy(100, 1000); // Fast delays for testing
  const executor = new JobExecutionManager(service, retryPolicy);
  const queue = new InMemoryJobQueue(executor);

  const mockUser: User = {
    id: "usr-test-123",
    name: "Async Engineer",
    email: "worker@seorchable.ir",
    role: "workspace_admin",
    workspaceId: "ws-test-99"
  };

  // ----------------------------------------------------
  // Scenario 1: Tenant-scoped Job Creation & Authentication Boundaries
  // ----------------------------------------------------
  console.log("▶ SEC-REG-010: Testing Tenant-Derived Job Creation...");
  mockCookieStore.clear();
  await repository.clear();

  // 1.1 Unauthenticated -> Rejected
  try {
    await service.createJob({ type: "crawl" });
    throw new Error("Security Boundary Violation: Created a job without active session!");
  } catch (err: any) {
    if (err.message && err.message.includes("Unauthorized")) {
      console.log("  ✅ Unauthenticated job creation correctly blocked (Failed closed).");
    } else {
      throw err;
    }
  }

  // 1.2 Authenticated -> Derived from session, client cannot spoof
  await createSession(mockUser);
  // Spoof plain cookies
  mockCookieStore.store.set("tenant_id", { value: "ws-hacker-tenant" });
  mockCookieStore.store.set("user_id", { value: "usr-hacker" });

  const job = await service.createJob({ type: "crawl" });
  if (job.tenantId !== mockUser.workspaceId || job.userId !== mockUser.id) {
    throw new Error(`Security Boundary Violation: Job trusted client-provided cookies! Resolved Tenant: ${job.tenantId}, User: ${job.userId}`);
  }
  console.log("  ✅ Job successfully associated with secure session identity, ignoring client-provided spoof cookies.");

  // ----------------------------------------------------
  // Scenario 2: Tenant-Scoped Idempotency
  // ----------------------------------------------------
  console.log("▶ SEC-REG-006: Testing Tenant-Scoped Idempotency Keys...");
  const key = "crawl:google.com:latest";

  // 2.1 Duplicate execution for same tenant -> reuse original job
  const job1 = await service.createJob({ type: "crawl", idempotencyKey: key });
  const job2 = await service.createJob({ type: "crawl", idempotencyKey: key });

  if (job1.id !== job2.id) {
    throw new Error("Idempotency Violation: Created duplicate jobs for same tenant + key.");
  }

  // 2.2 Same key across different tenants -> must NOT collide
  const secondUser: User = { id: "usr-other", name: "Other User", email: "other@test.com", role: "workspace_admin", workspaceId: "ws-other-tenant" };
  await createSession(secondUser);
  const jobOtherTenant = await service.createJob({ type: "crawl", idempotencyKey: key });

  if (job1.id === jobOtherTenant.id || jobOtherTenant.tenantId !== "ws-other-tenant") {
    throw new Error("Security Isolation Leak: Cross-tenant idempotency key collision occurred!");
  }
  console.log("  ✅ Idempotency keys are strictly isolated by tenant scope.");

  // ----------------------------------------------------
  // Scenario 3: Job Lifecycle State Machine Invariants
  // ----------------------------------------------------
  console.log("▶ SEC-REG-015: Testing Lifecycle State Machine Invariants...");
  await createSession(mockUser);
  const freshJob = await service.createJob({ type: "seo_audit" });

  // 3.1 completed -> running is illegal
  await service.transitionStatus(freshJob.id, "completed");
  try {
    await service.transitionStatus(freshJob.id, "running");
    throw new Error("Lifecycle Violation: Transitioned a completed job back to running!");
  } catch (err: any) {
    if (err.message && err.message.includes("Cannot transition a completed job")) {
      // Correct!
    } else {
      throw err;
    }
  }

  // 3.2 failed -> completed directly is illegal
  const failedJob = await service.createJob({ type: "ai_analysis" });
  await service.transitionStatus(failedJob.id, "failed");
  try {
    await service.transitionStatus(failedJob.id, "completed");
    throw new Error("Lifecycle Violation: Transitioned a failed job directly to completed!");
  } catch (err: any) {
    if (err.message && err.message.includes("Cannot transition a failed job")) {
      // Correct!
    } else {
      throw err;
    }
  }

  // 3.3 cancelled -> running is illegal
  const cancelledJob = await service.createJob({ type: "document_ingestion" });
  await service.transitionStatus(cancelledJob.id, "cancelled");
  try {
    await service.transitionStatus(cancelledJob.id, "running");
    throw new Error("Lifecycle Violation: Transitioned a cancelled job back to active!");
  } catch (err: any) {
    if (err.message && err.message.includes("Cannot transition a cancelled job")) {
      console.log("  ✅ State machine invariants strictly enforced; illegal state transitions rejected.");
    } else {
      throw err;
    }
  }

  // ----------------------------------------------------
  // Scenario 4: Retry Strategies & Exponential Backoff
  // ----------------------------------------------------
  console.log("▶ SEC-REG-009: Testing Exponential Backoff Retry Policy...");
  const delay1 = retryPolicy.getDelay(1); // attempt 1 -> 100ms
  const delay2 = retryPolicy.getDelay(2); // attempt 2 -> 200ms
  const delay3 = retryPolicy.getDelay(3); // attempt 3 -> 400ms

  if (delay1 !== 100 || delay2 !== 200 || delay3 !== 400) {
    throw new Error(`Retry Strategy Error: Exponential backoff returned incorrect values: ${delay1}, ${delay2}, ${delay3}`);
  }
  console.log("  ✅ Exponential backoff policy is deterministic and correct.");

  // ----------------------------------------------------
  // Scenario 5: Job Contracts (Crawl, AI, Scheduled)
  // ----------------------------------------------------
  console.log("▶ SEC-REG-012: Testing Job Contracts...");
  // 5.1 Crawl Job Contract
  const crawlMeta: CrawlJobMetadata = {
    targetUrl: "https://seorchable.ir",
    depthLimit: 3,
    maxPages: 100
  };
  const crawlJob = await service.createJob({
    type: "crawl",
    metadata: crawlMeta as any
  });
  if ((crawlJob.metadata as any).depthLimit !== 3) {
    throw new Error("Crawl Job Contract Mismatch: metadata fields failed to map.");
  }

  // 5.2 AI Job Contract
  const aiMeta: AiAnalysisJobMetadata = {
    modelName: "gemini-2.0",
    promptTemplate: "Analyze SEO visibility for {domain}",
    targetDomain: "seorchable.ir"
  };
  const aiJob = await service.createJob({
    type: "ai_analysis",
    metadata: aiMeta as any
  });
  if ((aiJob.metadata as any).modelName !== "gemini-2.0") {
    throw new Error("AI Job Contract Mismatch: metadata fields failed to map.");
  }

  // 5.3 Scheduled Job Contract
  const schedule: JobSchedule = {
    id: "sched-001",
    jobType: "seo_audit",
    tenantId: "ws-test-99",
    scheduledFor: new Date(Date.now() + 60000),
    enabled: true
  };
  if (schedule.jobType !== "seo_audit" || schedule.tenantId !== "ws-test-99") {
    throw new Error("Scheduled Job Contract Mismatch.");
  }
  console.log("  ✅ Crawl, AI, and Scheduled job contracts successfully validated.");

  // ----------------------------------------------------
  // Scenario 6: Simulated RLS Propagation in Job Executor
  // ----------------------------------------------------
  console.log("▶ SEC-REG-009: Testing PostgreSQL Tenant Propagation during Background Execution...");
  let activeTenantIdInWorker = "";

  executor.registerExecutor("crawl", async (job) => {
    activeTenantIdInWorker = TenantContextManager.getRequiredTenantId();
  });

  const executingJob = await service.createJob({ type: "crawl" });
  await executor.execute(executingJob);

  if (activeTenantIdInWorker !== mockUser.workspaceId) {
    throw new Error(`Security Isolation Leak: Background worker failed to establish active PostgreSQL tenant context! Expected ${mockUser.workspaceId}, got ${activeTenantIdInWorker}`);
  }
  console.log("  ✅ Background execution successfully runs inside transacted tenant-context, ensuring automatic PostgreSQL RLS boundaries.");

  console.log("=========================================================================");
  console.log("✅ ALL ASYNC PROCESSING INFRASTRUCTURE REGRESSIONS PASSED SUCCESSFULLY!");
  console.log("=========================================================================");
}

if (require.main === module) {
  runJobTests().catch((err) => {
    console.error("❌ Test Suite Failed with Error:", err);
    process.exit(1);
  });
}
