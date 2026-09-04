import * as cheerio from "cheerio";
import { RawWebsiteSignals, TechnicalSignals, ContentSignals, EntitySignals, StructuredDataSignals, CrawlResult } from "@/types/audit";
import { isSafeUrl } from "./url-validator";
import { AuditLogger } from "./logger";

/**
 * Checks if robots.txt and sitemap are available on the origin.
 */
async function checkAvailability(baseUrl: string, path: string, logger: AuditLogger): Promise<boolean> {
  try {
    const origin = new URL(baseUrl).origin;
    const targetUrl = `${origin}${path}`;

    if (!isSafeUrl(targetUrl)) {
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout for metadata checks

    const res = await fetch(targetUrl, {
      method: "HEAD",
      headers: { "User-Agent": "CoreIntelligenceCrawler/1.0" },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return res.ok;
  } catch (err) {
    logger.warn(`Failed to check availability for ${path}`, { baseUrl, error: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

/**
 * Helper to count words from a piece of text.
 * Strips whitespace and returns word count.
 */
function getWordCount(text: string): number {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return 0;
  return clean.split(" ").length;
}

/**
 * Parses raw crawling output to extract robust, multidimensional SEO and brand signals.
 */
export async function extractSignals(crawl: CrawlResult, responseTimeMs: number, logger: AuditLogger): Promise<RawWebsiteSignals> {
  logger.info("Extracting raw signals from crawl payload", { url: crawl.url });

  const $ = cheerio.load(crawl.rawHtml);

  // 1. Technical Signals
  const canonicalUrl = $('link[rel="canonical"]').attr("href")?.trim();
  const hasCanonical = !!canonicalUrl;

  const robotsTxtAllowed = await checkAvailability(crawl.url, "/robots.txt", logger);
  const sitemapAvailable = await checkAvailability(crawl.url, "/sitemap.xml", logger);

  const technical: TechnicalSignals = {
    statusCode: crawl.statusCode,
    isHttps: crawl.isHttps,
    hasCanonical,
    canonicalUrl,
    robotsTxtAllowed,
    sitemapAvailable,
    responseTimeMs,
    headers: crawl.headers
  };

  // 2. Metadata Signals
  const title = $("title").text().trim() || $('meta[property="og:title"]').attr("content")?.trim() || "";
  const description = $('meta[name="description"]').attr("content")?.trim() || $('meta[property="og:description"]').attr("content")?.trim() || "";
  const robotsMeta = $('meta[name="robots"]').attr("content")?.trim() || "";
  const language = $("html").attr("lang")?.trim() || "";

  const metadata: Record<string, string> = {
    title,
    description,
    robots: robotsMeta,
    language
  };

  // Add OpenGraph & Twitter Cards
  $('meta[property^="og:"], meta[name^="twitter:"]').each((_, el) => {
    const key = $(el).attr("property") || $(el).attr("name");
    const content = $(el).attr("content");
    if (key && content) {
      metadata[key.toLowerCase()] = content;
    }
  });

  // 3. Content Signals
  // Strip out script, style, nav, footer, etc. from word count to extract real core text content
  const clone$ = cheerio.load(crawl.rawHtml);
  clone$("script, style, nav, footer, iframe, noscript, header").remove();
  const bodyText = clone$("body").text() || "";
  const wordCount = getWordCount(bodyText);

  const headingHierarchy: Record<string, number> = {
    h1: $("h1").length,
    h2: $("h2").length,
    h3: $("h3").length,
    h4: $("h4").length,
    h5: $("h5").length,
    h6: $("h6").length
  };

  const paragraphCount = $("p").length;

  let internalLinksCount = 0;
  let externalLinksCount = 0;
  const currentHost = new URL(crawl.url).host.toLowerCase();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href) return;

    if (
      href.startsWith("/") ||
      href.startsWith("./") ||
      href.startsWith("../") ||
      (href.startsWith("http") && new URL(href, crawl.url).host.toLowerCase() === currentHost)
    ) {
      internalLinksCount++;
    } else if (href.startsWith("http")) {
      externalLinksCount++;
    }
  });

  const imageCount = $("img").length;
  let missingAltCount = 0;
  $("img").each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt.trim() === "") {
      missingAltCount++;
    }
  });

  // Detect Author & Dates
  const hasAuthor = !!(
    $('[itemprop="author"]').length ||
    $('meta[name="author"]').attr("content") ||
    $('meta[property="article:author"]').attr("content")
  );

  const hasPublishDate = !!(
    $('[itemprop="datePublished"]').length ||
    $('meta[property="article:published_time"]').attr("content") ||
    $('meta[name="publish-date"]').attr("content")
  );

  const content: ContentSignals = {
    wordCount,
    headingHierarchy,
    paragraphCount,
    internalLinksCount,
    externalLinksCount,
    imageCount,
    missingAltCount,
    hasAuthor,
    hasPublishDate
  };

  // 4. Structured Data Signals (JSON-LD Schema)
  const schemaTypes: string[] = [];
  let hasJsonLd = false;
  let isValidSchema = true;

  $('script[type="application/ld+json"]').each((_, el) => {
    hasJsonLd = true;
    try {
      const rawJson = $(el).html();
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        const findTypes = (obj: any) => {
          if (!obj) return;
          if (typeof obj === "object") {
            if (obj["@type"]) {
              schemaTypes.push(String(obj["@type"]));
            }
            if (Array.isArray(obj)) {
              obj.forEach(findTypes);
            } else {
              Object.values(obj).forEach(findTypes);
            }
          }
        };
        findTypes(parsed);
      }
    } catch {
      isValidSchema = false;
    }
  });

  const structuredData: StructuredDataSignals = {
    hasJsonLd,
    schemaTypes: Array.from(new Set(schemaTypes)),
    isValidSchema
  };

  // 5. Entity Signals (Heuristic Brand/Entity Extractor based on Persian/English keywords)
  // Look for prominent proper noun entities like companies, products, domains
  const entityList = new Set<string>();
  const textToScan = `${title} ${description} ${bodyText}`.substring(0, 5000);

  // Broad Persian proper nouns or tech keywords from document
  const entitiesToMatch = [
    "Optimus",
    "Rasha Gostar",
    "Digikala",
    "Snapp",
    "Tapsi",
    "Bamilo",
    "Divar",
    "Cafe Bazaar",
    "ZarinPal",
    "Aparat",
    "Irancell",
    "Hamrah Aval"
  ];

  entitiesToMatch.forEach(ent => {
    if (new RegExp(ent, "i").test(textToScan)) {
      entityList.add(ent);
    }
  });

  // Extract capitalised English words as entities heuristically if they look like brands
  const capitalWords = textToScan.match(/[A-Z][a-zA-Z0-9]{3,}/g);
  if (capitalWords) {
    capitalWords.slice(0, 15).forEach(word => {
      const commonStopwords = ["HTML", "JSON", "HTTP", "HTTPS", "UTF-8", "ABOUT", "CONTACT", "BLOG", "HOME"];
      if (!commonStopwords.includes(word.toUpperCase())) {
        entityList.add(word);
      }
    });
  }

  const detectedEntities = Array.from(entityList);
  const totalCharacters = textToScan.length || 1;
  const entityDensity = (detectedEntities.length * 100) / totalCharacters;

  // Detect if domain name/brand is part of the entities
  const hasBrandEntity = detectedEntities.length > 0;

  const entities: EntitySignals = {
    detectedEntities,
    entityDensity,
    hasBrandEntity
  };

  logger.info("Raw signals extraction completed", {
    wordCount,
    headingHierarchy,
    schemaTypes: structuredData.schemaTypes,
    entitiesFound: detectedEntities.length
  });

  return {
    technical,
    metadata,
    content,
    entities,
    structuredData
  };
}
