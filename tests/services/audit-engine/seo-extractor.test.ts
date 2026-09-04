/**
 * Automated Enterprise Test Suite for SEO Signal Extraction Layer.
 * Verifies all 12 SEO Signal categories: metadata, headings, canonicals, robots,
 * sitemaps, structured data, links, HTTP status codes, redirects, indexability,
 * content structure, and performance.
 */

import { extractSeoSignals } from "../../../src/lib/audit-engine/seo-extractor";
import { CrawlResult } from "../../../src/types/audit";
import * as assert from "assert";

// Helper to construct a standard CrawlResult
function makeCrawl(options: Partial<CrawlResult> & { rawHtml?: string }): CrawlResult {
  const html = options.rawHtml ?? "<html><body></body></html>";
  return {
    url: "https://example.com",
    statusCode: 200,
    headers: {},
    isHttps: true,
    redirectChain: [],
    redirectDepth: 0,
    bodySize: Buffer.byteLength(html, "utf-8"),
    rawHtml: html,
    ...options
  };
}

// Global Fetch Interception Mock specifically for sitemap tests
const originalFetch = globalThis.fetch;
const sitemapMockData: Record<string, { status: number; body: string }> = {};

function setupSitemapFetchMock() {
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = input.toString();

    if (init?.signal?.aborted) {
      const err = new Error("The operation was aborted.");
      err.name = "AbortError";
      throw err;
    }

    if (sitemapMockData[urlStr]) {
      const matched = sitemapMockData[urlStr];
      return {
        ok: matched.status >= 200 && matched.status < 300,
        status: matched.status,
        statusText: matched.status === 200 ? "OK" : "Error",
        headers: new Headers(),
        text: async () => matched.body
      } as unknown as Response;
    }

    return {
      ok: false,
      status: 404,
      statusText: "Not Found",
      headers: new Headers(),
      text: async () => "Not Found"
    } as unknown as Response;
  };
}

function restoreSitemapFetchMock() {
  globalThis.fetch = originalFetch;
}

export async function runSeoExtractorTests() {
  console.log("=========================================================================");
  console.log("SEO SIGNAL EXTRACTION LAYER — AUTOMATED UNIT & INTEGRATION TEST SUITE");
  console.log("=========================================================================");

  setupSitemapFetchMock();

  try {
    // ----------------------------------------------------
    // 1. Metadata Extraction Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Metadata Extraction...");

    // Case: Missing Title & Description
    const crawlMetaEmpty = makeCrawl({ rawHtml: "<html><head></head><body></body></html>" });
    const signalsMetaEmpty = await extractSeoSignals(crawlMetaEmpty);
    assert.strictEqual(signalsMetaEmpty.metadata.title.present, false);
    assert.strictEqual(signalsMetaEmpty.metadata.description.present, false);
    assert.strictEqual(signalsMetaEmpty.metadata.title.count, 0);

    // Case: Title & Description Present, OG/Twitter fallbacks, duplicate title
    const crawlMetaFull = makeCrawl({
      rawHtml: `
        <html>
          <head>
            <title>My Primary Title</title>
            <title>My Duplicate Title</title>
            <meta name="description" content="My primary description.">
            <meta property="og:title" content="OG Title">
            <meta name="twitter:description" content="Twitter Desc">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta charset="utf-8">
          </head>
          <body></body>
        </html>
      `
    });
    const signalsMetaFull = await extractSeoSignals(crawlMetaFull);
    assert.strictEqual(signalsMetaFull.metadata.title.present, true);
    assert.strictEqual(signalsMetaFull.metadata.title.value, "My Primary Title");
    assert.strictEqual(signalsMetaFull.metadata.title.count, 2);
    assert.strictEqual(signalsMetaFull.metadata.title.source, "tag");

    assert.strictEqual(signalsMetaFull.metadata.description.present, true);
    assert.strictEqual(signalsMetaFull.metadata.description.value, "My primary description.");
    assert.strictEqual(signalsMetaFull.metadata.description.count, 1);

    assert.strictEqual(signalsMetaFull.metadata.viewport.present, true);
    assert.strictEqual(signalsMetaFull.metadata.viewport.value, "width=device-width, initial-scale=1.0");
    assert.strictEqual(signalsMetaFull.metadata.charset, "utf-8");
    console.log("  ✅ Metadata Extraction verified successfully.");

    // ----------------------------------------------------
    // 2. Heading Hierarchy Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Heading Hierarchy...");

    // Case: No Headings
    const crawlHeadEmpty = makeCrawl({ rawHtml: "<html><body></body></html>" });
    const signalsHeadEmpty = await extractSeoSignals(crawlHeadEmpty);
    assert.strictEqual(signalsHeadEmpty.headings.sequence.length, 0);
    assert.strictEqual(signalsHeadEmpty.headings.counts.h1, 0);

    // Case: Multi-level, document order, multiple H1s
    const crawlHeadHierarchy = makeCrawl({
      rawHtml: `
        <html>
          <body>
            <h2>Second Heading</h2>
            <h1>Main H1 First</h1>
            <h3>Third Heading</h3>
            <h1>Duplicate H1</h1>
            <h6>Very Low Heading</h6>
          </body>
        </html>
      `
    });
    const signalsHeadHierarchy = await extractSeoSignals(crawlHeadHierarchy);
    assert.strictEqual(signalsHeadHierarchy.headings.counts.h1, 2);
    assert.strictEqual(signalsHeadHierarchy.headings.counts.h2, 1);
    assert.strictEqual(signalsHeadHierarchy.headings.counts.h6, 1);

    // Validate sequence preserves document order
    assert.strictEqual(signalsHeadHierarchy.headings.sequence[0].text, "Second Heading");
    assert.strictEqual(signalsHeadHierarchy.headings.sequence[0].level, 2);
    assert.strictEqual(signalsHeadHierarchy.headings.sequence[1].text, "Main H1 First");
    assert.strictEqual(signalsHeadHierarchy.headings.sequence[1].level, 1);
    console.log("  ✅ Heading Hierarchy verified successfully.");

    // ----------------------------------------------------
    // 3. Canonical Verification Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Canonical Link Extraction...");

    // Case: Missing Canonical
    const crawlCanEmpty = makeCrawl({ rawHtml: "<html><body></body></html>" });
    const signalsCanEmpty = await extractSeoSignals(crawlCanEmpty);
    assert.strictEqual(signalsCanEmpty.canonical.present, false);
    assert.strictEqual(signalsCanEmpty.canonical.url, null);

    // Case: Multiple canonicals, invalid URL, relative URL
    const crawlCanComplex = makeCrawl({
      url: "https://example.com/subpage",
      rawHtml: `
        <html>
          <head>
            <link rel="canonical" href="https://example.com/subpage">
            <link rel="canonical" href="/relative-path">
          </head>
          <body></body>
        </html>
      `
    });
    const signalsCanComplex = await extractSeoSignals(crawlCanComplex);
    assert.strictEqual(signalsCanComplex.canonical.present, true);
    assert.strictEqual(signalsCanComplex.canonical.url, "https://example.com/subpage");
    assert.strictEqual(signalsCanComplex.canonical.multiple, true);
    assert.strictEqual(signalsCanComplex.canonical.isValid, true);
    assert.strictEqual(signalsCanComplex.canonical.matchesPageUrl, true);
    assert.strictEqual(signalsCanComplex.canonical.occurrences.length, 2);
    console.log("  ✅ Canonical Link Extraction verified successfully.");

    // ----------------------------------------------------
    // 4. Robots Directives Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Robots Directives Parsing...");

    // Case: Meta robots index, follow + Header noarchive, noimageindex
    const crawlRobots = makeCrawl({
      headers: { "X-Robots-Tag": "noarchive, noimageindex" },
      rawHtml: `
        <html>
          <head>
            <meta name="robots" content="noindex, follow">
          </head>
          <body></body>
        </html>
      `
    });
    const signalsRobots = await extractSeoSignals(crawlRobots);
    assert.deepStrictEqual(signalsRobots.robots.metaDirectives, ["noindex", "follow"]);
    assert.deepStrictEqual(signalsRobots.robots.headerDirectives, ["noarchive", "noimageindex"]);
    assert.strictEqual(signalsRobots.robots.directives.includes("noindex"), true);
    assert.strictEqual(signalsRobots.robots.directives.includes("noarchive"), true);
    assert.strictEqual(signalsRobots.robots.indexAllowed, false);
    assert.strictEqual(signalsRobots.robots.followAllowed, true);
    console.log("  ✅ Robots Directives Parsing verified successfully.");

    // ----------------------------------------------------
    // 5. XML Sitemap Discovery & Parsing Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Sitemap Processing & XML parsing...");

    // Case A: Missing sitemap (404)
    sitemapMockData["https://example.com/sitemap.xml"] = { status: 404, body: "Not Found" };
    const crawlSitemap404 = makeCrawl({ url: "https://example.com" });
    const signalsSitemap404 = await extractSeoSignals(crawlSitemap404);
    assert.strictEqual(signalsSitemap404.sitemap.discovered, false);
    assert.strictEqual(signalsSitemap404.sitemap.status, 404);
    assert.strictEqual(signalsSitemap404.sitemap.parsedSuccessfully, false);

    // Case B: Valid standard Sitemap URL Set
    sitemapMockData["https://example.com/sitemap.xml"] = {
      status: 200,
      body: `
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url>
            <loc>https://example.com/home</loc>
            <lastmod>2026-08-11</lastmod>
          </url>
          <url>
            <loc>https://example.com/blog</loc>
            <lastmod>2026-08-10</lastmod>
          </url>
        </urlset>
      `
    };
    const signalsSitemap200 = await extractSeoSignals(crawlSitemap404);
    assert.strictEqual(signalsSitemap200.sitemap.discovered, true);
    assert.strictEqual(signalsSitemap200.sitemap.isIndex, false);
    assert.strictEqual(signalsSitemap200.sitemap.urlsCount, 2);
    assert.strictEqual(signalsSitemap200.sitemap.lastModified, "2026-08-11");
    assert.deepStrictEqual(signalsSitemap200.sitemap.entries, [
      "https://example.com/home",
      "https://example.com/blog"
    ]);

    // Case C: Nested Sitemap Index
    sitemapMockData["https://example.com/sitemap.xml"] = {
      status: 200,
      body: `
        <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <sitemap>
            <loc>https://example.com/sub-sitemap-1.xml</loc>
            <lastmod>2026-08-15</lastmod>
          </sitemap>
        </sitemapindex>
      `
    };
    const signalsSitemapIndex = await extractSeoSignals(crawlSitemap404);
    assert.strictEqual(signalsSitemapIndex.sitemap.discovered, true);
    assert.strictEqual(signalsSitemapIndex.sitemap.isIndex, true);
    assert.strictEqual(signalsSitemapIndex.sitemap.urlsCount, 1);
    assert.strictEqual(signalsSitemapIndex.sitemap.entries[0], "https://example.com/sub-sitemap-1.xml");

    // Case D: Malformed XML (Parse resilience)
    sitemapMockData["https://example.com/sitemap.xml"] = {
      status: 200,
      body: "<invalid-xml><url><loc>broken"
    };
    const signalsSitemapMalformed = await extractSeoSignals(crawlSitemap404);
    assert.strictEqual(signalsSitemapMalformed.sitemap.discovered, true);
    // Cheerio/xmlMode parses broken tags leniently
    assert.strictEqual(signalsSitemapMalformed.sitemap.parsedSuccessfully, true);
    console.log("  ✅ XML Sitemap Processing verified successfully.");

    // ----------------------------------------------------
    // 6. Structured Data Extraction Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Structured Data Extraction...");

    // Case: Valid JSON-LD block + Malformed JSON-LD block + Microdata
    const crawlStructured = makeCrawl({
      rawHtml: `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": "Super AI Engine"
              }
            </script>
            <script type="application/ld+json">
              { "@context": "https://schema.org", "name": "Broken Schema"
            </script>
          </head>
          <body>
            <div itemscope itemtype="https://schema.org/LocalBusiness">
              <span itemprop="name">Snapp HQ</span>
              <span itemprop="telephone">021-12345</span>
            </div>
          </body>
        </html>
      `
    });
    const signalsStructured = await extractSeoSignals(crawlStructured);
    assert.strictEqual(signalsStructured.structuredData.hasJsonLd, true);
    assert.strictEqual(signalsStructured.structuredData.blocksCount, 2);

    // Block 0: Valid Product block
    assert.strictEqual(signalsStructured.structuredData.blocks[0].isParsed, true);
    assert.strictEqual(signalsStructured.structuredData.blocks[0].type, "Product");

    // Block 1: Malformed block
    assert.strictEqual(signalsStructured.structuredData.blocks[1].isParsed, false);
    assert.notStrictEqual(signalsStructured.structuredData.blocks[1].parseError, null);

    // Schema Types Collected
    assert.deepStrictEqual(signalsStructured.structuredData.schemaTypes, ["Product"]);

    // Microdata Extraction
    assert.strictEqual(signalsStructured.structuredData.microdata.length, 1);
    assert.strictEqual(signalsStructured.structuredData.microdata[0].type, "https://schema.org/LocalBusiness");
    assert.strictEqual(signalsStructured.structuredData.microdata[0].properties.name, "Snapp HQ");
    assert.strictEqual(signalsStructured.structuredData.microdata[0].properties.telephone, "021-12345");
    console.log("  ✅ Structured Data Extraction verified successfully.");

    // ----------------------------------------------------
    // 7. Internal & External Links Verification Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Internal & External Links...");

    // Case: Subdomains, ports, relative/absolute links, query strings, duplicates
    const crawlLinks = makeCrawl({
      url: "https://sub.my-site.com:8080/landing?ref=1",
      rawHtml: `
        <html>
          <body>
            <a href="/pricing">Relative path</a>
            <a href="./about">Relative dot</a>
            <a href="https://sub.my-site.com:8080/contact#faq">Absolute Internal with Query/Port</a>
            <a href="https://different-site.com/home">Absolute External</a>
            <a href="#section-2">Fragment Only</a>
            <a href="/pricing">Duplicate relative pricing</a>
          </body>
        </html>
      `
    });
    const signalsLinks = await extractSeoSignals(crawlLinks);
    assert.strictEqual(signalsLinks.internalLinks.links.length, 6);
    assert.strictEqual(signalsLinks.internalLinks.internalCount, 5); // /pricing, ./about, contact, fragment, duplicate
    assert.strictEqual(signalsLinks.internalLinks.externalCount, 1); // different-site.com
    assert.strictEqual(signalsLinks.internalLinks.relativeCount, 3); // /pricing, ./about, duplicate pricing
    assert.strictEqual(signalsLinks.internalLinks.fragmentOnlyCount, 1); // #section-2

    // Unique targets count (no duplicates)
    assert.strictEqual(signalsLinks.internalLinks.uniqueTargets.includes("https://sub.my-site.com:8080/pricing"), true);
    assert.strictEqual(signalsLinks.internalLinks.uniqueTargets.includes("https://different-site.com/home"), true);
    console.log("  ✅ Links Classification verified successfully.");

    // ----------------------------------------------------
    // 8. HTTP Status Codes & Redirects Tests
    // ----------------------------------------------------
    console.log("▶ TEST: HTTP Response Codes & Redirects...");

    // Case 1: HTTP 200 OK
    const crawl200 = makeCrawl({ statusCode: 200 });
    const signals200 = await extractSeoSignals(crawl200);
    assert.strictEqual(signals200.http.statusCode, 200);
    assert.strictEqual(signals200.http.isSuccess, true);
    assert.strictEqual(signals200.http.isRedirect, false);

    // Case 2: HTTP 404 Client Error
    const crawl404 = makeCrawl({ statusCode: 404 });
    const signals404 = await extractSeoSignals(crawl404);
    assert.strictEqual(signals404.http.statusCode, 404);
    assert.strictEqual(signals404.http.isClientError, true);

    // Case 3: Redirect loops & chains
    const crawlRedirectChain = makeCrawl({
      statusCode: 200,
      url: "https://example.com/final",
      redirectChain: ["https://example.com/start", "https://example.com/middle"],
      redirectDepth: 2
    });
    const signalsRedirect = await extractSeoSignals(crawlRedirectChain);
    assert.strictEqual(signalsRedirect.redirects.redirectCount, 2);
    assert.strictEqual(signalsRedirect.redirects.initialUrl, "https://example.com/start");
    assert.strictEqual(signalsRedirect.redirects.finalUrl, "https://example.com/final");
    assert.strictEqual(signalsRedirect.redirects.isLoop, false);
    assert.strictEqual(signalsRedirect.redirects.excessiveCount, false);

    // Case 4: Redirect Loop
    const crawlRedirectLoop = makeCrawl({
      statusCode: 200,
      url: "https://example.com/loop-1",
      redirectChain: ["https://example.com/loop-1", "https://example.com/loop-2"],
      redirectDepth: 2
    });
    const signalsRedirectLoop = await extractSeoSignals(crawlRedirectLoop);
    assert.strictEqual(signalsRedirectLoop.redirects.isLoop, true);
    console.log("  ✅ HTTP & Redirects verified successfully.");

    // ----------------------------------------------------
    // 9. Indexability Evaluation Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Indexability Assessment...");

    // Case A: Success 200, clean index/follow → Indexable
    const crawlIndexable = makeCrawl({
      rawHtml: "<html><head><title>OK</title></head><body></body></html>"
    });
    const signalsIndexable = await extractSeoSignals(crawlIndexable);
    assert.strictEqual(signalsIndexable.indexability.isIndexable, true);
    assert.strictEqual(signalsIndexable.indexability.status, "indexable");

    // Case B: Success 200, meta noindex → Noindex
    const crawlNoIndex = makeCrawl({
      rawHtml: '<html><head><meta name="robots" content="noindex"></head><body></body></html>'
    });
    const signalsNoIndex = await extractSeoSignals(crawlNoIndex);
    assert.strictEqual(signalsNoIndex.indexability.isIndexable, false);
    assert.strictEqual(signalsNoIndex.indexability.status, "noindex");

    // Case C: non-200 Status
    const crawlNon200 = makeCrawl({ statusCode: 500, rawHtml: "Error" });
    const signalsNon200 = await extractSeoSignals(crawlNon200);
    assert.strictEqual(signalsNon200.indexability.isIndexable, false);
    assert.strictEqual(signalsNon200.indexability.status, "non_200_status");
    console.log("  ✅ Indexability Evidence verified successfully.");

    // ----------------------------------------------------
    // 10. Content Structure Evaluation Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Content Structure Observations...");

    const crawlContentStructure = makeCrawl({
      rawHtml: `
        <html>
          <body>
            <main>
              <h1>Main Title</h1>
              <p>This is paragraph number one which contains some simple text content.</p>
              <p>This is paragraph number two with SnappSnappSnapp Snapp.</p>
              <ul>
                <li>List Item 1</li>
                <li>List Item 2</li>
              </ul>
              <table>
                <tr><td>Cell</td></tr>
              </table>
              <img src="/logo.png">
              <video src="/trailer.mp4"></video>
            </main>
          </body>
        </html>
      `
    });
    const signalsContent = await extractSeoSignals(crawlContentStructure);
    assert.strictEqual(signalsContent.contentStructure.hasBody, true);
    assert.strictEqual(signalsContent.contentStructure.hasMain, true);
    assert.strictEqual(signalsContent.contentStructure.paragraphCount, 2);
    assert.strictEqual(signalsContent.contentStructure.listCount, 1);
    assert.strictEqual(signalsContent.contentStructure.tableCount, 1);
    assert.strictEqual(signalsContent.contentStructure.imageCount, 1);
    assert.strictEqual(signalsContent.contentStructure.videoCount, 1);
    assert.strictEqual(signalsContent.contentStructure.wordCount > 10, true);
    console.log("  ✅ Content Structure verified successfully.");

    // ----------------------------------------------------
    // 11. Performance Metrics Evaluation Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Performance Timing data extraction...");

    // Case A: Performance data measured
    const crawlPerf = makeCrawl({ bodySize: 1024 });
    const signalsPerf = await extractSeoSignals(crawlPerf, { responseTimeMs: 420, downloadDurationMs: 80 });
    assert.strictEqual(signalsPerf.performance.isMeasured, true);
    assert.strictEqual(signalsPerf.performance.responseTimeMs, 420);
    assert.strictEqual(signalsPerf.performance.downloadDurationMs, 80);
    assert.strictEqual(signalsPerf.performance.responseSize, 1024);

    // Case B: Performance data missing/unavailable
    const signalsPerfMissing = await extractSeoSignals(crawlPerf);
    assert.strictEqual(signalsPerfMissing.performance.isMeasured, false);
    assert.strictEqual(signalsPerfMissing.performance.responseTimeMs, null);
    assert.strictEqual(signalsPerfMissing.performance.downloadDurationMs, null);
    console.log("  ✅ Performance Timing verified successfully.");

    console.log("=========================================================================");
    console.log("✅ ALL SEO SIGNAL EXTRACTION TESTS COMPLETED SUCCESSFULLY!");
    console.log("=========================================================================");

  } finally {
    restoreSitemapFetchMock();
  }
}

// Support executing directly
if (require.main === module) {
  runSeoExtractorTests()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}
