import assert from "node:assert/strict";
import { CrawlError } from "../../../src/features/acquisition/domain/errors";
import { resolveCrawlPolicy } from "../../../src/features/acquisition/domain/policy";
import type {
  CrawlProvider,
  CrawlRequest,
  CrawlResult
} from "../../../src/features/acquisition/domain/contracts";
import { ProviderRouter } from "../../../src/features/acquisition/application/provider-router";
import { normalizeUrl } from "../../../src/features/acquisition/domain/url/normalizer";

function request(): CrawlRequest {
  const normalized = normalizeUrl("https://example.com/");
  if (!normalized.ok) {
    throw normalized.error;
  }
  return {
    tenantId: "router-test",
    requestedUrl: normalized.value.canonical,
    normalizedUrl: normalized.value,
    policy: resolveCrawlPolicy({
      robotsPolicy: "ignore",
      maxAttempts: 2,
      retryBaseDelayMs: 1,
      retryMaxDelayMs: 2
    }),
    priority: 0
  };
}

function result(id: string): CrawlResult {
  return {
    documents: [],
    pageCount: 0,
    bytesProcessed: 0,
    partial: false,
    durationMs: 1,
    provider: { id },
    errors: []
  };
}

export async function testRouter(): Promise<void> {
  const crawlRequest = request();
  let blockedCalls = 0;
  const blocked: CrawlProvider = {
    id: "blocked",
    capabilities: {
      supportsJavaScript: false,
      supportsRobots: false,
      supportsTraversal: false
    },
    execute: async () => {
      blockedCalls += 1;
      throw new CrawlError("SSRF_BLOCKED", "blocked");
    }
  };
  const fallback: CrawlProvider = {
    ...blocked,
    id: "fallback",
    execute: async () => result("fallback")
  };
  await assert.rejects(
    () => new ProviderRouter([blocked, fallback]).execute(crawlRequest, new AbortController().signal),
    (error: unknown) => error instanceof CrawlError && error.code === "SSRF_BLOCKED"
  );
  assert.equal(blockedCalls, 1);

  let attempts = 0;
  const retryable: CrawlProvider = {
    ...blocked,
    id: "retryable",
    execute: async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new CrawlError("TIMEOUT", "retry");
      }
      return result("retryable");
    }
  };
  assert.equal(
    (await new ProviderRouter([retryable], 1, 2).execute(crawlRequest, new AbortController().signal))
      .provider.id,
    "retryable"
  );
  assert.equal(attempts, 2);
}
