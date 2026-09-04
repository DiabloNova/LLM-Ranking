import type { CrawlError, PublicCrawlError } from "./errors";
import type { CrawlPolicy } from "./policy";
import type { NormalizedUrl } from "./url/normalizer";

export type CrawlJobStatus =
  | "PENDING"
  | "QUEUED"
  | "RUNNING"
  | "SUCCEEDED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED";

export interface CrawlRequest {
  tenantId: string;
  requestedUrl: string;
  normalizedUrl: NormalizedUrl;
  policy: CrawlPolicy;
  priority: number;
  correlationId?: string;
  requestId?: string;
  traceId?: string;
  bypassCache?: boolean;
}

export interface CrawlProviderCapabilities {
  supportsJavaScript: boolean;
  supportsRobots: boolean;
  supportsTraversal: boolean;
  maxPages?: number;
}

export interface CrawlProvider {
  readonly id: string;
  readonly capabilities: CrawlProviderCapabilities;
  execute(
    request: CrawlRequest,
    policy: CrawlPolicy,
    signal: AbortSignal
  ): Promise<CrawlResult>;
}

export interface CrawlJob {
  id: string;
  tenantId: string;
  requestedUrl: string;
  normalizedUrl: NormalizedUrl;
  policy: CrawlPolicy;
  dedupKey: string;
  cacheKey: string;
  priority: number;
  status: CrawlJobStatus;
  providerId?: string;
  providerJobId?: string;
  attempts: number;
  maxAttempts: number;
  scheduledFor?: string;
  claimedAt?: string;
  heartbeatAt?: string;
  leaseExpiresAt?: string;
  workerId?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  pageCount?: number;
  bytesProcessed?: number;
  cacheOutcome?: CacheOutcome;
  error?: {
    code: CrawlError["code"];
    public: PublicCrawlError;
  };
  cancelledAt?: string;
  cancellationReason?: string;
  cancellationRequestedBy?: string;
  resultRef?: string;
  correlationId?: string;
  requestId?: string;
  traceId?: string;
  version: number;
}

export interface CrawlMetadata {
  canonicalUrl?: string;
  language?: string;
  charset?: string;
  description?: string;
  headings?: string[];
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface CrawledDocument {
  canonicalUrl: string;
  requestedUrl: string;
  finalUrl: string;
  httpStatus: number;
  contentType: string;
  title?: string;
  text: string;
  html?: string;
  links: string[];
  metadata: CrawlMetadata;
  fetchedAt: string;
  bytes: number;
  depth: number;
}

export interface CrawlResult {
  documents: CrawledDocument[];
  pageCount: number;
  bytesProcessed: number;
  partial: boolean;
  durationMs: number;
  provider: {
    id: string;
    version?: string;
    jobId?: string;
  };
  errors: CrawlError[];
}

export type CacheOutcome = "HIT" | "MISS" | "STALE" | "BYPASS";
