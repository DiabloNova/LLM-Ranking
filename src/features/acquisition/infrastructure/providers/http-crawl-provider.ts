import * as cheerio from "cheerio";
import { convert } from "html-to-text";
import { CrawlError } from "../../domain/errors";
import type {
  CrawlProvider,
  CrawlRequest,
  CrawlResult,
  CrawledDocument
} from "../../domain/contracts";
import type { CrawlPolicy } from "../../domain/policy";
import { normalizeUrl } from "../../domain/url/normalizer";
import { safeFetch } from "../http/safe-fetcher";
import type { HostValidationResult, Resolver } from "../security/ssrf-guard";

interface QueueEntry {
  url: string;
  depth: number;
}

function contentType(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").split(";")[0];
}

function robotsDisallows(robots: string, path: string): boolean {
  let applies = false;
  for (const rawLine of robots.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separator = line.indexOf(":");
    if (separator < 0) {
      continue;
    }
    const name = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (name === "user-agent") {
      applies = value === "*" || value.toLowerCase() === "seorchable-crawler";
    } else if (applies && name === "disallow" && value && path.startsWith(value)) {
      return true;
    }
  }
  return false;
}

function linksFromHtml(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) {
      return;
    }
    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
        return;
      }
      const normalized = normalizeUrl(resolved.toString());
      if (normalized.ok) {
        links.add(normalized.value.canonical);
      }
    } catch {
      return;
    }
  });
  return [...links];
}

function documentFromResponse(
  requestedUrl: string,
  finalUrl: string,
  depth: number,
  response: Awaited<ReturnType<typeof safeFetch>>
): CrawledDocument {
  const html = response.body.toString("utf8");
  return {
    canonicalUrl: response.finalUrl.canonical,
    requestedUrl,
    finalUrl,
    httpStatus: response.status,
    contentType: contentType(response.headers["content-type"]),
    text: convert(html, {
      wordwrap: false,
      selectors: [
        { selector: "script", format: "skip" },
        { selector: "style", format: "skip" },
        { selector: "nav", format: "skip" },
        { selector: "footer", format: "skip" }
      ]
    }),
    html,
    links: linksFromHtml(html, finalUrl),
    metadata: {
      title: cheerio.load(html)("title").first().text() || undefined
    },
    fetchedAt: new Date().toISOString(),
    bytes: response.body.byteLength,
    depth
  };
}

function delay(delayMs: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.reject(new CrawlError("CANCELLED", "Crawl was cancelled"));
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, delayMs);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new CrawlError("CANCELLED", "Crawl was cancelled"));
      },
      { once: true }
    );
  });
}

export class HttpCrawlProvider implements CrawlProvider {
  public constructor(
    private readonly fetchOptions: {
      resolver?: Resolver;
      hostValidator?: (host: string) => Promise<HostValidationResult>;
    } = {}
  ) {}
  public readonly id = "internal-http";
  public readonly capabilities = {
    supportsJavaScript: false,
    supportsRobots: true,
    supportsTraversal: true
  };

  public async execute(
    request: CrawlRequest,
    policy: CrawlPolicy,
    signal: AbortSignal
  ): Promise<CrawlResult> {
    const startedAt = Date.now();
    const queue: QueueEntry[] = [
      { url: request.normalizedUrl.canonical, depth: 0 }
    ];
    const visited = new Set<string>();
    const documents: CrawledDocument[] = [];
    const robotsCache = new Map<string, Promise<string>>();
    const lastRequestAt = new Map<string, number>();
    const hostLocks = new Map<string, Promise<void>>();
    let bytesProcessed = 0;

    const requestHost = async (host: string): Promise<void> => {
      const spacing = 1000 / policy.perHostRequestsPerSecond;
      const previous = hostLocks.get(host) ?? Promise.resolve();
      let release!: () => void;
      const current = new Promise<void>(resolve => {
        release = resolve;
      }
      );
      hostLocks.set(host, current);
      await previous;
      try {
        const lastRequest = lastRequestAt.get(host) ?? 0;
        const remaining = spacing - (Date.now() - lastRequest);
        if (remaining > 0) {
          await delay(remaining, signal);
        }
        lastRequestAt.set(host, Date.now());
      } finally {
        release();
        if (hostLocks.get(host) === current) {
          hostLocks.delete(host);
        }
      }
    };
    const processEntry = async (entry: QueueEntry): Promise<CrawledDocument | null> => {
      if (signal.aborted) {
        throw new CrawlError("CANCELLED", "Crawl was cancelled");
      }
      if (Date.now() - startedAt >= policy.maxDurationMs) {
        throw new CrawlError("TIMEOUT", "Crawl exceeded its duration limit");
      }
      const normalized = normalizeUrl(entry.url, policy.stripTrackingParams);
      if (!normalized.ok || visited.has(normalized.value.canonical)) {
        return null;
      }
      visited.add(normalized.value.canonical);
      const host = normalized.value.asciiHost;
      if (policy.robotsPolicy === "respect") {
        const origin = new URL(normalized.value.canonical).origin;
        let robots = robotsCache.get(origin);
        if (!robots) {
          robots = (async () => {
            await requestHost(host);
            const robotsResponse = await safeFetch(`${origin}/robots.txt`, {
              policy: {
                ...policy,
                maxPages: 1,
                allowedContentTypes: ["text/plain", "text/html"]
              },
              signal,
              ...this.fetchOptions
            });
            return robotsResponse.body.toString("utf8");
          })();
          robotsCache.set(origin, robots);
        }
        if (robotsDisallows(await robots, normalized.value.path)) {
          return null;
        }
      }
      await requestHost(host);
      const response = await safeFetch(normalized.value.canonical, {
        policy,
        signal,
        ...this.fetchOptions
      });
      return documentFromResponse(
        normalized.value.canonical,
        response.finalUrl.canonical,
        entry.depth,
        response
      );
    };
    const active = new Set<Promise<CrawledDocument | null>>();
    while (queue.length > 0 || active.size > 0) {
      if (signal.aborted) {
        throw new CrawlError("CANCELLED", "Crawl was cancelled");
      }
      while (
        queue.length > 0 &&
        active.size < policy.maxConcurrency &&
        documents.length + active.size < policy.maxPages
      ) {
        const entry = queue.shift();
        if (!entry) {
          break;
        }
        const task = processEntry(entry);
        active.add(task);
        void task.then(
          () => active.delete(task),
          () => active.delete(task)
        );
      }
      if (active.size === 0) {
        break;
      }
      const document = await Promise.race(active);
      if (!document) {
        continue;
      }
      documents.push(document);
      bytesProcessed += document.bytes;
      const depth = document.depth;
      if (depth < policy.maxDepth) {
        for (const link of document.links) {
          if (queue.length + documents.length + active.size >= policy.maxPages) {
            break;
          }
          queue.push({ url: link, depth: depth + 1 });
        }
      }
    }

    return {
      documents,
      pageCount: documents.length,
      bytesProcessed,
      partial: queue.length > 0,
      durationMs: Date.now() - startedAt,
      provider: { id: this.id },
      errors: []
    };
  }
}
