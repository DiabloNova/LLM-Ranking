import type { Pool, QueryResultRow } from "pg";
import type { CrawlJobStatus } from "../../../domain/contracts";
import type { CompletionFacts } from "./crawl-job-repository";
import { assertTransition } from "../../../domain/job-state-machine";

export interface DispatchCandidate {
  id: string;
  tenantId: string;
}

interface CandidateRow extends QueryResultRow {
  id: string;
  tenant_id: string;
}

/**
 * Deliberately system-scoped. SECURITY DEFINER functions are the sole
 * cross-tenant surface; callers must establish tenant context before work.
 */
export class CrawlDispatcherRepository {
  public constructor(private readonly pool: Pool) {}

  public async claim(
    workerId: string,
    limit: number,
    leaseMs: number
  ): Promise<DispatchCandidate[]> {
    const result = await this.pool.query<CandidateRow>(
      "SELECT id, tenant_id FROM public.claim_crawl_jobs($1, $2, $3)",
      [workerId, limit, leaseMs]
    );
    return result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id
    }));
  }

  public async recoverExpired(): Promise<DispatchCandidate[]> {
    const result = await this.pool.query<CandidateRow>(
      "SELECT id, tenant_id FROM public.recover_expired_crawl_jobs()"
    );
    return result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id
    }));
  }

  public async completeIfLeaseOwner(
    jobId: string,
    workerId: string,
    expectedVersion: number,
    status: Exclude<CrawlJobStatus, "PENDING" | "QUEUED" | "RUNNING">,
    facts: CompletionFacts = {}
  ): Promise<boolean> {
    assertTransition("RUNNING", status);
    const result = await this.pool.query<{ completed: boolean }>(
      `SELECT public.complete_crawl_job_if_lease_owner(
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) AS completed`,
      [
        jobId,
        workerId,
        expectedVersion,
        status,
        facts.providerId ?? null,
        facts.providerJobId ?? null,
        facts.durationMs ?? null,
        facts.pageCount ?? null,
        facts.bytesProcessed ?? null,
        facts.cacheOutcome ?? null,
        facts.resultRef ?? null,
        facts.error ? JSON.stringify(facts.error) : null
      ]
    );
    return result.rows[0]?.completed === true;
  }
}
