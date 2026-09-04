import assert from "node:assert/strict";
import { createServer } from "node:http";
import { HttpCrawlProvider } from "../../../src/features/acquisition/infrastructure/providers/http-crawl-provider";
import { resolveCrawlPolicy } from "../../../src/features/acquisition/domain/policy";
import { normalizeUrl } from "../../../src/features/acquisition/domain/url/normalizer";
import type { CrawlRequest } from "../../../src/features/acquisition/domain/contracts";
import type { Resolver } from "../../../src/features/acquisition/infrastructure/security/ssrf-guard";

export async function testHttpProviderLimits(): Promise<void> {
  let active = 0;
  let peak = 0;
  const starts = new Map<string, number[]>();
  let port = 0;
  const server = createServer((request, response) => {
    const host = (request.headers.host ?? "").split(":")[0];
    const key = `${host}${request.url ?? "/"}`;
    const hostStarts = starts.get(host) ?? [];
    hostStarts.push(Date.now());
    starts.set(host, hostStarts);
    active += 1;
    peak = Math.max(peak, active);
    setTimeout(() => {
      active -= 1;
      const links = host === "a.test"
        ? `<a href="http://a.test:${port}/a1">a1</a><a href="http://b.test:${port}/b1">b1</a>`
        : `<a href="http://b.test:${port}/b2">b2</a><a href="http://a.test:${port}/a2">a2</a>`;
      response
        .writeHead(200, { "content-type": "text/html" })
        .end(`<title>${key}</title>${links}`);
    }, 40);
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  port = address.port;
  const normalized = normalizeUrl(`http://a.test:${port}/`);
  assert.ok(normalized.ok);
  const request: CrawlRequest = {
    tenantId: "http-provider-test",
    requestedUrl: normalized.value.canonical,
    normalizedUrl: normalized.value,
    policy: resolveCrawlPolicy({
      robotsPolicy: "ignore",
      maxPages: 4,
      maxDepth: 2,
      maxConcurrency: 2,
      perHostRequestsPerSecond: 10
    }),
    priority: 0
  };
  const provider = new HttpCrawlProvider({
    resolver: (async () => [
      { address: "127.0.0.1", family: 4 }
    ]) satisfies Resolver,
    hostValidator: async () => ({ ok: true, ips: ["127.0.0.1"] })
  });
  const result = await provider.execute(request, request.policy, new AbortController().signal);
  assert.equal(result.pageCount, 4);
  assert.ok(peak <= 2);
  for (const times of starts.values()) {
    for (let index = 1; index < times.length; index += 1) {
      assert.ok(times[index] - times[index - 1] >= 90);
    }
  }
  await new Promise<void>(resolve => server.close(() => resolve()));
}
