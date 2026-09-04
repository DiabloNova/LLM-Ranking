import { randomUUID } from "node:crypto";
import { coreEventBus, type DomainEvent } from "../../../core/events";
import { TenantContextManager } from "../../../core/database/tenant-context";
import { CrawlError } from "../domain/errors";
import { computeCacheKey } from "../domain/identity";
import type {
  CacheOutcome,
  CrawlJob,
  CrawlRequest,
  CrawlResult
} from "../domain/contracts";
import { resolveCrawlPolicy } from "../domain/policy";
import { normalizeUrl } from "../domain/url/normalizer";
import {
  CrawlCacheRepository,
  CrawlJobRepository,
  CrawlResultRepository
} from "../infrastructure/persistence/postgres";
import { resolveAndValidateHost } from "../infrastructure/security/ssrf-guard";
import { ProviderRouter } from "./provider-router";
import { HttpCrawlProvider } from "../infrastructure/providers/http-crawl-provider";
import { FirecrawlCrawlProvider } from "../infrastructure/providers/firecrawl/firecrawl-crawl-provider";

function defaultRouter(): ProviderRouter {
  const internal = new HttpCrawlProvider();
  if (!process.env.FIRECRAWL_API_KEY) {
    return new ProviderRouter([internal]);
  }
  return new ProviderRouter([new FirecrawlCrawlProvider(), internal]);
}

export interface CrawlSubmission {
  job: CrawlJob | null;
  cacheOutcome: CacheOutcome;
  result?: CrawlResult;
}

export interface CrawlExecutionOptions {
  runTenantOperation?: <T>(operation: () => Promise<T>) => Promise<T>;
  completeIfLeaseOwner?: (
    status: "SUCCEEDED" | "PARTIAL" | "FAILED" | "CANCELLED",
    expectedVersion: number,
    facts: import("../infrastructure/persistence/postgres/crawl-job-repository").CompletionFacts
  ) => Promise<boolean>;
  getExpectedVersion?: () => number;
}

function event(
  type: string,
  request: CrawlRequest,
  jobId: string,
  providerJobId?: string
): DomainEvent {
  const now = new Date().toISOString();
  return {
    eventType: type,
    aggregateId: jobId,
    metadata: {
      eventId: randomUUID(),
      organizationId: request.tenantId,
      actorId: request.requestId ?? "system",
      timestamp: now,
      correlationId: request.correlationId ?? request.requestId ?? jobId,
      causationId: request.requestId ?? jobId,
      version: 1
    },
    payload: {
      tenantId: request.tenantId,
      jobId,
      requestId: request.requestId,
      traceId: request.traceId,
      correlationId: request.correlationId,
      providerJobId
    }
  };
}

export class CrawlOrchestrator {
  public constructor(
    private readonly jobs = new CrawlJobRepository(),
    private readonly cache = new CrawlCacheRepository(),
    private readonly results = new CrawlResultRepository(),
    private readonly router = defaultRouter(),
    private readonly validateHost: typeof resolveAndValidateHost = resolveAndValidateHost
  ) {}

  public async submit(
    tenantId: string,
    requestedUrl: string,
    partialPolicy: Partial<CrawlRequest["policy"]>,
    priority = 0,
    requestId?: string,
    correlationId?: string,
    traceId?: string,
    bypassCache = false
  ): Promise<CrawlSubmission> {
    const policy = resolveCrawlPolicy(partialPolicy);
    const normalized = normalizeUrl(requestedUrl, policy.stripTrackingParams);
    if (!normalized.ok) {
      throw normalized.error;
    }
    const host = await this.validateHost(normalized.value.asciiHost);
    if (!host.ok) {
      throw host.error;
    }
    const request: CrawlRequest = {
      tenantId,
      requestedUrl,
      normalizedUrl: normalized.value,
      policy,
      priority,
      requestId,
      correlationId,
      traceId,
      bypassCache
    };
    const cacheKey = computeCacheKey(tenantId, normalized.value, policy);
    await coreEventBus.publish(event("crawl.requested", request, cacheKey));
    const cached = await this.cache.get(cacheKey, "tenant", bypassCache);
    if (cached.outcome === "HIT") {
      await coreEventBus.publish(event("crawl.cache_hit", request, cacheKey));
      return { job: null, cacheOutcome: cached.outcome, result: cached.result ?? undefined };
    }
    await coreEventBus.publish(event("crawl.cache_miss", request, cacheKey));
    const outcome = await this.jobs.createOrGetByDedupWithOutcome({
      request,
      cacheKey
    });
    let job = outcome.job;
    if (!outcome.created) {
      await coreEventBus.publish(event("crawl.deduplicated", request, job.id));
    } else {
      job = await this.jobs.transition(job.id, "PENDING", job.version, "QUEUED");
      await coreEventBus.publish(event("crawl.queued", request, job.id));
    }
    return { job, cacheOutcome: cached.outcome };
  }

  public async execute(
    job: CrawlJob,
    signal: AbortSignal,
    options: CrawlExecutionOptions = {}
  ): Promise<CrawlJob> {
    const runTenant = options.runTenantOperation ?? (async <T>(operation: () => Promise<T>) => operation());
    const request: CrawlRequest = {
      tenantId: job.tenantId,
      requestedUrl: job.requestedUrl,
      normalizedUrl: job.normalizedUrl,
      policy: job.policy,
      priority: job.priority,
      requestId: job.requestId,
      correlationId: job.correlationId,
      traceId: job.traceId,
      bypassCache: job.cacheOutcome === "BYPASS"
    };
    const startedAt = Date.now();
    await coreEventBus.publish(event("crawl.started", request, job.id));
    try {
      const result = await this.router.execute(request, signal, {
        onSelected: providerId => {
          void coreEventBus.publish(
            event("crawl.provider_selected", request, job.id, providerId)
          );
        },
        onFailed: providerId => {
          void coreEventBus.publish(
            event("crawl.provider_failed", request, job.id, providerId)
          );
        },
        onRetry: providerId => {
          void coreEventBus.publish(
            event("crawl.retry", request, job.id, providerId)
          );
        },
        onFallback: (fromProviderId, toProviderId) => {
          void coreEventBus.publish(
            event("crawl.fallback", request, job.id, `${fromProviderId}:${toProviderId}`)
          );
        }
      });
      if (result.partial) {
        await coreEventBus.publish(event("crawl.partial", request, job.id));
      }
      const resultRef = await runTenant(() => this.results.put(job.id, result));
      await runTenant(() =>
        this.cache.put(
          job.cacheKey,
          result,
          new Date(Date.now() + job.policy.cacheTtlMs)
        )
      );
      const status = result.partial ? "PARTIAL" : "SUCCEEDED";
      const facts = {
        providerId: result.provider.id,
        providerJobId: result.provider.jobId,
        durationMs: Date.now() - startedAt,
        pageCount: result.pageCount,
        bytesProcessed: result.bytesProcessed,
        cacheOutcome: "MISS" as const,
        resultRef
      };
      let completed: CrawlJob;
      if (options.completeIfLeaseOwner) {
        const accepted = await options.completeIfLeaseOwner(
          status,
          options.getExpectedVersion?.() ?? job.version,
          facts
        );
        if (!accepted) {
          throw new CrawlError("POLICY_VIOLATION", "Crawl lease is no longer owned");
        }
        completed = await runTenant(async () => {
          const current = await this.jobs.getById(job.id);
          if (!current) {
            throw new CrawlError("POLICY_VIOLATION", "Crawl job disappeared");
          }
          return current;
        });
      } else {
        completed = await runTenant(async () => {
          const current = await this.jobs.getById(job.id);
          if (!current) {
            throw new CrawlError("POLICY_VIOLATION", "Crawl job disappeared");
          }
          return this.jobs.transition(job.id, current.status, current.version, status, facts);
        });
      }
      await coreEventBus.publish(event("crawl.completed", request, completed.id));
      return completed;
    } catch (error) {
      const crawlError =
        error instanceof CrawlError
          ? error
          : new CrawlError("UNKNOWN", "Crawl execution failed");
      if (crawlError.code !== "CANCELLED") {
        const facts = {
          durationMs: Date.now() - startedAt,
          error: {
            code: crawlError.code,
            public: crawlError.toPublicError()
          }
        };
        if (options.completeIfLeaseOwner) {
          await options.completeIfLeaseOwner(
            "FAILED",
            options.getExpectedVersion?.() ?? job.version,
            facts
          );
        } else {
          await runTenant(async () => {
            const current = await this.jobs.getById(job.id);
            if (current && current.status !== "CANCELLED") {
              return this.jobs.transition(
                job.id,
                current.status,
                current.version,
                "FAILED",
                facts
              );
            }
            return current;
          });
        }
      }
      await coreEventBus.publish(
        event(
          crawlError.code === "CANCELLED" ? "crawl.cancelled" : "crawl.failed",
          request,
          job.id
        )
      );
      throw crawlError;
    }
  }

  public static requireTenant(): string {
    return TenantContextManager.getRequiredTenantId();
  }
}
