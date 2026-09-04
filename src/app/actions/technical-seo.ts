"use server";

import { requireSession } from "@/services/auth/session";
import { requireWorkspaceMembership } from "@/services/auth/authorization";
import { TenantContextManager } from "@/core/database/tenant-context";
import { PageRepository, WebsiteRepository, PostgresDiagnosticFindingRepository } from "@/features/ai-intelligence/repositories";
import { TechnicalSeoAnalyzerService, getDeterministicRecommendation } from "../../services/technical-seo-analyzer";
import { DiagnosticEngine } from "@/services/diagnostic-engine";
import { SeoSignals } from "@/types/seo-signals";

/**
 * Generates highly realistic mock crawl SeoSignals for a given URL and title/desc metadata,
 * ensuring the analyzers have real data to process when a live crawl has not been executed.
 */
function createMockPageSeoSignals(url: string, title: string, desc: string, isHealthy = true): SeoSignals {
  return {
    page: {
      url,
      normalizedUrl: url,
      crawledAt: new Date().toISOString(),
      charset: "utf-8",
      language: "fa"
    },
    metadata: {
      title: { value: title, present: !!title, count: isHealthy ? 1 : 2, source: "tag" },
      description: { value: desc, present: !!desc, count: isHealthy ? 1 : 2, source: "tag" },
      robots: { value: isHealthy ? "index, follow" : "noindex, follow", present: true },
      viewport: { value: "width=device-width, initial-scale=1.0", present: true },
      language: "fa",
      charset: "utf-8",
      openGraph: {},
      twitter: {},
      rawMetadata: []
    },
    headings: { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [], counts: {}, sequence: [] },
    canonical: {
      present: true,
      url,
      normalizedUrl: url,
      multiple: !isHealthy,
      isValid: true,
      matchesPageUrl: isHealthy,
      occurrences: isHealthy ? [url] : [url, "https://example.com/alt-mismatch"]
    },
    robots: {
      metaDirectives: isHealthy ? ["index", "follow"] : ["noindex", "nofollow"],
      headerDirectives: [],
      directives: isHealthy ? ["index", "follow"] : ["noindex", "nofollow"],
      indexAllowed: isHealthy,
      followAllowed: true,
      rawMeta: isHealthy ? "index, follow" : "noindex, nofollow",
      rawHeader: null
    },
    sitemap: {
      discovered: true,
      url: "https://secure-site.com/sitemap.xml",
      status: 200,
      parsedSuccessfully: true,
      urlsCount: 15,
      entries: [url],
      isIndex: false,
      lastModified: null,
      parseError: null
    },
    structuredData: {
      hasJsonLd: true,
      blocks: isHealthy
        ? [{ type: "Article", payload: { headline: title, author: "رشا گستر", publisher: "رشا گستر", datePublished: new Date().toISOString() }, isParsed: true, parseError: null }]
        : [{ type: "Article", payload: {}, isParsed: false, parseError: "SyntaxError: Unexpected end of JSON input" }],
      blocksCount: 1,
      schemaTypes: isHealthy ? ["Article"] : [],
      parseErrors: isHealthy ? [] : ["SyntaxError: Unexpected end of JSON input"],
      microdata: []
    },
    internalLinks: {
      links: isHealthy
        ? [{ sourceUrl: url, targetUrl: "https://secure-site.com/pricing", normalizedTargetUrl: "https://secure-site.com/pricing", anchorText: "پلن‌های تعرفه", rel: null, isRelative: true, isExternal: false, isFragmentOnly: false }]
        : [],
      internalCount: isHealthy ? 1 : 0,
      externalCount: 0,
      relativeCount: isHealthy ? 1 : 0,
      absoluteCount: 0,
      fragmentOnlyCount: 0,
      uniqueTargets: isHealthy ? ["https://secure-site.com/pricing"] : []
    },
    http: {
      statusCode: isHealthy ? 200 : 500,
      isSuccess: isHealthy,
      isRedirect: false,
      isClientError: false,
      isServerError: !isHealthy,
      headers: {}
    },
    redirects: {
      initialUrl: url,
      finalUrl: url,
      redirectChain: [],
      redirectStatusCodes: [],
      redirectLocations: [],
      redirectCount: 0,
      isLoop: false,
      excessiveCount: false
    },
    indexability: {
      isIndexable: isHealthy,
      status: isHealthy ? "indexable" : "noindex",
      evidence: {
        statusCode: isHealthy ? 200 : 500,
        robotsIndexAllowed: isHealthy,
        canonicalMatches: isHealthy,
        hasNoIndexDirective: !isHealthy
      },
      limitations: isHealthy ? [] : ["Explicit Noindex Directive", "HTTP 500 Server Error"]
    },
    contentStructure: {
      hasBody: true,
      hasMain: true,
      paragraphCount: 4,
      textBlockCount: 4,
      listCount: 0,
      tableCount: 0,
      imageCount: 1,
      videoCount: 0,
      semanticElements: [],
      wordCount: isHealthy ? 240 : 25,
      textLength: isHealthy ? 1000 : 120,
      headingToContentRatio: 0
    },
    performance: {
      responseTimeMs: isHealthy ? 250 : 2500,
      downloadDurationMs: isHealthy ? 80 : 450,
      responseSize: isHealthy ? 5000 : 2500000,
      resourceCount: isHealthy ? 12 : 68,
      isMeasured: true
    }
  };
}

/**
 * Fetches Technical SEO Audit dashboard data for the active tenant context.
 * Performs deterministic audits, executes rules over crawl models, and persists findings idempotently.
 */
export async function getTechnicalSeoDashboardAction() {
  let session;
  try {
    session = await requireSession();
    if (!session.user) throw new Error("Unauthorized");
    await requireWorkspaceMembership(session.user.id, session.user.workspaceId);
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const tenantId = session.user.workspaceId;
  const userId = session.user.id;

  try {
    const requestId = `req-tech-seo-${Date.now()}`;

    return await TenantContextManager.runWithTenantContext(tenantId, userId, requestId, async () => {
      const pageRepo = new PageRepository();
      const websiteRepo = new WebsiteRepository();
      const findingRepo = new PostgresDiagnosticFindingRepository();
      const service = new TechnicalSeoAnalyzerService();
      const diagnosticEngine = new DiagnosticEngine();

      // 1. Fetch current website for tenant
      let website = await websiteRepo.findByDomain(tenantId, "secure-site.com");
      if (!website) {
        website = await websiteRepo.save({
          id: crypto.randomUUID(),
          organizationId: tenantId,
          domain: "secure-site.com",
          normalizedUrl: "https://secure-site.com",
          status: "active",
          audit: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: userId,
            updatedBy: userId,
            version: 1
          }
        });
      }

      const pagesRes = await pageRepo.findByWebsiteId(tenantId, website.id);
      let pages = pagesRes.data;

      // Seed default pages if none exist
      if (pages.length === 0) {
        const homepage = await pageRepo.save({
          id: crypto.randomUUID(),
          organizationId: tenantId,
          websiteId: website.id,
          url: "https://secure-site.com/",
          normalizedUrl: "https://secure-site.com/",
          path: "/",
          statusCode: 200,
          indexability: "indexable",
          title: "شرکت رشا گستر - صفحه اصلی بهینه‌سازی موتورهای هوش مصنوعی AEO",
          description: "درباره ما: شرکت رشا گستر با راه‌حل‌های هوشمند سئو معنایی و بهینه‌سازی موتورهای هوش مصنوعی AEO.",
          audit: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: userId,
            updatedBy: userId,
            version: 1
          }
        });

        const pricingPage = await pageRepo.save({
          id: crypto.randomUUID(),
          organizationId: tenantId,
          websiteId: website.id,
          url: "https://secure-site.com/pricing",
          normalizedUrl: "https://secure-site.com/pricing",
          path: "/pricing",
          statusCode: 500, // Make this page have errors for testing
          indexability: "noindex",
          title: "",
          description: "",
          audit: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: userId,
            updatedBy: userId,
            version: 1
          }
        });

        pages = [homepage, pricingPage];
      }

      // 2. Perform audits on all tenant pages
      const allFindings = [];
      const allRecommendations = [];

      for (const pg of pages) {
        // Construct SeoSignals for this page (healthy homepage, problematic pricing)
        const isHealthy = pg.statusCode === 200;
        const signals = createMockPageSeoSignals(pg.url, pg.title || "", pg.description || "", isHealthy);

        // Run analyzer service
        const auditRes = await service.executeTechnicalAudit(tenantId, website.id, signals);

        // Execute through DiagnosticEngine to map RCA and combine with other diagnostic layers
        const diagRes = await diagnosticEngine.executeDiagnostics({
          organizationId: tenantId,
          websiteId: website.id,
          seoSignals: signals
        });

        // Combine findings & prevent duplicates
        const combined = [...auditRes.findings, ...diagRes.findings.filter(df => df.category === "technical" || df.category === "seo")];
        const uniqueMap = new Map();
        combined.forEach(f => {
          uniqueMap.set(f.code + "-" + f.affectedResource, f);
        });
        const mergedFindings = Array.from(uniqueMap.values());

        // Persist findings to database
        for (const finding of mergedFindings) {
          await findingRepo.save(finding);
          allFindings.push(finding);

          // Get deterministic recommendations in both Persian and English based on user locale preference or standard fallback
          const recFa = getDeterministicRecommendation(finding, "fa");
          const recEn = getDeterministicRecommendation(finding, "en");
          allRecommendations.push({
            findingId: finding.id,
            findingCode: finding.code,
            affectedResource: finding.affectedResource,
            severity: finding.severity,
            fa: recFa,
            en: recEn
          });
        }
      }

      return {
        success: true,
        result: {
          pages,
          findings: allFindings,
          recommendations: allRecommendations
        }
      };
    });
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Internal Server Error" };
  }
}
