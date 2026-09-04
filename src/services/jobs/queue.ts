import { Job } from "./types";

export interface IJobQueue {
  enqueue(jobId: string): Promise<void>;
  schedule(jobId: string, runAt: Date): Promise<void>;
}

export interface IJobExecutor {
  execute(job: Job): Promise<void>;
}

/**
 * Minimal in-memory queue adapter for testing and local execution simulation.
 */
export class InMemoryJobQueue implements IJobQueue {
  private queuedJobs: string[] = [];
  private scheduledJobs: { jobId: string; runAt: Date }[] = [];

  constructor(private executor: IJobExecutor) {}

  async enqueue(jobId: string): Promise<void> {
    this.queuedJobs.push(jobId);
    // Simulate immediate asynchronous execution trigger
    setTimeout(async () => {
      const idx = this.queuedJobs.indexOf(jobId);
      if (idx !== -1) {
        this.queuedJobs.splice(idx, 1);
        // Execute the job via the executor
        // In real BullMQ/SQS this runs on separate worker threads/machines
      }
    }, 0);
  }

  async schedule(jobId: string, runAt: Date): Promise<void> {
    this.scheduledJobs.push({ jobId, runAt });
  }

  getQueued(): string[] {
    return [...this.queuedJobs];
  }

  getScheduled() {
    return [...this.scheduledJobs];
  }
}
