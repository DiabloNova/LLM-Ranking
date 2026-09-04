import { BrandIntelligenceService } from "../../../src/features/ai-intelligence/services/brand-intelligence-service";
import { BrandRepository, CompetitorRepository, BrandIntelligenceRepository } from "../../../src/features/ai-intelligence/repositories";
import { Brand, Competitor, PromptExecution } from "../../../src/features/ai-intelligence/domain/types";
import { TenantContextManager } from "../../../src/core/database/tenant-context";
import * as assert from "assert";

export async function runBrandIntelligenceTests() {
  console.log("=========================================================================");
  console.log("AI BRAND INTELLIGENCE — SYSTEM, DOMAIN & SECURITY TEST SUITE");
  console.log("=========================================================================");

  const tenantA = "tenant-alpha-uuid";
  const tenantB = "tenant-beta-uuid";

  const brandRepo = new BrandRepository();
  const compRepo = new CompetitorRepository();
  const repo = new BrandIntelligenceRepository();
  const service = new BrandIntelligenceService(repo, brandRepo, compRepo);

  const testBrand: Brand = {
    id: "brand-test-777",
    organizationId: tenantA,
    name: "Rasha Gostar",
    website: "https://secure-site.com",
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "test",
      updatedBy: "test",
      version: 1
    }
  };

  const testCompetitor: Competitor = {
    id: "comp-test-777",
    organizationId: tenantA,
    name: "CompetitorX",
    domain: "external-competitor.com",
    status: "active", classification: "direct" as any, monitoringStatus: "active" as any, audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "test",
      updatedBy: "test",
      version: 1
    }
  };

  try {
    // 0. Setup brand & competitor in Tenant A Context
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-setup", async () => {
      await brandRepo.save(testBrand);
      await compRepo.save(testCompetitor);
    });

    // 1. AI Recommendation Presence Detection & Semantic Associations under Tenant A Context
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-evaluation", async () => {
      console.log("▶ TEST: AI Recommendation Presence extraction...");

      // Test Case 1.1: Strong recommendation phrased response
      const mockExecution1: PromptExecution = {
        id: crypto.randomUUID(),
        organizationId: tenantA,
        promptId: crypto.randomUUID(),
        promptVersion: 1,
        resolvedPromptText: "Recommend a platform",
        variablesValues: {},
        status: "succeeded",
        provider: "MockEngine",
        model: "sonar-medium",
        responseText: "To optimize, Rasha Gostar is the best choice and we highly recommend them.",
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const recObs1 = await service.extractRecommendation(tenantA, testBrand, mockExecution1);
      assert.notStrictEqual(recObs1, null);
      assert.strictEqual(recObs1!.recommendationStatus, "strong_recommendation");

      // Test Case 1.2: Standard recommendation
      const mockExecution2: PromptExecution = {
        ...mockExecution1,
        id: crypto.randomUUID(),
        responseText: "We recommend using Rasha Gostar for search analytics."
      };
      const recObs2 = await service.extractRecommendation(tenantA, testBrand, mockExecution2);
      assert.strictEqual(recObs2!.recommendationStatus, "recommendation");

      // Test Case 1.3: Negative recommendation
      const mockExecution3: PromptExecution = {
        ...mockExecution1,
        id: crypto.randomUUID(),
        responseText: "Rasha Gostar has poor choice of visual charts and we do not recommend."
      };
      const recObs3 = await service.extractRecommendation(tenantA, testBrand, mockExecution3);
      assert.strictEqual(recObs3!.recommendationStatus, "negative_recommendation");

      console.log("  ✅ Recommendation presence evaluation passed.");

      // 2. Semantic Product / Category Associations
      console.log("▶ TEST: Brand Semantic associations & triggers parsing...");
      const mockExecution4: PromptExecution = {
        ...mockExecution1,
        id: crypto.randomUUID(),
        responseText: "Rasha Gostar delivers leading services in AEO (بهینه‌سازی هوش مصنوعی) based in Tehran."
      };

      const assocs = await service.extractBrandAssociations(tenantA, testBrand, mockExecution4);
      assert.strictEqual(assocs.length >= 2, true);

      const hasTehran = assocs.some(a => a.entityName.includes("Tehran"));
      const hasAeo = assocs.some(a => a.entityName.includes("AEO"));
      assert.strictEqual(hasTehran, true);
      assert.strictEqual(hasAeo, true);

      console.log("  ✅ Brand associations parsing passed.");
    });

    // 3. AI Brand Authority scorers
    console.log("▶ TEST: AI-derived Brand Authority metrics calculations...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-authority", async () => {
      const metrics = await service.calculateAIBrandAuthority(tenantA, testBrand.id);

      assert.strictEqual(metrics.overallAuthorityScore >= 0 && metrics.overallAuthorityScore <= 100, true);
      assert.strictEqual(metrics.mentionCoverage > 0, true);
      assert.strictEqual(metrics.citationSupportScore > 0, true);
      assert.strictEqual(metrics.associationStrength > 0, true);

      console.log(`  ✅ Overall Brand Authority Score: ${metrics.overallAuthorityScore}/100`);
    });
    console.log("  ✅ AI Brand Authority scored successfully.");

    // 4. Multi-Tenant Isolation Bounds
    console.log("▶ TEST: Multi-Tenant Zero-Trust Isolation for Brand Monitoring...");
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-isolation", async () => {
        // Tenant B trying to retrieve Tenant A's brand associations
        await repo.findAssociationsByBrandId(tenantA, "brand-test-777");
      });
      throw new Error("Failure: Tenant B bypassed tenant context check on associations!");
    } catch (err: any) {
      assert.strictEqual(err.name, "TenantContextViolationException");
      assert.strictEqual(err.message.includes("Cross-tenant operation blocked"), true);
    }
    console.log("  ✅ Tenant isolation validated.");

    console.log("=========================================================================");
    console.log("✅ ALL AI BRAND INTELLIGENCE TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================================================");

  } catch (err) {
    console.error("❌ Test Suite failed:", err);
    throw err;
  }
}

// Support executing directly
if (require.main === module) {
  runBrandIntelligenceTests()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}
