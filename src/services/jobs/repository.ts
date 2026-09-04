import { Job } from "./types";

export interface IJobRepository {
  create(job: Job): Promise<Job>;
  findById(id: string): Promise<Job | null>;
  findByTenantAndId(jobId: string, tenantId: string): Promise<Job | null>;
  findByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<Job | null>;
  update(job: Job): Promise<Job>;
  clear(): Promise<void>;
}

export class InMemoryJobRepository implements IJobRepository {
  private jobs = new Map<string, Job>();

  async create(job: Job): Promise<Job> {
    this.jobs.set(job.id, { ...job });
    return job;
  }

  async findById(id: string): Promise<Job | null> {
    const job = this.jobs.get(id);
    return job ? { ...job } : null;
  }

  async findByTenantAndId(jobId: string, tenantId: string): Promise<Job | null> {
    const job = this.jobs.get(jobId);
    if (job && job.tenantId === tenantId) {
      return { ...job };
    }
    return null;
  }

  async findByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<Job | null> {
    for (const job of this.jobs.values()) {
      if (job.tenantId === tenantId && job.idempotencyKey === idempotencyKey) {
        return { ...job };
      }
    }
    return null;
  }

  async update(job: Job): Promise<Job> {
    this.jobs.set(job.id, { ...job });
    return job;
  }

  async clear(): Promise<void> {
    this.jobs.clear();
  }
}
