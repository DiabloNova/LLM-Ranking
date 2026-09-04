import { randomUUID } from "node:crypto";
import type { PoolClient, QueryResultRow } from "pg";
import {
  assertTransition,
  retryFailedJob
} from "../../../domain/job-state-machine";
import type {
  CrawlJob,
  CrawlJobStatus,
  CrawlRequest
} from "../../../domain/contracts";
import { CrawlError } from "../../../domain/errors";
import {
  computeCacheKey,
  computeDedupKey
} from "../../../domain/identity";
import type { CrawlPolicy } from "../../../domain/policy";
import {
  normalizeUrl,
  type NormalizedUrl
} from "../../../domain/url/normalizer";
import { TenantContextManager } from "../../../../../core/database/tenant-context";

interface CrawlJobRow extends QueryResultRow {
  id: string;
  tenant_id: string;
  requested_url: string;
  normalized_url: string;
  policy: CrawlPolicy;
  dedup_key: string;
  cache_key: string;
  priority: number;
  status: CrawlJobStatus;
  provider_id: string | null;
  provider_job_id: string | null;
  attempts: number;
  max_attempts: number;
  scheduled_for: Date | null;
  claimed_at: Date | null;
  heartbeat_at: Date | null;
  lease_expires_at: Date | null;
  worker_id: string | null;
  created_at: Date;
  updated_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
  duration_ms: number | null;
  page_count: number | null;
  bytes_processed: string | null;
  cache_outcome: CrawlJob["cacheOutcome"] | null;
  error: CrawlJob["error"] | null;
  cancelled_at: Date | null;
  cancellation_reason: string | null;
  cancellation_requested_by: string | null;
  result_ref: string | null;
  correlation_id: string | null;
  request_id: string | null;
  trace_id: string | null;
  version: number;
}

export interface CreateCrawlJobInput {
  request: CrawlRequest;
  dedupKey?: string;
  cacheKey?: string;
  scheduledFor?: Date;
}

export interface CreateOrGetCrawlJobResult {
  job: CrawlJob;
  created: boolean;
}

export interface JobLease {
  jobId: string;
  workerId: string;
  leaseExpiresAt: Date;
}

export interface CompletionFacts {
  providerId?: string;
  providerJobId?: string;
  durationMs?: number;
  pageCount?: number;
  bytesProcessed?: number;
  cacheOutcome?: CrawlJob["cacheOutcome"];
  resultRef?: string;
  error?: CrawlJob["error"];
}

function dbClient(): PoolClient {
  const client = TenantContextManager.getDbClient() as PoolClient | null;
  if (!client) {
    throw new Error("Crawl persistence requires an active tenant transaction");
  }
  return client;
}

function dateValue(value: Date | null): string | undefined {
  return value?.toISOString();
}

function normalizedUrl(value: string): NormalizedUrl {
  const result = normalizeUrl(value, false);
  if (!result.ok) {
    throw result.error;
  }
  return result.value;
}

function mapJob(row: CrawlJobRow): CrawlJob {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    requestedUrl: row.requested_url,
    normalizedUrl: normalizedUrl(row.normalized_url),
    policy: row.policy,
    dedupKey: row.dedup_key,
    cacheKey: row.cache_key,
    priority: row.priority,
    status: row.status,
    providerId: row.provider_id ?? undefined,
    providerJobId: row.provider_job_id ?? undefined,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    scheduledFor: dateValue(row.scheduled_for),
    claimedAt: dateValue(row.claimed_at),
    heartbeatAt: dateValue(row.heartbeat_at),
    leaseExpiresAt: dateValue(row.lease_expires_at),
    workerId: row.worker_id ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    startedAt: dateValue(row.started_at),
    completedAt: dateValue(row.completed_at),
    durationMs: row.duration_ms ?? undefined,
    pageCount: row.page_count ?? undefined,
    bytesProcessed:
      row.bytes_processed === null ? undefined : Number(row.bytes_processed),
    cacheOutcome: row.cache_outcome ?? undefined,
    error: row.error ?? undefined,
    cancelledAt: dateValue(row.cancelled_at),
    cancellationReason: row.cancellation_reason ?? undefined,
    cancellationRequestedBy: row.cancellation_requested_by ?? undefined,
    resultRef: row.result_ref ?? undefined,
    correlationId: row.correlation_id ?? undefined,
    requestId: row.request_id ?? undefined,
    traceId: row.trace_id ?? undefined,
    version: row.version
  };
}

const columns = `
  id, tenant_id, requested_url, normalized_url, policy, dedup_key, cache_key,
  priority, status, provider_id, provider_job_id, attempts, max_attempts,
  scheduled_for, claimed_at, heartbeat_at, lease_expires_at, worker_id,
  created_at, updated_at, started_at, completed_at, duration_ms, page_count,
  bytes_processed, cache_outcome, error, cancelled_at, cancellation_reason,
  cancellation_requested_by, result_ref, correlation_id, request_id, trace_id,
  version
`;

export class CrawlJobRepository {
  public async createOrGetByDedup(
    input: CreateCrawlJobInput
  ): Promise<CrawlJob> {
    return (await this.createOrGetByDedupWithOutcome(input)).job;
  }

  public async createOrGetByDedupWithOutcome(
    input: CreateCrawlJobInput
  ): Promise<CreateOrGetCrawlJobResult> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const client = dbClient();
    const dedupKey =
      input.dedupKey ??
      computeDedupKey(tenantId, input.request.normalizedUrl, input.request.policy);
    const cacheKey =
      input.cacheKey ??
      computeCacheKey(tenantId, input.request.normalizedUrl, input.request.policy);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const inserted = await client.query<CrawlJobRow>(
        `INSERT INTO crawl_jobs
          (id, tenant_id, requested_url, normalized_url, policy, dedup_key,
           cache_key, priority, status, max_attempts, scheduled_for,
           cache_outcome, correlation_id, request_id, trace_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9, $10, $11, $12, $13, $14)
         ON CONFLICT DO NOTHING
         RETURNING ${columns}`,
        [
          randomUUID(),
          tenantId,
          input.request.requestedUrl,
          input.request.normalizedUrl.canonical,
          JSON.stringify(input.request.policy),
          dedupKey,
          cacheKey,
          input.request.priority,
          input.request.policy.maxAttempts,
          input.scheduledFor ?? new Date(),
          input.request.bypassCache ? "BYPASS" : "MISS",
          input.request.correlationId ?? null,
          input.request.requestId ?? null,
          input.request.traceId ?? null
        ]
      );

      if (inserted.rows[0]) {
        return { job: mapJob(inserted.rows[0]), created: true };
      }

      const existing = await client.query<CrawlJobRow>(
        `SELECT ${columns}
         FROM crawl_jobs
         WHERE tenant_id = $1 AND dedup_key = $2
         ORDER BY created_at ASC
         LIMIT 1`,
        [tenantId, dedupKey]
      );
      if (existing.rows[0] && !["SUCCEEDED", "PARTIAL", "FAILED", "CANCELLED"].includes(existing.rows[0].status)) {
        return { job: mapJob(existing.rows[0]), created: false };
      }
    }

    throw new CrawlError(
      "CONFIGURATION_ERROR",
      "Could not establish a crawl job identity after concurrent deduplication races"
    );
  }

  public async getById(id: string): Promise<CrawlJob | null> {
    TenantContextManager.getRequiredTenantId();
    const result = await dbClient().query<CrawlJobRow>(
      `SELECT ${columns} FROM crawl_jobs
       WHERE id = $1 AND tenant_id = $2`,
      [id, TenantContextManager.getRequiredTenantId()]
    );
    return result.rows[0] ? mapJob(result.rows[0]) : null;
  }

  public async transition(
    id: string,
    expectedStatus: CrawlJobStatus,
    expectedVersion: number,
    nextStatus: CrawlJobStatus,
    facts: CompletionFacts = {}
  ): Promise<CrawlJob> {
    assertTransition(expectedStatus, nextStatus);
    return this.updateStatus(
      id,
      expectedStatus,
      expectedVersion,
      nextStatus,
      facts
    );
  }

  public async retry(
    id: string,
    expectedVersion: number
  ): Promise<CrawlJob> {
    const current = await this.getById(id);
    if (!current) {
      throw new CrawlError("POLICY_VIOLATION", "Crawl job was not found");
    }
    retryFailedJob(current.status);
    return this.updateStatus(id, "FAILED", expectedVersion, "QUEUED", {});
  }

  private async updateStatus(
    id: string,
    expectedStatus: CrawlJobStatus,
    expectedVersion: number,
    nextStatus: CrawlJobStatus,
    facts: CompletionFacts
  ): Promise<CrawlJob> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const result = await dbClient().query<CrawlJobRow>(
      `UPDATE crawl_jobs
       SET status = $4, provider_id = COALESCE($6, provider_id),
           provider_job_id = COALESCE($7, provider_job_id),
           duration_ms = COALESCE($8, duration_ms),
           page_count = COALESCE($9, page_count),
           bytes_processed = COALESCE($10, bytes_processed),
           cache_outcome = COALESCE($11, cache_outcome),
           result_ref = COALESCE($12, result_ref),
           error = COALESCE($13, error),
           version = version + 1, updated_at = NOW(),
           started_at = CASE WHEN $4 = 'RUNNING' THEN COALESCE(started_at, NOW()) ELSE started_at END,
           completed_at = CASE WHEN $4 IN ('SUCCEEDED', 'PARTIAL', 'FAILED', 'CANCELLED') THEN NOW() ELSE completed_at END
       WHERE id = $1 AND tenant_id = $5 AND status = $2 AND version = $3
       RETURNING ${columns}`,
      [
        id,
        expectedStatus,
        expectedVersion,
        nextStatus,
        tenantId,
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
    if (!result.rows[0]) {
      throw new CrawlError(
        "POLICY_VIOLATION",
        "Crawl job transition lost an optimistic-lock race"
      );
    }
    return mapJob(result.rows[0]);
  }

  public async heartbeat(
    lease: JobLease,
    expectedVersion: number
  ): Promise<CrawlJob> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const result = await dbClient().query<CrawlJobRow>(
      `UPDATE crawl_jobs
       SET heartbeat_at = NOW(), lease_expires_at = $4,
           updated_at = NOW(), version = version + 1
      WHERE id = $1 AND tenant_id = $5 AND status = 'RUNNING' AND worker_id = $2
         AND version = $3 AND lease_expires_at > NOW()
       RETURNING ${columns}`,
      [lease.jobId, lease.workerId, expectedVersion, lease.leaseExpiresAt, tenantId]
    );
    if (!result.rows[0]) {
      throw new CrawlError("POLICY_VIOLATION", "Crawl job lease is stale");
    }
    return mapJob(result.rows[0]);
  }

  public async cancel(
    id: string,
    expectedStatus: CrawlJobStatus,
    expectedVersion: number,
    reason: string,
    requestedBy: string
  ): Promise<CrawlJob> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    assertTransition(expectedStatus, "CANCELLED");
    const result = await dbClient().query<CrawlJobRow>(
      `UPDATE crawl_jobs
       SET status = 'CANCELLED', cancelled_at = NOW(),
           cancellation_reason = $4, cancellation_requested_by = $5,
           completed_at = NOW(), updated_at = NOW(), version = version + 1
       WHERE id = $1 AND tenant_id = $6 AND status = $2 AND version = $3
       RETURNING ${columns}`,
      [id, expectedStatus, expectedVersion, reason, requestedBy, tenantId]
    );
    if (!result.rows[0]) {
      throw new CrawlError("POLICY_VIOLATION", "Crawl job cancellation lost a race");
    }
    return mapJob(result.rows[0]);
  }
}
