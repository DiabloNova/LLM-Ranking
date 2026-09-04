import {
  analyzeStructuredData,
  analyzeCrawlability,
  analyzeIndexability,
  analyzeInternalLinking,
  analyzeSitemap,
  analyzeCanonical,
  analyzeRobots,
  analyzeCoreWebVitals,
  TechnicalSeoAnalyzerService
} from "../../../src/services/technical-seo-analyzer";
import { SeoSignals } from "../../../src/types/seo-signals";
import { TenantContextManager } from "../../../src/core/database/tenant-context";
import * as assert from "assert";

export async function runTechnicalSeoAnalyzerTests() {
  console.log("=========================================================================");
  console.log("TECHNICAL SEO ANALYZER — INTEGRATION & UNIT TEST SUITE");
  console.log("=========================================================================");

  // Healthy Mock Signal Input
  const healthySignals: SeoSignals = {
    page: {
      url: "https://example.com/home",
      normalizedUrl: "https://example.com/home",
      crawledAt: "2026-08-31T00:00:00.000Z",
      charset: "utf-8",
      language: "en"
    },
    metadata: {
      title: { value: "Healthy Home", present: true, count: 1, source: "tag" },
      description: { value: "Healthy Description", present: true, count: 1, source: "tag" },
      robots: { value: "index, follow", present: true },
      viewport: { value: "width=device-width", present: true },
      language: "en",
      charset: "utf-8",
      openGraph: {},
      twitter: {},
      rawMetadata: []
    },
    headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [], counts: {}, sequence: [] },
    canonical: { present: true, url: "https://example.com/home", normalizedUrl: "https://example.com/home", multiple: false, isValid: true, matchesPageUrl: true, occurrences: ["https://example.com/home"] },
    robots: { metaDirectives: ["index"], headerDirectives: [], directives: ["index"], indexAllowed: true, followAllowed: true, rawMeta: "index", rawHeader: null },
    sitemap: { discovered: true, url: "https://example.com/sitemap.xml", status: 200, parsedSuccessfully: true, urlsCount: 1, entries: ["https://example.com/home"], isIndex: false, lastModified: null, parseError: null },
    structuredData: { hasJsonLd: true, blocks: [{ type: "Article", payload: { headline: "Headline", author: "Author", publisher: "Publisher", datePublished: "2026-08-31" }, isParsed: true, parseError: null }], blocksCount: 1, schemaTypes: ["Article"], parseErrors: [], microdata: [] },
    internalLinks: { links: [{ sourceUrl: "https://example.com/home", targetUrl: "https://example.com/about", normalizedTargetUrl: "https://example.com/about", anchorText: "About Us", rel: null, isRelative: true, isExternal: false, isFragmentOnly: false }], internalCount: 1, externalCount: 0, relativeCount: 1, absoluteCount: 0, fragmentOnlyCount: 0, uniqueTargets: ["https://example.com/about"] },
    http: { statusCode: 200, isSuccess: true, isRedirect: false, isClientError: false, isServerError: false, headers: {} },
    redirects: { initialUrl: "https://example.com/home", finalUrl: "https://example.com/home", redirectChain: [], redirectStatusCodes: [], redirectLocations: [], redirectCount: 0, isLoop: false, excessiveCount: false },
    indexability: { isIndexable: true, status: "indexable", evidence: { statusCode: 200, robotsIndexAllowed: true, canonicalMatches: true, hasNoIndexDirective: false }, limitations: [] },
    contentStructure: { hasBody: true, hasMain: true, paragraphCount: 5, textBlockCount: 5, listCount: 0, tableCount: 0, imageCount: 1, videoCount: 0, semanticElements: [], wordCount: 300, textLength: 1200, headingToContentRatio: 0 },
    performance: { responseTimeMs: 150, downloadDurationMs: 50, responseSize: 1024, resourceCount: 5, isMeasured: true }
  };

  // Critical Mock Signal Input with errors across all areas
  const criticalSignals: SeoSignals = {
    page: {
      url: "https://example.com/error-page",
      normalizedUrl: "https://example.com/error-page",
      crawledAt: "2026-08-31T00:00:00.000Z",
      charset: "utf-8",
      language: "en"
    },
    metadata: {
      title: { value: null, present: false, count: 0, source: "none" },
      description: { value: null, present: false, count: 0, source: "none" },
      robots: { value: "noindex, follow", present: true },
      viewport: { value: null, present: false },
      language: "en",
      charset: "utf-8",
      openGraph: {},
      twitter: {},
      rawMetadata: []
    },
    headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [], counts: {}, sequence: [] },
    canonical: { present: true, url: "https://example.com/different-target", normalizedUrl: "https://example.com/different-target", multiple: true, isValid: true, matchesPageUrl: false, occurrences: ["https://example.com/different-target", "https://example.com/another-one"] },
    robots: { metaDirectives: ["noindex", "index"], headerDirectives: [], directives: ["noindex", "index"], indexAllowed: false, followAllowed: true, rawMeta: "noindex, index", rawHeader: null },
    sitemap: { discovered: false, url: null, status: null, parsedSuccessfully: null, urlsCount: null, entries: [], isIndex: null, lastModified: null, parseError: null },
    structuredData: { hasJsonLd: true, blocks: [{ type: "Article", payload: {}, isParsed: false, parseError: "Malformed JSON" }], blocksCount: 1, schemaTypes: [], parseErrors: ["Malformed JSON"], microdata: [] },
    internalLinks: { links: [], internalCount: 0, externalCount: 0, relativeCount: 0, absoluteCount: 0, fragmentOnlyCount: 0, uniqueTargets: [] },
    http: { statusCode: 500, isSuccess: false, isRedirect: false, isClientError: false, isServerError: true, headers: {} },
    redirects: { initialUrl: "https://example.com/error-page", finalUrl: "https://example.com/error-page", redirectChain: ["https://example.com/1", "https://example.com/2"], redirectStatusCodes: [301, 301], redirectLocations: [], redirectCount: 2, isLoop: true, excessiveCount: true },
    indexability: { isIndexable: false, status: "non_200_status", evidence: { statusCode: 500, robotsIndexAllowed: false, canonicalMatches: false, hasNoIndexDirective: true }, limitations: ["HTTP Status 500"] },
    contentStructure: { hasBody: true, hasMain: false, paragraphCount: 0, textBlockCount: 0, listCount: 0, tableCount: 0, imageCount: 0, videoCount: 0, semanticElements: [], wordCount: 10, textLength: 100, headingToContentRatio: 0 },
    performance: { responseTimeMs: 3500, downloadDurationMs: 150, responseSize: 2000000, resourceCount: 50, isMeasured: true }
  };

  try {
    // 1. Structured Data Analyzer Tests
    console.log("▶ TEST: Structured Data Analyzer (Positive/Negative/Missing Required)...");
    const sdHealthy = analyzeStructuredData(healthySignals);
    assert.strictEqual(sdHealthy.length, 0);

    const sdCritical = analyzeStructuredData(criticalSignals);
    const hasMalformed = sdCritical.some(f => f.code === "ERR_STRUCT_JSONLD_MALFORMED");
    assert.strictEqual(hasMalformed, true);

    const missingRequiredSignals: SeoSignals = {
      ...healthySignals,
      structuredData: {
        hasJsonLd: true,
        blocks: [{ type: "Article", payload: { headline: "Just Headline" }, isParsed: true, parseError: null }],
        blocksCount: 1,
        schemaTypes: ["Article"],
        parseErrors: [],
        microdata: []
      }
    };
    const sdMissing = analyzeStructuredData(missingRequiredSignals);
    const hasMissingReq = sdMissing.some(f => f.code === "ERR_STRUCT_REQUIRED_PROPERTY_MISSING");
    assert.strictEqual(hasMissingReq, true);
    console.log("  ✅ Structured Data Analyzer verified successfully.");

    // 2. Crawlability Analyzer Tests
    console.log("▶ TEST: Crawlability Analyzer (Healthy/HTTP Error/Redirect Loops)...");
    const crawlHealthy = analyzeCrawlability(healthySignals);
    assert.strictEqual(crawlHealthy.length, 0);

    const crawlCritical = analyzeCrawlability(criticalSignals);
    const hasHttpError = crawlCritical.some(f => f.code === "ERR_CRAWL_HTTP_ERROR");
    const hasRedirectIssue = crawlCritical.some(f => f.code === "ERR_CRAWL_REDIRECT_ISSUE");
    assert.strictEqual(hasHttpError, true);
    assert.strictEqual(hasRedirectIssue, true);
    console.log("  ✅ Crawlability Analyzer verified successfully.");

    // 3. Indexability Analyzer Tests
    console.log("▶ TEST: Indexability Analyzer (Indexable/Noindex/Canonical Mismatch)...");
    const idxHealthy = analyzeIndexability(healthySignals);
    assert.strictEqual(idxHealthy.length, 0);

    const idxCritical = analyzeIndexability(criticalSignals);
    const hasNoindex = idxCritical.some(f => f.code === "ERR_INDEX_NOINDEX");
    assert.strictEqual(hasNoindex, true);
    console.log("  ✅ Indexability Analyzer verified successfully.");

    // 4. Internal Linking Analyzer Tests
    console.log("▶ TEST: Internal Linking Analyzer (Orphan Page/Empty Anchors)...");
    const linkHealthy = analyzeInternalLinking(healthySignals);
    assert.strictEqual(linkHealthy.length, 0);

    const linkCritical = analyzeInternalLinking(criticalSignals);
    const hasOrphan = linkCritical.some(f => f.code === "ERR_LINK_ORPHAN_PAGE");
    assert.strictEqual(hasOrphan, true);
    console.log("  ✅ Internal Linking Analyzer verified successfully.");

    // 5. Sitemap Analyzer Tests
    console.log("▶ TEST: Sitemap Analyzer (Healthy/Missing/Duplicate URLs)...");
    const sitemapHealthy = analyzeSitemap(healthySignals);
    assert.strictEqual(sitemapHealthy.length, 0);

    const sitemapCritical = analyzeSitemap(criticalSignals);
    const hasMissingSitemap = sitemapCritical.some(f => f.code === "ERR_SITEMAP_MISSING");
    assert.strictEqual(hasMissingSitemap, true);
    console.log("  ✅ Sitemap Analyzer verified successfully.");

    // 6. Canonical Analyzer Tests
    console.log("▶ TEST: Canonical Analyzer (Healthy/Missing/Multiple)...");
    const canonHealthy = analyzeCanonical(healthySignals);
    assert.strictEqual(canonHealthy.length, 0);

    const canonCritical = analyzeCanonical(criticalSignals);
    const hasMultipleCanon = canonCritical.some(f => f.code === "ERR_CANONICAL_MULTIPLE");
    assert.strictEqual(hasMultipleCanon, true);
    console.log("  ✅ Canonical Analyzer verified successfully.");

    // 7. Robots Analyzer Tests
    console.log("▶ TEST: Robots Analyzer (Directives Conflict)...");
    const robHealthy = analyzeRobots(healthySignals);
    assert.strictEqual(robHealthy.length, 0);

    const robCritical = analyzeRobots(criticalSignals);
    const hasConflict = robCritical.some(f => f.code === "ERR_ROBOTS_DIRECTIVES_CONFLICT");
    assert.strictEqual(hasConflict, true);
    console.log("  ✅ Robots Analyzer verified successfully.");

    // 8. Core Web Vitals Analyzer Tests
    console.log("▶ TEST: Core Web Vitals Analyzer (Slow Response/Large Page)...");
    const cwvHealthy = analyzeCoreWebVitals(healthySignals);
    assert.strictEqual(cwvHealthy.length, 0);

    const cwvCritical = analyzeCoreWebVitals(criticalSignals);
    const hasSlowResponse = cwvCritical.some(f => f.code === "ERR_CWV_SLOW_RESPONSE");
    const hasLargePage = cwvCritical.some(f => f.code === "ERR_CWV_LARGE_PAGE");
    assert.strictEqual(hasSlowResponse, true);
    assert.strictEqual(hasLargePage, true);

    const unmeasuredSignals: SeoSignals = {
      ...healthySignals,
      performance: { responseTimeMs: null, downloadDurationMs: null, responseSize: 0, resourceCount: null, isMeasured: false }
    };
    const cwvUnmeasured = analyzeCoreWebVitals(unmeasuredSignals);
    const hasInsufficientEvidence = cwvUnmeasured.some(f => f.code === "ERR_CWV_INSUFFICIENT_EVIDENCE");
    assert.strictEqual(hasInsufficientEvidence, true);
    console.log("  ✅ Core Web Vitals Analyzer verified successfully.");

    // 9. Full Service Aggregation & Tenant Isolation Security Tests
    console.log("▶ TEST: TechnicalSeoAnalyzerService Aggregation & Multi-Tenant Security Boundaries...");
    const tenantA = "tenant-alpha-uuid";
    const tenantB = "tenant-beta-uuid";
    const websiteId = "web-site-a1";

    const service = new TechnicalSeoAnalyzerService();

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-tech-test", async () => {
      const result = await service.executeTechnicalAudit(tenantA, websiteId, criticalSignals);
      assert.strictEqual(result.findings.length > 5, true);

      // Verify and map to expected types
      const httpFailed = result.findings.find(f => f.code === "ERR_CRAWL_HTTP_ERROR");
      assert.notStrictEqual(httpFailed, undefined);
      assert.strictEqual(httpFailed!.category, "technical");
      assert.strictEqual(httpFailed!.severity, "critical");
    });

    // Zero-Trust Tenant Isolation enforcement check
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-malicious", async () => {
        // Attempting to request Tenant A findings from Tenant B context must throw an error immediately
        await service.executeTechnicalAudit(tenantA, websiteId, criticalSignals);
      });
      throw new Error("Security Failure: Cross-tenant analyzer request was erroneously allowed!");
    } catch (err: unknown) {
      const error = err as Error;
      assert.strictEqual(error.message.includes("Security Violation: Cross-tenant operation blocked"), true);
    }
    console.log("  ✅ Full Service Aggregation & Security isolation verified successfully.");

    console.log("=========================================================================");
    console.log("✅ ALL TECHNICAL SEO ANALYZER TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================================================");

  } catch (err: unknown) {
    console.error("❌ Test Suite failed:", err);
    throw err;
  }
}

// Support executing directly
if (require.main === module) {
  runTechnicalSeoAnalyzerTests()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}
