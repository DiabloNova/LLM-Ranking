"use server";

import { TenantContextManager } from "@/core/database/tenant-context";
import { requireSession } from "@/services/auth/session";
import { requireWorkspaceMembership } from "@/services/auth/authorization";
import { BrandIntelligenceService } from "@/features/ai-intelligence/services/brand-intelligence-service";
import { BrandIntelligenceRepository, BrandRepository } from "@/features/ai-intelligence/repositories";
import { BrandAssociation } from "@/features/ai-intelligence/domain/types";

/**
 * Exposes brand intelligence telemetry, associations, and recommendation metrics.
 * Safely resolves or auto-provisions a brand if none exists.
 */
export async function getBrandIntelligenceOverviewAction() {
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
    const requestId = `req-brand-intel-${Date.now()}`;

    return await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      requestId,
      async () => {
        const brandRepo = new BrandRepository();
        const service = new BrandIntelligenceService();
        const repo = new BrandIntelligenceRepository();

        const paginated = await brandRepo.findByOrganizationId(tenantId);
        let brand = paginated.data[0] || null;

        // Auto provision a default brand if none exists in the workspace
        if (!brand) {
          const brandId = crypto.randomUUID();
          brand = {
            id: brandId,
            organizationId: tenantId,
            name: "Rasha Gostar",
            description:
              "پیشرو در فناوری‌های هوش مصنوعی و بهینه‌سازی رویت‌پذیری برند",
            website: "https://secure-site.com",
            industry: "Technology",
            country: "Iran",
            audit: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdBy: "system",
              updatedBy: "system",
              version: 1,
            },
          };
          await brandRepo.save(brand);
        }

        // Calculate AI Brand Authority & Visibility
        const authorityMetrics = await service.calculateAIBrandAuthority(
          tenantId,
          brand.id
        );

        // Load semantic associations
        const associations = await repo.findAssociationsByBrandId(
          tenantId,
          brand.id
        );

        // Expose structured alert signals (Task 4.4 Recommendations integration)
        const alerts = await service.detectBrandAlertSignals(
          tenantId,
          brand.id
        );

        // Seed mock baseline associations if empty to ensure rich onboarding dashboard
        let activeAssocs = [...associations];

        if (activeAssocs.length === 0) {
          const seedAssocs: BrandAssociation[] = [
            {
              id: crypto.randomUUID(),
              organizationId: tenantId,
              brandId: brand.id,
              entityName: "سئو معنایی (Semantic SEO)",
              relationshipType: "industry_category",
              occurrenceCount: 8,
              firstSeenAt: new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000
              ).toISOString(),
              lastSeenAt: new Date().toISOString(),
              supportingContext:
                "رشا گستر راهکارهای جامعی در سئو معنایی ارائه می‌دهد.",
              confidence: 0.95,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: crypto.randomUUID(),
              organizationId: tenantId,
              brandId: brand.id,
              entityName: "بهینه‌سازی هوش مصنوعی (AEO)",
              relationshipType: "industry_category",
              occurrenceCount: 14,
              firstSeenAt: new Date(
                Date.now() - 5 * 24 * 60 * 60 * 1000
              ).toISOString(),
              lastSeenAt: new Date().toISOString(),
              supportingContext:
                "سرویس‌های رشا گستر پایداری استناد بالایی در AEO ایجاد می‌کنند.",
              confidence: 0.92,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: crypto.randomUUID(),
              organizationId: tenantId,
              brandId: brand.id,
              entityName: "پایش رویت‌پذیری هوش مصنوعی",
              relationshipType: "product",
              occurrenceCount: 6,
              firstSeenAt: new Date(
                Date.now() - 5 * 24 * 60 * 60 * 1000
              ).toISOString(),
              lastSeenAt: new Date().toISOString(),
              supportingContext:
                "این ابزار پایش با تحلیل‌های دقیق خود یک انتخاب ممتاز است.",
              confidence: 0.9,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ] as BrandAssociation[];

          for (const a of seedAssocs) {
            await repo.saveAssociation(a);
          }

          activeAssocs = seedAssocs;
        }

                return {
          success: true,
          result: {
            brand,
            authorityMetrics,
            associations: activeAssocs,
            alerts,
          },
        };
      }); // پایان کال‌بک و متد
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Internal Server Error",
      };
    }
}
