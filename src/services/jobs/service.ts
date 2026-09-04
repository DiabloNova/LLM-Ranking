import crypto from "crypto";
import { Job, JobStatus, JobType } from "./types";
import { IJobRepository } from "./repository";
import { requireSession } from "../auth/session";
import { requireWorkspaceMembership } from "../auth/authorization";

export class JobService {
  constructor(private repository: IJobRepository) {}

  /**
   * Creates a new background job under the authenticated user's tenant context.
   * Derived strictly from the authoritative server session.
   */
  async createJob(options: {
    type: JobType;
    idempotencyKey?: string;
    maxAttempts?: number;
    metadata?: Record<string, unknown>;
  }): Promise<Job> {
    const session = await requireSession();
    if (!session.user) {
      throw new Error("Unauthorized: No authenticated user session found.");
    }

    const tenantId = session.user.workspaceId;
    const userId = session.user.id;

    // Enforce workspace membership validation
    await requireWorkspaceMembership(userId, tenantId);

    // Enforce tenant-scoped idempotency
    if (options.idempotencyKey) {
      const existingJob = await this.repository.findByIdempotencyKey(tenantId, options.idempotencyKey);
      if (existingJob) {
        // If the job is already active (queued, running, retrying) or completed, return it to avoid duplication
        if (["queued", "running", "retrying", "completed"].includes(existingJob.status)) {
          return existingJob;
        }
      }
    }

    const job: Job = {
      id: `job-${crypto.randomUUID()}`,
      type: options.type,
      status: "queued",
      tenantId,
      userId,
      idempotencyKey: options.idempotencyKey,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: new Date(),
      metadata: options.metadata || {}
    };

    return await this.repository.create(job);
  }

  /**
   * Retrieves a job for a tenant, enforcing strict tenant isolation boundaries.
   */
  async getJobForTenant(jobId: string, tenantId: string): Promise<Job> {
    const job = await this.repository.findByTenantAndId(jobId, tenantId);
    if (!job) {
      throw new Error(`Unauthorized: Job ${jobId} does not exist or does not belong to tenant ${tenantId}.`);
    }
    return job;
  }

  /**
   * Transitions a job's status and enforces lifecycle state machine invariants.
   */
  async transitionStatus(jobId: string, newStatus: JobStatus, error?: { code: string; message: string; retryable: boolean }): Promise<Job> {
    const job = await this.repository.findById(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found.`);
    }

    const currentStatus = job.status;

    // Define and enforce illegal transitions
    if (currentStatus === "completed" && newStatus === "running") {
      throw new Error("Illegal State Transition: Cannot transition a completed job back to running.");
    }
    if (currentStatus === "failed" && newStatus === "completed") {
      throw new Error("Illegal State Transition: Cannot transition a failed job directly to completed without a retry.");
    }
    if (currentStatus === "cancelled" && ["queued", "running", "retrying"].includes(newStatus)) {
      throw new Error("Illegal State Transition: Cannot transition a cancelled job back to active.");
    }

    job.status = newStatus;

    if (newStatus === "running") {
      if (!job.startedAt) {
        job.startedAt = new Date();
      }
    }

    if (newStatus === "completed" || newStatus === "failed" || newStatus === "cancelled") {
      job.completedAt = new Date();
    }

    if (error) {
      // Secure check: ensure no credentials/secrets exist in the error code or message
      const containsSecrets = (str: string) => /session|cookie|secret|sk-proj|key/i.test(str);
      if (containsSecrets(error.code) || containsSecrets(error.message)) {
        job.error = {
          code: "INTERNAL_SECURITY_ERROR",
          message: "A secure internal processing error occurred.",
          retryable: error.retryable
        };
      } else {
        job.error = error;
      }
    }

    return await this.repository.update(job);
  }

  /**
   * Cancels a pending or active job.
   */
  async cancelJob(jobId: string, tenantId: string): Promise<Job> {
    const job = await this.getJobForTenant(jobId, tenantId);
    if (["completed", "failed", "cancelled"].includes(job.status)) {
      throw new Error(`Cannot cancel a job that is already in terminal state: ${job.status}`);
    }
    return await this.transitionStatus(jobId, "cancelled");
  }
}
