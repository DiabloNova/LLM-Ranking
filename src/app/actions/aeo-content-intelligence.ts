"use server";

import { z } from "zod";
import { TenantContextManager } from "@/core/database/tenant-context";
import { requireSession } from "@/services/auth/session";
import { requireWorkspaceMembership } from "@/services/auth/authorization";
import { AeoContentIntelligenceService } from "@/features/ai-intelligence/services/aeo-content-intelligence-service";
import { AeoContentIntelligenceRepository, PageRepository, WebsiteRepository } from "@/features/ai-intelligence/repositories";

/**
 * Exposes aggregated AEO Content Intelligence analytics for the active workspace.
 * Automatically seeds default pages and executes baseline analyses if empty.
 */
export async function getAeoContentDashboardDataAction() {
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
    const requestId = `req-aeo-content-${Date.now()}`;

    return await TenantContextManager.runWithTenantContext(tenantId, userId, requestId, async () => {
      const repo = new AeoContentIntelligenceRepository();
      const pageRepo = new PageRepository();
      const websiteRepo = new WebsiteRepository();
      const service = new AeoContentIntelligenceService();

      // 1. Fetch current website and pages for tenant
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

      // Seed pages if empty
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
          statusCode: 200,
          indexability: "indexable",
          title: "تعرفه و قیمت خدمات سئو معنایی و هوش مصنوعی رشا گستر",
          description: "هزینه و قیمت پلن‌های مختلف پایش رویت‌پذیری هوش مصنوعی و سئو فنی.",
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

      // 2. Fetch or execute analysis for each page
      const analyses = [];
      for (const pg of pages) {
        let analysis = await repo.findAnalysisByPageId(tenantId, pg.id);
        if (!analysis) {
          // If no analysis exists, run one immediately to populate actual data
          analysis = await service.executeAnalysis(tenantId, pg.id);
        }
        analyses.push(analysis);
      }

      // 3. Fetch FAQ Opportunities
      const faqOpportunities = await repo.findAllFaqOpportunities(tenantId);

      // 4. Fetch KG Alignments
      const kgAlignments = await repo.findAllKgAlignments(tenantId);

      // 5. Expose Recommendation Alerts (Task 4.4 integration)
      const recommendationSignals = [];
      for (const pg of pages) {
        const signals = await service.detectAeoAlertSignals(tenantId, pg.id);
        recommendationSignals.push(...signals.map(s => ({ ...s, pageId: pg.id, path: pg.path })));
      }

      return {
        success: true,
        result: {
          pages,
          analyses,
          faqOpportunities,
          kgAlignments,
          recommendationSignals
        }
      };
    });
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Internal Server Error" };
  }
}

/**
 * Execute AEO Content analysis for a given page on demand
 */
export async function runAeoAnalysisForPageAction(pageId: string) {
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
    const requestId = `req-aeo-analysis-run-${Date.now()}`;

    return await TenantContextManager.runWithTenantContext(tenantId, userId, requestId, async () => {
      const service = new AeoContentIntelligenceService();
      const analysis = await service.executeAnalysis(tenantId, pageId);
      return { success: true, result: analysis };
    });
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Internal Server Error" };
  }
}
