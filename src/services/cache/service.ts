import { ICacheStore } from "./types";
import crypto from "crypto";
import { requireSession } from "../auth/session";

export interface CacheTTLPolicy {
  llmResponse: number;  // TTL in seconds
  crawlResult: number;
  queryResult: number;
}

export const defaultTTLPolicy: CacheTTLPolicy = {
  llmResponse: 3600 * 24, // 24 hours
  crawlResult: 3600 * 12, // 12 hours
  queryResult: 3600 * 2    // 2 hours
};

export class CacheService {
  constructor(
    private store: ICacheStore,
    private ttlPolicy: CacheTTLPolicy = defaultTTLPolicy
  ) {}

  /**
   * Internal defense-in-depth verification check.
   * Asserts that the caller's target tenantId strictly matches their active authenticated server-side session.
   * Super Admin has administrative permission to bypass the target workspace context.
   */
  private async validateTenantContext(tenantId: string): Promise<void> {
    const session = await requireSession();
    if (!session.user) {
      throw new Error("Security Violation: Unauthenticated cache access.");
    }
    if (session.user.role !== "super_admin" && session.user.workspaceId !== tenantId) {
      throw new Error(`Security Violation: Caller tenant context (${tenantId}) mismatches verified session context (${session.user.workspaceId}).`);
    }
  }

  /**
   * Generates a secure, deterministic, tenant-isolated cache key.
   */
  generateKey(options: {
    tenantId: string;
    category: "llm" | "crawl" | "query";
    inputs: Record<string, any>;
    version?: string;
  }): string {
    const sortedInputs = JSON.stringify(options.inputs, Object.keys(options.inputs).sort());
    const inputHash = crypto.createHash("sha256").update(sortedInputs).digest("hex");
    const ver = options.version || "v1";

    // Strict Tenant Isolation Invariant: keys are ALWAYS prefixed by tenant scope
    return `tenant:${options.tenantId}:${options.category}:${inputHash}:${ver}`;
  }

  /**
   * Gets a value from the tenant-scoped cache.
   */
  async get<T>(tenantId: string, key: string): Promise<T | null> {
    // Assert tenant matches secure session context (preventing client-controlled tenantId spoofing)
    await this.validateTenantContext(tenantId);

    // Defense-in-depth: assert that the requested key actually contains the caller's tenantId prefix
    if (!key.startsWith(`tenant:${tenantId}:`)) {
      throw new Error(`Security Violation: Cross-tenant cache access blocked. Tenant ${tenantId} requested key ${key}.`);
    }
    return await this.store.get<T>(key);
  }

  /**
   * Sets a value in the tenant-scoped cache.
   */
  async set<T>(
    tenantId: string,
    key: string,
    value: T,
    category: "llm" | "crawl" | "query"
  ): Promise<void> {
    // Assert tenant matches secure session context (preventing client-controlled tenantId spoofing)
    await this.validateTenantContext(tenantId);

    if (!key.startsWith(`tenant:${tenantId}:`)) {
      throw new Error(`Security Violation: Cross-tenant cache write blocked. Tenant ${tenantId} requested key ${key}.`);
    }

    let ttlSeconds = this.ttlPolicy.llmResponse;
    if (category === "crawl") ttlSeconds = this.ttlPolicy.crawlResult;
    if (category === "query") ttlSeconds = this.ttlPolicy.queryResult;

    await this.store.set(key, value, { ttlSeconds });
  }

  /**
   * Invalidates a single cache key.
   */
  async invalidateKey(tenantId: string, key: string): Promise<void> {
    // Assert tenant matches secure session context (preventing client-controlled tenantId spoofing)
    await this.validateTenantContext(tenantId);

    if (!key.startsWith(`tenant:${tenantId}:`)) {
      throw new Error(`Security Violation: Cross-tenant cache invalidation blocked.`);
    }
    await this.store.delete(key);
  }

  /**
   * Invalidates an entire namespace for a tenant (e.g. tenant:ws-test-99:*)
   * No tenant can ever invalidate or access another tenant's namespace.
   */
  async invalidateTenantNamespace(tenantId: string, category?: "llm" | "crawl" | "query"): Promise<void> {
    // Assert tenant matches secure session context (preventing client-controlled tenantId spoofing)
    await this.validateTenantContext(tenantId);

    const keys = await this.store.getKeys();
    const prefix = category
      ? `tenant:${tenantId}:${category}:`
      : `tenant:${tenantId}:`;

    for (const key of keys) {
      if (key.startsWith(prefix)) {
        await this.store.delete(key);
      }
    }
  }
}
