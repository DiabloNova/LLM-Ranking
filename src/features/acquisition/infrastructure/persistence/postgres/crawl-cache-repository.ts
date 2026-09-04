import type { PoolClient, QueryResultRow } from "pg";
import type { CacheOutcome, CrawlResult } from "../../../domain/contracts";
import type { CacheScope } from "../../../domain/identity";
import { CrawlError } from "../../../domain/errors";
import { TenantContextManager } from "../../../../../core/database/tenant-context";

interface CacheRow extends QueryResultRow {
  normalized_result: CrawlResult;
  expires_at: Date;
}

function client(): PoolClient {
  const value = TenantContextManager.getDbClient() as PoolClient | null;
  if (!value) {
    throw new Error("Crawl cache persistence requires an active transaction");
  }
  return value;
}

export interface CacheLookup {
  outcome: CacheOutcome;
  result: CrawlResult | null;
}

function assertTenantScope(scope: CacheScope): void {
  if (scope !== "tenant") {
    throw new CrawlError(
      "CONFIGURATION_ERROR",
      "Only tenant-scoped crawl cache is currently supported"
    );
  }
}

export class CrawlCacheRepository {
  public async get(
    cacheKey: string,
    scope: CacheScope = "tenant",
    bypass = false
  ): Promise<CacheLookup> {
    assertTenantScope(scope);
    if (bypass) {
      return { outcome: "BYPASS", result: null };
    }
    const tenantId = TenantContextManager.getRequiredTenantId();
    const response = await client().query<CacheRow>(
      `SELECT normalized_result, expires_at
       FROM crawl_cache
       WHERE tenant_id = $1 AND cache_scope = $2 AND cache_key = $3
       LIMIT 1`,
      [tenantId, scope, cacheKey]
    );
    const row = response.rows[0];
    if (!row) {
      return { outcome: "MISS", result: null };
    }
    if (row.expires_at.getTime() <= Date.now()) {
      return { outcome: "STALE", result: row.normalized_result };
    }
    return { outcome: "HIT", result: row.normalized_result };
  }

  public async put(
    cacheKey: string,
    result: CrawlResult,
    expiresAt: Date,
    scope: CacheScope = "tenant"
  ): Promise<void> {
    assertTenantScope(scope);
    const tenantId = TenantContextManager.getRequiredTenantId();
    await client().query(
      `INSERT INTO crawl_cache
         (tenant_id, cache_scope, cache_key, normalized_result, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, cache_scope, cache_key)
       DO UPDATE SET normalized_result = EXCLUDED.normalized_result,
                     expires_at = EXCLUDED.expires_at,
                     updated_at = NOW()`,
      [tenantId, scope, cacheKey, JSON.stringify(result), expiresAt]
    );
  }

  public async invalidate(
    cacheKey: string,
    scope: CacheScope = "tenant"
  ): Promise<void> {
    assertTenantScope(scope);
    const tenantId = TenantContextManager.getRequiredTenantId();
    await client().query(
      `DELETE FROM crawl_cache
       WHERE tenant_id = $1 AND cache_scope = $2 AND cache_key = $3`,
      [tenantId, scope, cacheKey]
    );
  }
}
