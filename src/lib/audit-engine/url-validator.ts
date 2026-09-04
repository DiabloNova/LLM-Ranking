import { UrlNormalizationResult } from "@/types/audit";

/**
 * Normalizes a URL:
 * - Prepends https:// if protocol is missing.
 * - Standardizes the casing of scheme and hostname to lowercase.
 * - Standardizes trailing slashes (removes trailing slashes from path unless it's the root domain).
 */
export function normalizeUrl(inputUrl: string): UrlNormalizationResult {
  const trimmed = inputUrl.trim();
  if (!trimmed) {
    return { originalUrl: inputUrl, normalizedUrl: "", isValid: false, error: "URL empty" };
  }

  try {
    // If no protocol is specified, default to https://
    let withProtocol = trimmed;
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
      withProtocol = `https://${trimmed}`;
    }

    const parsed = new URL(withProtocol);
    const protocol = parsed.protocol.toLowerCase();

    // Only allow http and https protocols
    if (protocol !== "http:" && protocol !== "https:") {
      return {
        originalUrl: inputUrl,
        normalizedUrl: "",
        isValid: false,
        error: "فقط پروتکل‌های http و https مجاز هستند"
      };
    }

    const hostname = parsed.hostname.toLowerCase();
    const port = parsed.port ? `:${parsed.port}` : "";
    let pathname = parsed.pathname;

    // Standardize trailing slash: remove if it's not just '/'
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    const search = parsed.search;
    const hash = parsed.hash;

    const normalizedUrl = `${protocol}//${hostname}${port}${pathname}${search}${hash}`;

    return {
      originalUrl: inputUrl,
      normalizedUrl,
      isValid: true
    };
  } catch (err) {
    return {
      originalUrl: inputUrl,
      normalizedUrl: "",
      isValid: false,
      error: "فرمت آدرس وب‌سایت نامعتبر است"
    };
  }
}

/**
 * Validates hostname to prevent SSRF (Server-Side Request Forgery).
 * Rejects private IPs, localhost, cloud metadata, and loopbacks.
 */
export function isSafeUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();

    // 1. Check explicit local/internal names
    const unsafeHostnames = [
      "localhost",
      "metadata.google.internal",
      "instance-data",
      "169.254.169.254"
    ];

    if (unsafeHostnames.includes(hostname)) {
      return false;
    }

    if (
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".test") ||
      hostname.endsWith(".lan")
    ) {
      return false;
    }

    // 2. IP address checks (v4 and v6)
    // Simple checks for IPv4 loopback & private ranges
    // Loopback: 127.0.0.1 - 127.255.255.255
    if (/^127\.\d+\.\d+\.\d+$/.test(hostname)) {
      return false;
    }

    // Class A Private: 10.0.0.0 - 10.255.255.255
    if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) {
      return false;
    }

    // Class B Private: 172.16.0.0 - 172.31.255.255
    const classBMatch = hostname.match(/^172\.(\d+)\.\d+\.\d+$/);
    if (classBMatch) {
      const secondOctet = parseInt(classBMatch[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) {
        return false;
      }
    }

    // Class C Private: 192.168.0.0 - 192.168.255.255
    if (/^192\.168\.\d+\.\d+$/.test(hostname)) {
      return false;
    }

    // Link-local: 169.254.0.0 - 169.254.255.255
    if (/^169\.254\.\d+\.\d+$/.test(hostname)) {
      return false;
    }

    // Broadcast: 255.255.255.255 or 0.0.0.0
    if (hostname === "255.255.255.255" || hostname === "0.0.0.0") {
      return false;
    }

    // 3. IPv6 Checks
    // Loopback: ::1
    if (hostname === "::1" || hostname === "[::1]") {
      return false;
    }

    // Unspecified: ::
    if (hostname === "::" || hostname === "[::]") {
      return false;
    }

    // Unique Local: fc00::/7 (starts with fc or fd)
    // Link Local: fe80::/10 (starts with fe8, fe9, fea, feb)
    if (
      hostname.startsWith("fc") ||
      hostname.startsWith("fd") ||
      hostname.startsWith("fe8") ||
      hostname.startsWith("fe9") ||
      hostname.startsWith("fea") ||
      hostname.startsWith("feb") ||
      hostname.startsWith("[fc") ||
      hostname.startsWith("[fd") ||
      hostname.startsWith("[fe8") ||
      hostname.startsWith("[fe9") ||
      hostname.startsWith("[fea") ||
      hostname.startsWith("[feb")
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
