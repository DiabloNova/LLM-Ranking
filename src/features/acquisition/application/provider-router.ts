import type {
  CrawlProvider,
  CrawlRequest,
  CrawlResult
} from "../domain/contracts";
import { CrawlError } from "../domain/errors";
import { ExponentialBackoffRetryPolicy } from "../../../services/jobs/retry";
import type { JobError } from "../../../services/jobs/types";

function asJobError(error: CrawlError): JobError {
  return {
    code: error.code,
    message: error.message,
    retryable: error.retryable
  };
}

function abortableWait(delayMs: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.reject(new CrawlError("CANCELLED", "Crawl was cancelled"));
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, delayMs);
    const abort = (): void => {
      clearTimeout(timer);
      reject(new CrawlError("CANCELLED", "Crawl was cancelled"));
    };
    signal.addEventListener("abort", abort, { once: true });
  });
}

export interface ProviderRouterEvents {
  onSelected?: (providerId: string) => void;
  onFailed?: (providerId: string, error: CrawlError) => void;
  onRetry?: (providerId: string, attempt: number, delayMs: number) => void;
  onFallback?: (fromProviderId: string, toProviderId: string) => void;
}

export class ProviderRouter {
  private readonly retryPolicy: ExponentialBackoffRetryPolicy;

  public constructor(
    private readonly providers: readonly CrawlProvider[],
    retryBaseDelayMs = 500,
    retryMaxDelayMs = 30_000,
    private readonly events: ProviderRouterEvents = {}
  ) {
    this.retryPolicy = new ExponentialBackoffRetryPolicy(
      retryBaseDelayMs,
      retryMaxDelayMs
    );
  }

  public async execute(
    request: CrawlRequest,
    signal: AbortSignal,
    runtimeEvents: ProviderRouterEvents = {}
  ): Promise<CrawlResult> {
    const events = { ...this.events, ...runtimeEvents };
    const startedAt = Date.now();
    let lastError: CrawlError | undefined;
    let attempts = 0;
    for (let providerIndex = 0; providerIndex < this.providers.length; providerIndex += 1) {
      const provider = this.providers[providerIndex];
      events.onSelected?.(provider.id);
      while (true) {
        if (signal.aborted) {
          throw new CrawlError("CANCELLED", "Crawl was cancelled");
        }
        const remaining = request.policy.maxDurationMs - (Date.now() - startedAt);
        if (remaining <= 0) {
          throw new CrawlError("TIMEOUT", "Crawl exceeded its duration limit");
        }
        attempts += 1;
        try {
          return await provider.execute(request, request.policy, signal);
        } catch (error) {
          const crawlError =
            error instanceof CrawlError
              ? error
              : new CrawlError("UNKNOWN", "Provider failed");
          lastError = crawlError;
          events.onFailed?.(provider.id, crawlError);
          if (!crawlError.fallbackEligible) {
            throw crawlError;
          }
          if (
            attempts >= request.policy.maxAttempts ||
            !this.retryPolicy.isRetryable(asJobError(crawlError))
          ) {
            break;
          }
          const delayMs = Math.max(
            this.retryPolicy.getDelay(attempts),
            crawlError.retryAfterMs ?? 0
          );
          const boundedDelay = Math.min(
            delayMs,
            request.policy.maxDurationMs - (Date.now() - startedAt)
          );
          events.onRetry?.(provider.id, attempts, boundedDelay);
          await abortableWait(boundedDelay, signal);
        }
      }
      if (signal.aborted) {
        throw new CrawlError("CANCELLED", "Crawl was cancelled");
      }
      const nextProvider = this.providers[providerIndex + 1];
      if (nextProvider && lastError) {
        events.onFallback?.(provider.id, nextProvider.id);
      }
    }
    throw (
      lastError ??
      new CrawlError("CONFIGURATION_ERROR", "No crawl provider is configured")
    );
  }
}
