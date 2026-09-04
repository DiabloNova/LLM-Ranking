import assert from "node:assert/strict";
import {
  CRAWL_POLICY_CEILINGS,
  DEFAULT_CRAWL_POLICY,
  resolveCrawlPolicy,
  validateCrawlPolicy
} from "../../../src/features/acquisition/domain/policy";
import {
  computeCacheKey,
  computeDedupKey
} from "../../../src/features/acquisition/domain/identity";
import { normalizeUrl } from "../../../src/features/acquisition/domain/url/normalizer";

export function testPolicyIdentity(): void {
  const policy = resolveCrawlPolicy({});
  for (const [field, ceiling] of Object.entries(CRAWL_POLICY_CEILINGS)) {
    assert.equal(
      validateCrawlPolicy({ ...policy, [field]: ceiling + 1 }).ok,
      false,
      field
    );
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
  ]) {
    assert.equal(validateCrawlPolicy({ ...policy, [field]: 0 }).ok, false);
    assert.equal(validateCrawlPolicy({ ...policy, [field]: -1 }).ok, false);
    assert.equal(validateCrawlPolicy({ ...policy, [field]: 1.5 }).ok, false);
  }
  assert.equal(validateCrawlPolicy({ ...policy, maxDepth: 0 }).ok, true);
  assert.equal(validateCrawlPolicy({ ...policy, maxRedirects: 0 }).ok, true);
  const url = normalizeUrl("https://example.com");
  assert.equal(url.ok, true);
  if (!url.ok) {
    return;
  }
  assert.notEqual(
    computeDedupKey("tenant", url.value, { ...policy, maxPages: 10 }),
    computeDedupKey("tenant", url.value, { ...policy, maxPages: 100 })
  );
  assert.equal(
    computeDedupKey("tenant", url.value, { ...policy, maxAttempts: 1 }),
    computeDedupKey("tenant", url.value, { ...policy, maxAttempts: 5 })
  );
  assert.notEqual(
    computeCacheKey("tenant", url.value, policy),
    computeCacheKey("other", url.value, policy)
  );
  assert.equal(
    computeCacheKey("tenant", url.value, policy, "global"),
    computeCacheKey("other", url.value, policy, "global")
  );
  assert.match(computeCacheKey("tenant", url.value, policy), /^[a-f0-9]{64}$/);
  assert.equal(DEFAULT_CRAWL_POLICY.stripTrackingParams, true);
}
