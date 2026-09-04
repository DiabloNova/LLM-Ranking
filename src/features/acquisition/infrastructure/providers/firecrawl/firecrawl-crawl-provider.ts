import FirecrawlApp from "@mendable/firecrawl-js";
import { CrawlError } from "../../../domain/errors";
import type {
  CrawlProvider,
  CrawlRequest,
  CrawlResult,
  CrawledDocument
} from "../../../domain/contracts";
import type { CrawlPolicy } from "../../../domain/policy";

interface FirecrawlClient {
  crawlUrl(
    url: string,
    params?: Record<string, unknown>,
    pollInterval?: number,
    signal?: AbortSignal
  ): Promise<unknown>;
}

interface FirecrawlDocument {
  url?: unknown;
  markdown?: unknown;
  html?: unknown;
  metadata?: Record<string, unknown>;
}

interface FirecrawlResponse {
  id?: unknown;
  success?: unknown;
  status?: unknown;
  data?: unknown;
  error?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function document(value: unknown, index: number): CrawledDocument {
  if (!isRecord(value)) {
    throw new CrawlError("PROVIDER_ERROR", "Firecrawl returned malformed data");
  }
  const item = value as FirecrawlDocument;
  const url = typeof item.url === "string" ? item.url : "";
  const markdown = typeof item.markdown === "string" ? item.markdown : "";
  const html = typeof item.html === "string" ? item.html : undefined;
  if (!url || (!markdown && !html)) {
    throw new CrawlError("PROVIDER_ERROR", "Firecrawl returned an incomplete document");
  }
  return {
    canonicalUrl: url,
    requestedUrl: url,
    finalUrl: url,
    httpStatus: 200,
    contentType: html ? "text/html" : "text/plain",
    text: markdown || html || "",
    html,
    links: [],
    metadata: {},
    fetchedAt: new Date().toISOString(),
    bytes: Buffer.byteLength(markdown || html || ""),
    depth: index
  };
}

function mapProviderError(error: unknown): CrawlError {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Firecrawl request failed";
  const status = message.match(/\b(401|403|429|5\d\d)\b/)?.[1];
  if (status === "401" || status === "403") {
    return new CrawlError("AUTHENTICATION_ERROR", "Firecrawl authentication failed");
  }
  if (status === "429") {
    return new CrawlError("RATE_LIMITED", "Firecrawl rate limit reached");
  }
  if (/timeout|timed out/i.test(message)) {
    return new CrawlError("TIMEOUT", "Firecrawl request timed out");
  }
  return new CrawlError("PROVIDER_ERROR", "Firecrawl request failed", {
    transient: true
  });
}

export class FirecrawlCrawlProvider implements CrawlProvider {
  public readonly id = "firecrawl";
  public readonly capabilities = {
    supportsJavaScript: true,
    supportsRobots: true,
    supportsTraversal: true
  };
  private readonly client: FirecrawlClient;

  public constructor(client?: FirecrawlClient) {
    this.client =
      client ??
      (new FirecrawlApp({
        apiKey: process.env.FIRECRAWL_API_KEY ?? ""
      }) as unknown as FirecrawlClient);
  }

  public get isConfigured(): boolean {
    return Boolean(process.env.FIRECRAWL_API_KEY);
  }

  public async execute(
    request: CrawlRequest,
    policy: CrawlPolicy,
    signal: AbortSignal
  ): Promise<CrawlResult> {
    if (!this.isConfigured) {
      throw new CrawlError(
        "CONFIGURATION_ERROR",
        "Firecrawl is not configured"
      );
    }
    if (signal.aborted) {
      throw new CrawlError("CANCELLED", "Crawl was cancelled");
    }
    try {
      const response = (await this.client.crawlUrl(
        request.normalizedUrl.canonical,
        {
          limit: policy.maxPages,
          maxDepth: policy.maxDepth,
          scrapeOptions: { formats: ["markdown", "html"] }
        },
        2,
        signal
      )) as FirecrawlResponse;
      if (!isRecord(response)) {
        throw new CrawlError("PROVIDER_ERROR", "Firecrawl returned malformed data");
      }
      if (response.success === false || response.error) {
        throw mapProviderError(response.error);
      }
      const data = Array.isArray(response.data) ? response.data : [];
      if (!data.length) {
        throw new CrawlError("PROVIDER_ERROR", "Firecrawl returned no documents");
      }
      const documents = data.map(document);
      return {
        documents,
        pageCount: documents.length,
        bytesProcessed: documents.reduce((sum, item) => sum + item.bytes, 0),
        partial: response.status === "partial",
        durationMs: 0,
        provider: {
          id: this.id,
          jobId:
            isRecord(response) && typeof response.id === "string"
              ? response.id
              : undefined
        },
        errors: []
      };
    } catch (error) {
      if (error instanceof CrawlError) {
        throw error;
      }
      throw mapProviderError(error);
    }
  }
}
