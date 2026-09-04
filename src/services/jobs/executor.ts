import { Job } from "./types";
import { JobService } from "./service";
import { RetryPolicy } from "./retry";
import { IJobExecutor } from "./queue";

export class JobExecutionManager implements IJobExecutor {
  private executors = new Map<string, (job: Job) => Promise<void>>();

  constructor(
    private jobService: JobService,
    private retryPolicy: RetryPolicy
  ) {}

  registerExecutor(type: string, handler: (job: Job) => Promise<void>) {
    this.executors.set(type, handler);
  }

  async execute(job: Job): Promise<void> {
    const handler = this.executors.get(job.type);

    if (!handler) {
      const err = {
        code: "NO_EXECUTOR",
        message: `No executor registered for job type ${job.type}`,
        retryable: false,
      };

      await this.jobService.transitionStatus(job.id, "failed", err);
      return;
    }

    await this.jobService.transitionStatus(job.id, "running");
    job.attempts++;

    try {
      // Execute the domain handler inside the secure tenant context.
      // This enforces database isolation and RLS boundaries on background operations.
      const { TenantContextManager } = await import(
        "../../core/database/tenant-context"
      );

      await TenantContextManager.runWithTenantContext(
        job.tenantId,
        job.userId,
        `req-job-${job.id}`,
        async () => {
          await handler(job);
        }
      );

      await this.jobService.transitionStatus(job.id, "completed");
    } catch (err: unknown) {
      const errorObj = err as {
        retryable?: boolean;
        code?: string;
        message?: string;
      };

      const isRetryable = errorObj.retryable !== false;

      const jobError = {
        code: errorObj.code || "EXECUTION_FAILURE",
        message:
          errorObj.message ||
          (err instanceof Error ? err.message : String(err)),
        retryable: isRetryable && job.attempts < job.maxAttempts,
      };

      if (jobError.retryable) {
        await this.jobService.transitionStatus(
          job.id,
          "retrying",
          jobError
        );

        // Exponential backoff delay
        const delay = this.retryPolicy.getDelay(job.attempts);

        // Re-enqueue after delay
        setTimeout(async () => {
          await this.jobService.transitionStatus(job.id, "queued");
          await this.execute(job);
        }, delay);
      } else {
        await this.jobService.transitionStatus(
          job.id,
          "failed",
          jobError
        );
      }
    }
  }
}