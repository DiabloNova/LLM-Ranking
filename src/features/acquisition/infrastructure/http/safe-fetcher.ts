import {
  request as httpRequest,
  type IncomingMessage,
  type RequestOptions
} from "node:http";
import { request as httpsRequest } from "node:https";
import { CrawlError } from "../../domain/errors";
import type { CrawlPolicy } from "../../domain/policy";
import {
  normalizeUrl,
  type NormalizedUrl
} from "../../domain/url/normalizer";
import {
  resolveAndValidateHost,
  type HostValidationResult,
  type Resolver
} from "../security/ssrf-guard";

export interface SafeFetcherResponse {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
  finalUrl: NormalizedUrl;
  redirects: number;
}

export interface SafeFetcherOptions {
  policy: CrawlPolicy;
  signal?: AbortSignal;
  resolver?: Resolver;
  hostValidator?: (host: string) => Promise<HostValidationResult>;
}

function contentType(headers: IncomingMessage["headers"]): string {
  return (headers["content-type"]?.split(";")[0] ?? "").toLowerCase();
}

function contentEncoding(headers: IncomingMessage["headers"]): string {
  return (headers["content-encoding"] ?? "").toString().toLowerCase();
}

export async function safeFetch(
  input: string,
  options: SafeFetcherOptions
): Promise<SafeFetcherResponse> {
  const startedAt = Date.now();
  let current = normalizeUrl(input, options.policy.stripTrackingParams);

  if (!current.ok) {
    throw current.error;
  }
  if (!options.policy.allowedSchemes.includes(current.value.scheme)) {
    throw new CrawlError(
      "POLICY_VIOLATION",
      "URL scheme is not allowed by crawl policy"
    );
  }

  const visited = new Set<string>();
  let redirects = 0;
  while (true) {
    if (Date.now() - startedAt >= options.policy.maxDurationMs) {
      throw new CrawlError("TIMEOUT", "Crawl request exceeded its deadline");
    }
    if (visited.has(current.value.canonical)) {
      throw new CrawlError("REDIRECT_LIMIT", "Redirect loop detected");
    }
    visited.add(current.value.canonical);

    const validation = options.hostValidator
      ? await options.hostValidator(current.value.asciiHost)
      : await resolveAndValidateHost(current.value.asciiHost, options.resolver);
    if (!validation.ok) {
      throw validation.error;
    }

    const remaining = options.policy.maxDurationMs - (Date.now() - startedAt);
    if (remaining <= 0) {
      throw new CrawlError("TIMEOUT", "Crawl request exceeded its deadline");
    }
    const response = await requestOnce(
      current.value,
      validation.ips,
      options,
      remaining
    );

    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      if (
        !options.policy.followRedirects ||
        redirects >= options.policy.maxRedirects
      ) {
        throw new CrawlError("REDIRECT_LIMIT", "Redirect limit exceeded", {
          redirects
        });
      }
      const location = Array.isArray(response.headers.location)
        ? response.headers.location[0]
        : response.headers.location;
      if (!location) {
        throw new CrawlError("REDIRECT_LIMIT", "Redirect location is empty");
      }
      const normalized = normalizeUrl(
        new URL(location, current.value.canonical).toString(),
        options.policy.stripTrackingParams
      );
      if (!normalized.ok) {
        throw normalized.error;
      }
      if (!options.policy.allowedSchemes.includes(normalized.value.scheme)) {
        throw new CrawlError(
          "POLICY_VIOLATION",
          "Redirect scheme is not allowed by crawl policy"
        );
      }
      current = normalized;
      redirects += 1;
      continue;
    }

    if (response.status < 200 || response.status >= 300) {
      throw new CrawlError(
        "HTTP_ERROR",
        "HTTP request returned an error status",
        { status: response.status }
      );
    }
    const encoding = contentEncoding(response.headers);
    if (encoding && encoding !== "identity") {
      throw new CrawlError(
        "CONTENT_TYPE_UNSUPPORTED",
        "Compressed response encoding is not supported"
      );
    }
    const type = contentType(response.headers);
    if (
      !options.policy.allowedContentTypes.some(
        allowed => type === allowed.toLowerCase()
      )
    ) {
      throw new CrawlError(
        "CONTENT_TYPE_UNSUPPORTED",
        "Response content type is not allowed",
        { contentType: type }
      );
    }
    return {
      ...response,
      finalUrl: current.value,
      redirects
    };
  }
}

function requestOnce(
  url: NormalizedUrl,
  ips: string[],
  options: SafeFetcherOptions,
  deadlineMs: number
): Promise<Omit<SafeFetcherResponse, "finalUrl" | "redirects">> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let received = 0;
    const chunks: Buffer[] = [];
    const transport = url.scheme === "https" ? httpsRequest : httpRequest;
    const request = transport(
      {
        hostname: url.asciiHost,
        port: url.port ?? undefined,
        path: `${url.path}${url.query ? `?${url.query}` : ""}`,
        method: "GET",
        headers: {
          Accept: "*/*",
          "Accept-Encoding": "identity",
          "User-Agent": "seorchable-crawler/1.0"
        },
        lookup: createPinnedLookup(ips),
        timeout: Math.min(options.policy.requestTimeoutMs, deadlineMs)
      },
      response => {
        const fail = (error: CrawlError): void => {
          if (!settled) {
            settled = true;
            request.destroy(error);
            reject(error);
          }
        };
        response.on("data", chunk => {
          const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          received += data.length;
          if (received > options.policy.maxResponseBytes) {
            fail(
              new CrawlError(
                "RESPONSE_TOO_LARGE",
                "Response exceeded configured limit"
              )
            );
            return;
          }
          chunks.push(data);
        });
        response.on("end", () => {
          if (!settled) {
            settled = true;
            resolve({
              status: response.statusCode ?? 0,
              headers: Object.fromEntries(
                Object.entries(response.headers).filter(
                  ([key]) => key !== "set-cookie"
                )
              ),
              body: Buffer.concat(chunks)
            });
          }
        });
        response.on("error", error =>
          fail(
            new CrawlError(
              "NETWORK_FAILURE",
              "Response stream failed",
              {},
              { cause: error }
            )
          )
        );
      }
    );

    let connectTimer: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => request.destroy(new CrawlError("TIMEOUT", "Connection timed out")),
      options.policy.connectTimeoutMs
    );
    const clearConnectTimer = (): void => {
      if (connectTimer) {
        clearTimeout(connectTimer);
        connectTimer = undefined;
      }
    };
    const deadlineTimer = setTimeout(
      () => request.destroy(new CrawlError("TIMEOUT", "Request deadline exceeded")),
      deadlineMs
    );

    request.on("socket", socket =>
      socket.once("connect", clearConnectTimer)
    );
    request.on("timeout", () =>
      request.destroy(new CrawlError("TIMEOUT", "Request timed out"))
    );
    request.on("error", error => {
      clearConnectTimer();
      clearTimeout(deadlineTimer);
      if (!settled) {
        settled = true;
        reject(
          error instanceof CrawlError
            ? error
            : new CrawlError("NETWORK_FAILURE", "Network request failed", {}, {
                cause: error
              })
        );
      }
    });
    request.on("close", () => {
      clearConnectTimer();
      clearTimeout(deadlineTimer);
    });

    if (options.signal) {
      if (options.signal.aborted) {
        request.destroy(new CrawlError("CANCELLED", "Request cancelled"));
      } else {
        options.signal.addEventListener(
          "abort",
          () => request.destroy(new CrawlError("CANCELLED", "Request cancelled")),
          { once: true }
        );
      }
    }
    request.end();
  });
}

export function createPinnedLookup(
  ips: string[]
): NonNullable<RequestOptions["lookup"]> {
  return (_hostname, lookupOptions, callback) => {
    if (lookupOptions.all) {
      callback(
        null,
        ips.map(address => ({
          address,
          family: address.includes(":") ? 6 : 4
        }))
      );
      return;
    }
    callback(null, ips[0], ips[0].includes(":") ? 6 : 4);
  };
}
