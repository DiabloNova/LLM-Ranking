import { CrawlError } from "./errors";

export type RobotsPolicy = "respect" | "ignore";

export interface CrawlPolicy {
  maxPages: number;
  maxDepth: number;
  maxDurationMs: number;
  maxResponseBytes: number;
  maxRedirects: number;
  maxConcurrency: number;
  requestTimeoutMs: number;
  connectTimeoutMs: number;
  maxAttempts: number;
  retryBaseDelayMs: number;
  retryMaxDelayMs: number;
  allowedSchemes: string[];
  allowedContentTypes: string[];
  robotsPolicy: RobotsPolicy;
  perHostRequestsPerSecond: number;
  stripTrackingParams: boolean;
  cacheTtlMs: number;
  followRedirects: boolean;
}

export const CRAWL_POLICY_CEILINGS = {
  maxPages: 1000,
  maxDepth: 10,
  maxDurationMs: 1_800_000,
  maxResponseBytes: 25 * 1024 * 1024,
  maxRedirects: 10,
  maxConcurrency: 16,
  requestTimeoutMs: 120_000,
  connectTimeoutMs: 30_000,
  maxAttempts: 10,
  retryBaseDelayMs: 60_000,
  retryMaxDelayMs: 600_000,
  perHostRequestsPerSecond: 100,
  cacheTtlMs: 86_400_000
} as const;

export const DEFAULT_CRAWL_POLICY: CrawlPolicy = {
  maxPages: 100,
  maxDepth: 3,
  maxDurationMs: 300_000,
  maxResponseBytes: 5 * 1024 * 1024,
  maxRedirects: 5,
  maxConcurrency: 4,
  requestTimeoutMs: 30_000,
  connectTimeoutMs: 10_000,
  maxAttempts: 3,
  retryBaseDelayMs: 500,
  retryMaxDelayMs: 30_000,
  allowedSchemes: ["http", "https"],
  allowedContentTypes: ["text/html", "application/xhtml+xml", "text/plain"],
  robotsPolicy: "respect",
  perHostRequestsPerSecond: 2,
  stripTrackingParams: true,
  cacheTtlMs: 3_600_000,
  followRedirects: true
};

const integerFields = new Set<keyof CrawlPolicy>([
  "maxPages",
  "maxDepth",
  "maxDurationMs",
  "maxResponseBytes",
  "maxRedirects",
  "maxConcurrency",
  "requestTimeoutMs",
  "connectTimeoutMs",
  "maxAttempts",
  "retryBaseDelayMs",
  "retryMaxDelayMs",
  "perHostRequestsPerSecond",
  "cacheTtlMs"
]);

export interface PolicyViolation {
  field: string;
  reason: string;
  value: unknown;
}

export function validateCrawlPolicy(
  policy: CrawlPolicy
):
  | { ok: true; policy: CrawlPolicy }
  | { ok: false; error: CrawlError; violations: PolicyViolation[] } {
  const violations: PolicyViolation[] = [];
  for (const field of integerFields) {
    const value = policy[field];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
      violations.push({
        field,
        reason: "must be a non-negative integer",
        value
      });
    }
    const ceiling =
      CRAWL_POLICY_CEILINGS[field as keyof typeof CRAWL_POLICY_CEILINGS];
    if (typeof value === "number" && value > ceiling) {
      violations.push({
        field,
        reason: `exceeds ceiling ${ceiling}`,
        value
      });
    }
  }
  for (const field of [
    "maxPages",
    "maxDurationMs",
    "maxResponseBytes",
    "maxConcurrency",
    "requestTimeoutMs",
    "connectTimeoutMs",
    "maxAttempts",
    "perHostRequestsPerSecond"
  ] as const) {
    if (policy[field] === 0) {
      violations.push({
        field,
        reason: "must be greater than zero",
        value: policy[field]
      });
    }
  }
  if (
    !Array.isArray(policy.allowedSchemes) ||
    policy.allowedSchemes.length === 0 ||
    policy.allowedSchemes.some(s => !["http", "https"].includes(s.toLowerCase()))
  ) {
    violations.push({
      field: "allowedSchemes",
      reason: "contains unknown or no schemes",
      value: policy.allowedSchemes
    });
  }
  if (
    !Array.isArray(policy.allowedContentTypes) ||
    policy.allowedContentTypes.length === 0
  ) {
    violations.push({
      field: "allowedContentTypes",
      reason: "must not be empty",
      value: policy.allowedContentTypes
    });
  }
  if (
    policy.robotsPolicy !== "respect" &&
    policy.robotsPolicy !== "ignore"
  ) {
    violations.push({
      field: "robotsPolicy",
      reason: "unknown policy",
      value: policy.robotsPolicy
    });
  }
  if (typeof policy.stripTrackingParams !== "boolean") {
    violations.push({
      field: "stripTrackingParams",
      reason: "must be boolean",
      value: policy.stripTrackingParams
    });
  }
  if (typeof policy.followRedirects !== "boolean") {
    violations.push({
      field: "followRedirects",
      reason: "must be boolean",
      value: policy.followRedirects
    });
  }
  if (policy.retryMaxDelayMs < policy.retryBaseDelayMs) {
    violations.push({
      field: "retryMaxDelayMs",
      reason: "must be at least retryBaseDelayMs",
      value: policy.retryMaxDelayMs
    });
  }
  return violations.length
    ? {
        ok: false,
        violations,
        error: new CrawlError(
          "POLICY_VIOLATION",
          "Invalid crawl policy",
          { violationCount: violations.length }
        )
      }
    : { ok: true, policy };
}

export function resolveCrawlPolicy(partial: Partial<CrawlPolicy>): CrawlPolicy {
  const policy = { ...DEFAULT_CRAWL_POLICY, ...partial };
  const result = validateCrawlPolicy(policy);
  if (!result.ok) {
    throw result.error;
  }
  return result.policy;
}
