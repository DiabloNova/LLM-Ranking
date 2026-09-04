import { CrawlError } from "../errors";
import { isTrackingParameter } from "./tracking-params";
import { domainToUnicode } from "node:url";
import { isIP } from "node:net";

export interface NormalizedUrl {
  canonical: string;
  scheme: "http" | "https";
  host: string;
  asciiHost: string;
  port: number | null;
  path: string;
  query: string;
  originalInput: string;
}
export type UrlNormalizationResult =
  | { ok: true; value: NormalizedUrl }
  | { ok: false; error: CrawlError };

const unreserved = /^[A-Za-z0-9\-._~]$/;

function normalizePath(path: string): string {
  const trailing = path.endsWith("/");
  const segments: string[] = [];
  for (const segment of path.split("/")) {
    if (!segment || segment === ".") {
      continue;
    }
    if (segment === "..") {
      segments.pop();
      continue;
    }
    let out = "";
    for (let i = 0; i < segment.length;) {
      if (
        segment[i] === "%" &&
        /^[0-9A-Fa-f]{2}$/.test(segment.slice(i + 1, i + 3))
      ) {
        const hex = segment.slice(i + 1, i + 3);
        const char = String.fromCharCode(parseInt(hex, 16));
        out += unreserved.test(char) ? char : `%${hex.toUpperCase()}`;
        i += 3;
      } else {
        out += segment[i];
        i++;
      }
    }
    segments.push(out);
  }
  const result = `/${segments.join("/")}`;
  return trailing && result !== "/" ? `${result}/` : result;
}
/**
 * Query names and values are treated as opaque strings: percent escapes and "+"
 * are preserved rather than form-decoded, then sorted by Unicode codepoint.
 */
function normalizeQuery(search: string, stripTrackingParams: boolean): string {
  if (!search || search === "?") {
    return "";
  }
  const params: Array<[string, string]> = [];
  for (const part of search.slice(1).split("&")) {
    if (!part) {
      continue;
    }
    const equal = part.indexOf("=");
    const name = equal < 0 ? part : part.slice(0, equal);
    const value = equal < 0 ? "" : part.slice(equal + 1);
    if (stripTrackingParams && isTrackingParameter(name)) continue;
    params.push([name, value]);
  }
  params.sort((a, b) => {
    if (a[0] < b[0]) {
      return -1;
    }
    if (a[0] > b[0]) {
      return 1;
    }
    if (a[1] < b[1]) {
      return -1;
    }
    if (a[1] > b[1]) {
      return 1;
    }
    return 0;
  });
  return params.map(([n, v]) => `${n}=${v}`).join("&");
}
export function normalizeUrl(
  input: string,
  stripTrackingParams = true
): UrlNormalizationResult {
  const invalid = (reason: string): UrlNormalizationResult => ({
    ok: false,
    error: new CrawlError("INVALID_URL", reason)
  });
  if (
    !input ||
    input.trim() !== input ||
    /[\s\x00-\x1F\x7F]/.test(input)
  ) {
    return invalid("URL is empty, contains spaces, or control characters");
  }
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return invalid("Malformed URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return invalid("Only http and https schemes are allowed");
  }
  if (parsed.username || parsed.password) {
    return invalid("Embedded credentials are not allowed");
  }
  const asciiHost = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const hostIsIpv6 = isIP(asciiHost) === 6;
  if (!asciiHost || asciiHost.length > 253) {
    return invalid("Host is empty or overlong");
  }
  if (
    !hostIsIpv6 &&
    !asciiHost.includes(".") &&
    asciiHost !== "localhost" &&
    !asciiHost.endsWith(".localhost")
  ) {
    return invalid("Single-label host is not allowed");
  }
  const unicodeHost = hostIsIpv6
    ? asciiHost
    : domainToUnicode(asciiHost).toLowerCase();
  const roundTripHost = hostIsIpv6 ? `[${unicodeHost}]` : unicodeHost;
  if (
    new URL(`${parsed.protocol}//${roundTripHost}`).hostname !==
    parsed.hostname.toLowerCase()
  ) {
    return invalid("Host does not round-trip consistently");
  }
  const scheme = parsed.protocol.slice(0, -1) as "http" | "https";
  const port = parsed.port ? Number(parsed.port) : null;
  const effectivePort = port === (scheme === "http" ? 80 : 443) ? null : port;
  const path = normalizePath(parsed.pathname);
  const query = normalizeQuery(parsed.search, stripTrackingParams);
  const canonicalHost = hostIsIpv6 ? `[${asciiHost}]` : asciiHost;
  return {
    ok: true,
    value: {
      canonical: `${scheme}://${canonicalHost}${
        effectivePort ? `:${effectivePort}` : ""
      }${path}${query ? `?${query}` : ""}`,
      scheme,
      host: unicodeHost,
      asciiHost,
      port: effectivePort,
      path,
      query,
      originalInput: input
    }
  };
}
