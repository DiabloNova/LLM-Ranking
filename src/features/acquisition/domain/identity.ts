import { createHash } from "node:crypto";
import type { CrawlPolicy } from "./policy";
import type { NormalizedUrl } from "./url/normalizer";

export type CacheScope = "tenant" | "global";

const materialFields = [
  "maxPages",
  "maxDepth",
  "maxResponseBytes",
  "allowedContentTypes",
  "allowedSchemes",
  "robotsPolicy",
  "followRedirects",
  "maxRedirects",
  "stripTrackingParams"
] as const;

function stable(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stable).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stable(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(value: unknown): string {
  return createHash("sha256").update(stable(value)).digest("hex");
}

function material(policy: CrawlPolicy): Record<string, unknown> {
  return Object.fromEntries(
    materialFields.map(field => [field, policy[field]])
  );
}

/**
 * Material fields affect the result; retry, backoff, concurrency, and timeout
 * fields only affect effort and are excluded.
 */
export function computeDedupKey(
  tenantId: string,
  normalizedUrl: NormalizedUrl,
  policy: CrawlPolicy
): string {
  return digest({
    tenantId,
    url: normalizedUrl.canonical,
    policy: material(policy)
  });
}

export function computeCacheKey(
  tenantId: string,
  normalizedUrl: NormalizedUrl,
  policy: CrawlPolicy,
  scope: CacheScope = "tenant"
): string {
  return digest({
    scope,
    tenantId: scope === "tenant" ? tenantId : undefined,
    url: normalizedUrl.canonical,
    policy: material(policy)
  });
}
