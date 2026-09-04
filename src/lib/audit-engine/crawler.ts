import { CrawlResult } from "@/types/audit";
import { normalizeUrl, isSafeUrl } from "./url-validator";
import { AuditLogger } from "./logger";

const MAX_REDIRECTS = 5;
const MAX_BODY_SIZE = 2 * 1024 * 1024; // 2MB
const FETCH_TIMEOUT_MS = 8000; // 8 seconds timeout

/**
 * Robust, highly secure HTTP crawler.
 * Implements SSRF defense, manual redirect checking, timeout limits, and resource size limits.
 */
export async function secureCrawl(targetUrl: string, logger: AuditLogger): Promise<CrawlResult> {
  const redirectChain: string[] = [];
  let currentUrl = targetUrl;
  let redirectDepth = 0;

  logger.info("Initializing secure crawl", { targetUrl });

  while (redirectDepth <= MAX_REDIRECTS) {
    // 1. Normalize
    const normResult = normalizeUrl(currentUrl);
    if (!normResult.isValid || !normResult.normalizedUrl) {
      throw new Error(`Invalid URL normalization: ${normResult.error || "unknown"}`);
    }
    currentUrl = normResult.normalizedUrl;

    // 2. SSRF check
    if (!isSafeUrl(currentUrl)) {
      logger.warn("SSRF detected and blocked", { url: currentUrl });
      throw new Error("SSRF Protection: Access to the requested host is forbidden");
    }

    logger.info(`Fetching URL (Redirect depth: ${redirectDepth})`, { url: currentUrl });

    // 3. Outbound fetch with AbortController for timeout and resource control
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      // Fetch with manual redirect control so we can intercept and security check redirects
      const response = await fetch(currentUrl, {
        method: "GET",
        headers: {
          "User-Agent": "CoreIntelligenceCrawler/1.0 (Enterprise Audit Engine)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "fa,en;q=0.9"
        },
        redirect: "manual",
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle Redirects Manually
      const status = response.status;
      if (status >= 300 && status < 400) {
        const locationHeader = response.headers.get("location");
        if (!locationHeader) {
          throw new Error(`Redirect status ${status} received without Location header`);
        }

        // Resolve relative redirects against currentUrl
        const resolvedRedirectUrl = new URL(locationHeader, currentUrl).toString();
        redirectChain.push(currentUrl);
        currentUrl = resolvedRedirectUrl;
        redirectDepth++;

        logger.info("Following safe redirect", { from: redirectChain[redirectChain.length - 1], to: currentUrl });
        continue;
      }

      // Check Content-Length if present
      const contentLengthHeader = response.headers.get("content-length");
      if (contentLengthHeader) {
        const parsedLength = parseInt(contentLengthHeader, 10);
        if (!isNaN(parsedLength) && parsedLength > MAX_BODY_SIZE) {
          throw new Error(`Payload size limit exceeded: Content-Length is ${parsedLength} bytes (max ${MAX_BODY_SIZE})`);
        }
      }

      // Read response body safely with size constraints
      let rawHtml = "";
      if (response.body && typeof response.body.getReader === "function") {
        const reader = response.body.getReader();
        let receivedLength = 0;
        const chunks: Uint8Array[] = [];

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              receivedLength += value.length;
              if (receivedLength > MAX_BODY_SIZE) {
                throw new Error(`Payload size limit exceeded: Read over ${MAX_BODY_SIZE} bytes`);
              }
              chunks.push(value);
            }
          }

          const concat = new Uint8Array(receivedLength);
          let position = 0;
          for (const chunk of chunks) {
            concat.set(chunk, position);
            position += chunk.length;
          }
          rawHtml = new TextDecoder("utf-8").decode(concat);
        } finally {
          reader.releaseLock();
        }
      } else {
        // Fallback for environments where body.getReader is not available (e.g. some test mocks)
        rawHtml = await response.text();
        const byteLen = Buffer.byteLength(rawHtml, "utf-8");
        if (byteLen > MAX_BODY_SIZE) {
          throw new Error(`Payload size limit exceeded: Text length is ${byteLen} bytes (max ${MAX_BODY_SIZE})`);
        }
      }

      // Convert headers to a plain object
      const headersObj: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        headersObj[key.toLowerCase()] = val;
      });

      logger.info("Crawl completed successfully", { url: currentUrl, statusCode: status });

      return {
        url: currentUrl,
        statusCode: status,
        headers: headersObj,
        isHttps: currentUrl.toLowerCase().startsWith("https://"),
        redirectChain,
        redirectDepth,
        bodySize: Buffer.byteLength(rawHtml, "utf-8"),
        rawHtml
      };

    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === "AbortError";
      const errorMsg = isAbort ? "Request timed out (timeout 8s)" : (err instanceof Error ? err.message : String(err));
      logger.error("Crawl request failed", err, { url: currentUrl });
      throw new Error(`Crawl Error on ${currentUrl}: ${errorMsg}`);
    }
  }

  throw new Error(`Maximum redirect depth of ${MAX_REDIRECTS} exceeded`);
}
