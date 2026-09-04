import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { TenantContextManager } from "../src/core/database/tenant-context";
import { CrawlOrchestrator } from "../src/features/acquisition/application/orchestrator";
import {
  CrawlDispatcherRepository,
  CrawlJobRepository
} from "../src/features/acquisition/infrastructure/persistence/postgres";

export interface CrawlWorkerOptions {
  pool: Pool;
  workerId?: string;
  batchSize?: number;
  leaseMs?: number;
  pollMs?: number;
}

export class CrawlWorker {
  private readonly workerId: string;
  private readonly batchSize: number;
  private readonly leaseMs: number;
  private readonly pollMs: number;
  private stopping = false;
  private readonly active = new Set<AbortController>();

  public constructor(private readonly options: CrawlWorkerOptions) {
    this.workerId = options.workerId ?? randomUUID();
    this.batchSize = options.batchSize ?? 4;
    this.leaseMs = options.leaseMs ?? 60_000;
    this.pollMs = options.pollMs ?? 1_000;
  }

  public stop(): void {
    this.stopping = true;
    for (const controller of this.active) {
      controller.abort();
    }
  }

  public async run(): Promise<void> {
    const dispatcher = new CrawlDispatcherRepository(this.options.pool);
    while (!this.stopping) {
      await dispatcher.recoverExpired();
      const candidates = await dispatcher.claim(
        this.workerId,
        this.batchSize,
        this.leaseMs
      );
      if (!candidates.length) {
        await new Promise(resolve => setTimeout(resolve, this.pollMs));
        continue;
      }
      await Promise.all(candidates.map(candidate => this.runCandidate(candidate.id, candidate.tenantId)));
    }
  }

  private async runCandidate(jobId: string, tenantId: string): Promise<void> {
    const controller = new AbortController();
    this.active.add(controller);
    try {
      const runTenant = <T>(operation: () => Promise<T>): Promise<T> =>
        TenantContextManager.runWithTenantContext(
          tenantId,
          "crawl-worker",
          jobId,
          operation
        );
      let job = await runTenant(() => new CrawlJobRepository().getById(jobId));
      if (!job || job.workerId !== this.workerId || job.status !== "RUNNING") {
        controller.abort();
        return;
      }
      let leaseVersion = job.version;
      let heartbeatRunning = false;
      const heartbeat = setInterval(() => {
        if (heartbeatRunning) {
          return;
        }
        heartbeatRunning = true;
        void runTenant(async () => {
          try {
            const jobs = new CrawlJobRepository();
            job = await jobs.heartbeat(
              {
                jobId,
                workerId: this.workerId,
                leaseExpiresAt: new Date(Date.now() + this.leaseMs)
              },
              leaseVersion
            );
            leaseVersion = job.version;
            if (job.status === "CANCELLED") {
              controller.abort();
            }
          } catch {
            controller.abort();
          } finally {
            heartbeatRunning = false;
          }
        });
      }, Math.max(1000, Math.floor(this.leaseMs / 3)));
      try {
        const orchestrator = new CrawlOrchestrator();
        await orchestrator.execute(job, controller.signal, {
          runTenantOperation: runTenant,
          getExpectedVersion: () => leaseVersion,
          completeIfLeaseOwner: (status, expectedVersion, facts) =>
            new CrawlDispatcherRepository(this.options.pool).completeIfLeaseOwner(
              jobId,
              this.workerId,
              expectedVersion,
              status,
              facts
            )
        });
      } catch {
        if (this.stopping && !controller.signal.aborted) {
          controller.abort();
        }
        if (this.stopping) {
          await new CrawlDispatcherRepository(this.options.pool).completeIfLeaseOwner(
            jobId,
            this.workerId,
            leaseVersion,
            "FAILED",
            {
              error: {
                code: "CANCELLED",
                public: {
                  code: "CANCELLED",
                  message: "The crawl was stopped by the worker."
                }
              }
            }
          );
        }
      } finally {
        clearInterval(heartbeat);
      }
    } finally {
      this.active.delete(controller);
    }
  }
}

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const worker = new CrawlWorker({ pool });
  const shutdown = (): void => worker.stop();
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
  try {
    await worker.run();
  } finally {
    await pool.end();
  }
}

if (process.argv[1]?.endsWith("crawl-worker.ts")) {
  void main();
}
