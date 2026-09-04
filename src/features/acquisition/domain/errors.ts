export const CRAWL_ERROR_CLASSIFICATION = {
  INVALID_URL: { retryable: false, fallbackEligible: false },
  SSRF_BLOCKED: { retryable: false, fallbackEligible: false },
  POLICY_VIOLATION: { retryable: false, fallbackEligible: false },
  TIMEOUT: { retryable: true, fallbackEligible: true },
  DNS_FAILURE: { retryable: false, fallbackEligible: false },
  NETWORK_FAILURE: { retryable: true, fallbackEligible: true },
  HTTP_ERROR: { retryable: false, fallbackEligible: false },
  REDIRECT_LIMIT: { retryable: false, fallbackEligible: false },
  RESPONSE_TOO_LARGE: { retryable: false, fallbackEligible: false },
  CONTENT_TYPE_UNSUPPORTED: { retryable: false, fallbackEligible: false },
  RATE_LIMITED: { retryable: true, fallbackEligible: true },
  PROVIDER_ERROR: { retryable: true, fallbackEligible: true },
  AUTHENTICATION_ERROR: { retryable: false, fallbackEligible: false },
  CONFIGURATION_ERROR: { retryable: false, fallbackEligible: false },
  CANCELLED: { retryable: false, fallbackEligible: false },
  UNKNOWN: { retryable: false, fallbackEligible: false }
} as const;

export type CrawlErrorCode = keyof typeof CRAWL_ERROR_CLASSIFICATION;
export type CrawlErrorDetails = Record<string, string | number | boolean | null>;

export interface PublicCrawlError {
  code: CrawlErrorCode;
  message: string;
  retryAfterMs?: number;
}

export class CrawlError extends Error {
  public readonly code: CrawlErrorCode;
  public readonly details: CrawlErrorDetails;
  public readonly retryable: boolean;
  public readonly fallbackEligible: boolean;
  public readonly retryAfterMs?: number;
  public readonly providerId?: string;
  public readonly cause?: unknown;

  constructor(
    code: CrawlErrorCode,
    diagnosticMessage: string,
    details: CrawlErrorDetails = {},
    options?: { cause?: unknown; retryAfterMs?: number; providerId?: string }
  ) {
    super(diagnosticMessage);
    this.name = "CrawlError";
    this.code = code;
    this.details = details;
    const status = details.status;
    const transientHttp =
      code === "HTTP_ERROR" &&
      typeof status === "number" &&
      [429, 502, 503, 504].includes(status);
    this.retryable =
      transientHttp ||
      (code === "PROVIDER_ERROR" && details.transient !== false) ||
      CRAWL_ERROR_CLASSIFICATION[code].retryable;
    this.fallbackEligible =
      transientHttp ||
      (code === "PROVIDER_ERROR" && details.transient !== false) ||
      CRAWL_ERROR_CLASSIFICATION[code].fallbackEligible;
    this.cause = options?.cause;
    this.retryAfterMs = options?.retryAfterMs;
    this.providerId = options?.providerId;
  }

  toPublicError(): PublicCrawlError {
    return {
      code: this.code,
      message: "The crawl could not be completed.",
      ...(this.retryAfterMs === undefined
        ? {}
        : { retryAfterMs: this.retryAfterMs })
    };
  }
}
