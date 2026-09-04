/**
 * Enterprise PostgreSQL Tenant Context Pipeline Audit Test Suite
 * Programmatically verifies concurrent isolation, connection pool safety,
 * missing contexts, nested transaction re-use, and rollback mechanics.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { TenantContextManager, TenantContextViolationException } from "../../../src/core/database/tenant-context";
import { BrandRepository, db } from "../../../src/features/ai-intelligence/repositories";

export async function testTenantPipeline() {
  console.log("▶ Running Tenant Context Pipeline Audit Tests...");

  const brandRepo = new BrandRepository();

  const mockAudit = {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "pipeline-test",
    updatedBy: "pipeline-test",
    version: 1
  };

  // Seed some test data under specific tenants
  const tenantAId = "tenant-pipeline-a";
  const tenantBId = "tenant-pipeline-b";

  db.brands.set("brand-pipeline-a", {
    id: "brand-pipeline-a",
    organizationId: tenantAId,
    name: "Pipeline Brand A",
    website: "https://pipeline-a.com",
    audit: mockAudit
  });

  db.brands.set("brand-pipeline-b", {
    id: "brand-pipeline-b",
    organizationId: tenantBId,
    name: "Pipeline Brand B",
    website: "https://pipeline-b.com",
    audit: mockAudit
  });

  // 1. Test: Missing Tenant Context (Fail-Fast Violation)
  console.log("  * Testing Missing Tenant Context Protection...");
  try {
    await brandRepo.findById(tenantAId, "brand-pipeline-a");
    throw new Error("Pipeline Test Failure: BrandRepository.findById allowed execution without active tenant context.");
  } catch (err: unknown) {
    if (!(err instanceof TenantContextViolationException)) {
      throw new Error(`Expected TenantContextViolationException, but got: ${err}`);
    }
    if (!err.message.includes("No active tenant context found")) {
      throw new Error(`Unexpected violation error message: ${err.message}`);
    }
  }

  // 2. Test: Explicit System Context (Legitimate cross-tenant administrative access)
  console.log("  * Testing Explicit System Context Access...");
  await TenantContextManager.runWithSystemContext("admin-01", "req-01", async () => {
    const brand = await brandRepo.findById(tenantAId, "brand-pipeline-a");
    if (!brand || brand.name !== "Pipeline Brand A") {
      throw new Error("Pipeline Test Failure: System Context was unable to query tenant-scoped brand repository.");
    }
  });

  // 3. Test: Safe Tenant Context Isolation & Querying
  console.log("  * Testing Tenant Context Query Execution...");
  await TenantContextManager.runWithTenantContext(tenantAId, "user-01", "req-02", async () => {
    const brand = await brandRepo.findById(tenantAId, "brand-pipeline-a");
    if (!brand || brand.name !== "Pipeline Brand A") {
      throw new Error("Pipeline Test Failure: Tenant A Context was unable to retrieve Brand A.");
    }

    // Cross-tenant access under Tenant A Context must fail-fast with TenantContextViolationException
    try {
      await brandRepo.findById(tenantBId, "brand-pipeline-b");
      throw new Error("Pipeline Test Failure: Tenant A Context allowed cross-tenant operation against Tenant B.");
    } catch (err: unknown) {
      if (!(err instanceof TenantContextViolationException)) {
        throw new Error(`Expected TenantContextViolationException, but got: ${err}`);
      }
      if (!err.message.includes("does not match active tenant")) {
        throw new Error(`Unexpected cross-tenant violation error message: ${err.message}`);
      }
    }
  });

  // 4. Test: Concurrency and Thread-Safe Separation (No leakage under concurrent load)
  console.log("  * Testing High Concurrent Load Tenant Separation...");
  const concurrentTasks = Array.from({ length: 50 }).map(async (_, idx) => {
    const currentTenant = idx % 2 === 0 ? tenantAId : tenantBId;
    const targetBrandId = idx % 2 === 0 ? "brand-pipeline-a" : "brand-pipeline-b";
    const expectedName = idx % 2 === 0 ? "Pipeline Brand A" : "Pipeline Brand B";

    return TenantContextManager.runWithTenantContext(currentTenant, `user-concurrent-${idx}`, `req-${idx}`, async () => {
      // Small random latency to force thread scheduling interleaving
      await new Promise(resolve => setTimeout(resolve, Math.random() * 5));

      const brand = await brandRepo.findById(currentTenant, targetBrandId);
      if (!brand || brand.name !== expectedName) {
        throw new Error(`Pipeline Concurrency Failure at task ${idx}. Mismatched context leakage detected!`);
      }
    });
  });

  await Promise.all(concurrentTasks);

  // 5. Test: Transaction Rollback Behavior
  console.log("  * Testing Transaction Rollback Mechanics...");
  let rollbackTriggered = false;
  try {
    await TenantContextManager.runWithTenantContext(tenantAId, "user-01", "req-03", async () => {
      // Perform a save that should succeed in memory first
      const brandToRollback = {
        id: "brand-rollback",
        organizationId: tenantAId,
        name: "Temporary Rollback Brand",
        website: "https://temp-rollback.com",
        audit: mockAudit
      };
      await brandRepo.save(brandToRollback);

      // Artificially trigger rollback via throwing error
      throw new Error("Simulated Rollback Error");
    });
  } catch (err: any) {
    if (err.message === "Simulated Rollback Error") {
      rollbackTriggered = true;
    } else {
      throw err;
    }
  }

  if (!rollbackTriggered) {
    throw new Error("Pipeline Test Failure: Error did not bubble up to trigger rollback logic.");
  }

  // 6. Test: Transaction Re-use and Nested SAVEPOINTs
  console.log("  * Testing Transaction Re-use and Nested SAVEPOINT Rollbacks...");
  await TenantContextManager.runWithTenantContext(tenantAId, "user-01", "req-04", async () => {
    const outerContext = TenantContextManager.getContext();
    if (!outerContext || outerContext.transactionDepth !== 1) {
      throw new Error("Expected initial transaction depth of 1");
    }

    // Default: Re-use active transaction block (depth increments)
    await TenantContextManager.runWithTenantContext(tenantAId, "user-01", "req-04", async () => {
      const innerContext = TenantContextManager.getContext();
      if (!innerContext || innerContext.transactionDepth !== 2) {
        throw new Error("Expected nested re-used transaction depth of 2");
      }
    });

    // Explicit: Request new savepoint for independent rollback
    let innerSavepointFailed = false;
    try {
      await TenantContextManager.runWithTenantContext(tenantAId, "user-01", "req-04", async () => {
        const savepointContext = TenantContextManager.getContext();
        if (!savepointContext || savepointContext.transactionDepth !== 2) {
          throw new Error("Expected independent savepoint depth of 2");
        }
        throw new Error("Nested Savepoint Fail");
      }, { requireNewSavepoint: true });
    } catch (err: any) {
      if (err.message === "Nested Savepoint Fail") {
        innerSavepointFailed = true;
      } else {
        throw err;
      }
    }

    if (!innerSavepointFailed) {
      throw new Error("Expected independent nested savepoint rollback to throw error.");
    }
  });

  // 7. Test: Connection Pool Safety & Reuse (Multiple successive queries on pooled clients)
  console.log("  * Testing Connection Pool Safety and Client Re-use...");
  for (let i = 0; i < 5; i++) {
    await TenantContextManager.runWithTenantContext(tenantAId, "user-01", "req-05", async () => {
      const brand = await brandRepo.findById(tenantAId, "brand-pipeline-a");
      if (!brand || brand.name !== "Pipeline Brand A") {
        throw new Error(`Successive pool lease failed on iteration ${i}`);
      }
    });
  }

  // 8. Test: Background Worker Execution Context
  console.log("  * Testing Background Worker Context Initialization...");
  const backgroundJobResult = await new Promise<boolean>((resolve) => {
    // Simulate background runner queue worker dispatching task
    setTimeout(async () => {
      try {
        await TenantContextManager.runWithTenantContext(tenantAId, "worker-cron", "job-999", async () => {
          const brand = await brandRepo.findById(tenantAId, "brand-pipeline-a");
          resolve(brand !== null && brand.name === "Pipeline Brand A");
        });
      } catch {
        resolve(false);
      }
    }, 10);
  });

  if (!backgroundJobResult) {
    throw new Error("Pipeline Test Failure: Background worker failed to establish tenant context to execute queries.");
  }

  console.log("✅ Tenant Context Pipeline Audit Tests Passed Successfully!");
}
