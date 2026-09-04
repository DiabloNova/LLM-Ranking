import assert from "node:assert/strict";
import { FirecrawlCrawlProvider } from "../../../src/features/acquisition/infrastructure/providers/firecrawl/firecrawl-crawl-provider";
import { CrawlError } from "../../../src/features/acquisition/domain/errors";
import { resolveCrawlPolicy } from "../../../src/features/acquisition/domain/policy";
import { normalizeUrl } from "../../../src/features/acquisition/domain/url/normalizer";
import type { CrawlRequest } from "../../../src/features/acquisition/domain/contracts";

function request(): CrawlRequest {
  const normalized = normalizeUrl("https://example.com/");
  if (!normalized.ok) {
    throw normalized.error;
  }
  return {
    tenantId: "test-tenant",
    requestedUrl: "https://example.com/",
    normalizedUrl: normalized.value,
    policy: resolveCrawlPolicy({ robotsPolicy: "ignore" }),
    priority: 0
  };
}

export async function testProviders(): Promise<void> {
  const provider = new FirecrawlCrawlProvider({
    crawlUrl: async () => ({
      success: true,
      status: "completed",
      data: [
        {
          url: "https://example.com/",
          markdown: "hello"
        }
      ]
    })
  });
  const originalKey = process.env.FIRECRAWL_API_KEY;
  process.env.FIRECRAWL_API_KEY = "test-key";
  try {
    const crawlRequest = request();
    const result = await provider.execute(
      crawlRequest,
      crawlRequest.policy,
      new AbortController().signal
    );
    assert.equal(result.provider.id, "firecrawl");
    assert.equal(result.documents[0]?.text, "hello");
    assert.equal(result.partial, false);
    const partial = new FirecrawlCrawlProvider({
      crawlUrl: async () => ({
        success: true,
        status: "partial",
        data: [{ url: "https://example.com/", markdown: "partial" }]
      })
    });
    assert.equal(
      (await partial.execute(crawlRequest, crawlRequest.policy, new AbortController().signal))
        .partial,
      true
    );
    await assert.rejects(
      () =>
        new FirecrawlCrawlProvider({
          crawlUrl: async () => ({ success: false, error: "401 Unauthorized" })
        }).execute(request(), request().policy, new AbortController().signal),
      (error: unknown) =>
        error instanceof CrawlError && error.code === "AUTHENTICATION_ERROR"
    );
    await assert.rejects(
      () =>
        new FirecrawlCrawlProvider({
          crawlUrl: async () => ({ success: true, data: "invalid" })
        }).execute(request(), request().policy, new AbortController().signal),
      (error: unknown) =>
        error instanceof CrawlError && error.code === "PROVIDER_ERROR"
    );
    await assert.rejects(
      () =>
        new FirecrawlCrawlProvider({
          crawlUrl: async () => {
            throw new Error("request timed out");
          }
        }).execute(request(), request().policy, new AbortController().signal),
      (error: unknown) => error instanceof CrawlError && error.code === "TIMEOUT"
    );
    await assert.rejects(
      () =>
        new FirecrawlCrawlProvider({
          crawlUrl: async () => ({ success: false, error: "429 Too Many Requests" })
        }).execute(request(), request().policy, new AbortController().signal),
      (error: unknown) => error instanceof CrawlError && error.code === "RATE_LIMITED"
    );
  } finally {
    if (originalKey === undefined) {
      delete process.env.FIRECRAWL_API_KEY;
    } else {
      process.env.FIRECRAWL_API_KEY = originalKey;
    }
  }
}
