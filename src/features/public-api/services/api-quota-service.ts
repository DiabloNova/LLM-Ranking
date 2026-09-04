import { PostgresClient } from "../../../features/admin/infrastructure/persistence/postgres";
import { TenantContextManager } from "../../../core/database/tenant-context";
import { InMemoryCacheStore } from "../../../services/cache/store"; // Using existing store infra for rate limiting

// Realistically this would be Redis, but we use the provided CacheStore interface implementation
const rateLimitStore = new InMemoryCacheStore();

export class ApiQuotaService {
  private pg: PostgresClient;

  constructor() {
    this.pg = PostgresClient.getInstance();
  }

  /**
   * Enforces usage limits for API tokens (or other metrics depending on endpoint).
   * Throws if quota is exceeded.
   */
  public async enforceAndConsumeQuota(tenantId: string, tokensToConsume: number = 1): Promise<void> {
    await TenantContextManager.runWithTenantContext(
      tenantId,
      "system",
      "api-quota-check",
      async () => {
        const sql = `SELECT * FROM tenant_quotas WHERE tenant_id = $1 LIMIT 1;`;
        const res = await this.pg.query(sql, [tenantId]);

        if (!res.rows || res.rows.length === 0) {
          throw new Error("Quota Not Found");
        }

        const q = res.rows[0];

        if (q.used_tokens_this_month + tokensToConsume > q.monthly_token_limit) {
          throw new Error("Usage Limit Exceeded");
        }

        const updateSql = `UPDATE tenant_quotas SET used_tokens_this_month = used_tokens_this_month + $1, updated_at = NOW() WHERE tenant_id = $2;`;
        await this.pg.query(updateSql, [tokensToConsume, tenantId]);
      }
    );
  }

  /**
   * Enforces rate limiting per tenant.
   * Returns true if allowed, false if rate limited.
   */
  public async checkRateLimit(tenantId: string, maxRequests: number = 100, windowMs: number = 60000): Promise<{ allowed: boolean, remaining: number }> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const key = `ratelimit:${tenantId}`;

    // We fetch a list of timestamps
    const timestampsRaw = await rateLimitStore.get<number[]>(key) || [];

    // Filter timestamps within the current window
    const validTimestamps = timestampsRaw.filter(t => t > windowStart);

    if (validTimestamps.length >= maxRequests) {
      // Over limit
      // Still write it back so it doesn't expire immediately, but don't add the new one.
      await rateLimitStore.set(key, validTimestamps, { ttlSeconds: Math.ceil(windowMs / 1000) });
      return { allowed: false, remaining: 0 };
    }

    // Add current timestamp
    validTimestamps.push(now);
    await rateLimitStore.set(key, validTimestamps, { ttlSeconds: Math.ceil(windowMs / 1000) });

    return { allowed: true, remaining: maxRequests - validTimestamps.length };
  }
}
