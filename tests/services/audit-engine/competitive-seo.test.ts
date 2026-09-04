/**
 * Automated Enterprise Integration Test Suite for Competitive SEO Intelligence Engine.
 * Exercises technical, content, keyword, topic, and structural comparison engines
 * with robust edge-case validation, multi-competitor aggregation, and zero-trust isolation.
 */

import { TenantContextManager } from "../../../src/core/database/tenant-context";
import {
  CompetitorRepository,
  WebsiteRepository,
  PageRepository,
  KeywordRepository,
  TopicRepository,
  CompetitiveSeoFindingRepository
} from "../../../src/features/ai-intelligence/repositories";
import { CompetitiveSeoService } from "../../../src/features/ai-intelligence/services/competitive-seo-service";
import {
  Competitor,
  Website,
  Page,
  Keyword,
  Topic,
  CompetitiveSeoFinding,
  AuditMetadata
} from "../../../src/features/ai-intelligence/domain/types";
import * as assert from "assert";

function createAudit(createdBy = "test-system", version = 1): AuditMetadata {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy,
    updatedBy: createdBy,
    version
  };
}

export async function runCompetitiveSeoTests() {
  console.log("=========================================================================");
  console.log("PHASE 6: COMPETITIVE SEO INTELLIGENCE — INTEGRATION & SECURITY TEST SUITE");
  console.log("=========================================================================");

  // Define Mock Tenants
  const tenantA = "33333333-3333-3333-3333-333333333333";
  const tenantB = "44444444-4444-4444-4444-444444444444";

  // Repositories
  const competitorRepo = new CompetitorRepository();
  const websiteRepo = new WebsiteRepository();
  const pageRepo = new PageRepository();
  const keywordRepo = new KeywordRepository();
  const topicRepo = new TopicRepository();
  const findingRepo = new CompetitiveSeoFindingRepository();

  // Service
  const seoService = new CompetitiveSeoService(
    competitorRepo,
    websiteRepo,
    pageRepo,
    keywordRepo,
    topicRepo,
    findingRepo
  );

  try {
    // ----------------------------------------------------
    // Setup and Seed Domain Models under Tenant Context
    // ----------------------------------------------------
    console.log("▶ TEST: Setting up competitive SEO dataset for Tenant A...");

    const competitorId = "f1111111-1111-1111-1111-11111111111f";

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-seo-setup", async () => {
      // 1. Save Websites
      const tenantWebsite: Website = {
        id: "web-tenant-a1",
        organizationId: tenantA,
        domain: "tenant-brand.com",
        normalizedUrl: "https://tenant-brand.com",
        status: "active",
        audit: createAudit()
      };
      await websiteRepo.save(tenantWebsite);

      const competitorWebsite: Website = {
        id: "web-competitor-f1",
        organizationId: tenantA,
        domain: "competitor-rival.com",
        normalizedUrl: "https://competitor-rival.com",
        status: "active",
        audit: createAudit()
      };
      await websiteRepo.save(competitorWebsite);

      // 2. Save Competitor profile
      const competitor: Competitor = {
        id: competitorId,
        organizationId: tenantA,
        name: "Rival SEO Corp",
        domain: "competitor-rival.com",
        status: "active",
        classification: "direct",
        monitoringStatus: "idle",
        audit: createAudit()
      };
      await competitorRepo.save(competitor);

      // 3. Save Pages
      // Tenant Pages
      const tenantPage1: Page = {
        id: "page-tenant-p1",
        organizationId: tenantA,
        websiteId: "web-tenant-a1",
        url: "https://tenant-brand.com/seo",
        normalizedUrl: "https://tenant-brand.com/seo",
        path: "/seo",
        statusCode: 200,
        indexability: "indexable",
        title: "SEO Optimization Guide",
        description: "An elite landing page describing SEO mechanics.",
        audit: createAudit()
      };
      await pageRepo.save(tenantPage1);

      const tenantPage2: Page = {
        id: "page-tenant-p2",
        organizationId: tenantA,
        websiteId: "web-tenant-a1",
        url: "https://tenant-brand.com/empty",
        normalizedUrl: "https://tenant-brand.com/empty",
        path: "/empty",
        statusCode: 200,
        indexability: "indexable",
        // Sub-optimal: missing title and description
        audit: createAudit()
      };
      await pageRepo.save(tenantPage2);

      // Competitor Pages
      const competitorPage1: Page = {
        id: "page-comp-p1",
        organizationId: tenantA,
        websiteId: "web-competitor-f1",
        url: "https://competitor-rival.com/services/technical-seo",
        normalizedUrl: "https://competitor-rival.com/services/technical-seo",
        path: "/services/technical-seo",
        statusCode: 200,
        indexability: "indexable",
        title: "Technical SEO Audits",
        description: "Comprehensive audits to optimize search engine ranking.",
        audit: createAudit()
      };
      await pageRepo.save(competitorPage1);

      // 4. Keywords and Associations
      const keyword1: Keyword = {
        id: "kw-technical-seo",
        organizationId: tenantA,
        name: "technical seo",
        displayName: "Technical SEO",
        language: "en",
        audit: createAudit()
      };
      await keywordRepo.save(keyword1);

      const keyword2: Keyword = {
        id: "kw-seo-strategy",
        organizationId: tenantA,
        name: "seo strategy",
        displayName: "SEO Strategy",
        language: "en",
        audit: createAudit()
      };
      await keywordRepo.save(keyword2);

      // Link Competitor page -> Keyword
      await pageRepo.linkKeyword(tenantA, "page-comp-p1", "kw-technical-seo");
      // Link Tenant page -> Keyword (strategy only)
      await pageRepo.linkKeyword(tenantA, "page-tenant-p1", "kw-seo-strategy");

      // 5. Topics and Associations
      const topic1: Topic = {
        id: "top-core-web-vitals",
        organizationId: tenantA,
        name: "Core Web Vitals",
        language: "en",
        audit: createAudit()
      };
      await topicRepo.save(topic1);

      // Link Competitor page -> Topic
      await pageRepo.linkTopic(tenantA, "page-comp-p1", "top-core-web-vitals");
    });
    console.log("  ✅ SEO Dataset set up successfully.");

    // ----------------------------------------------------
    // 2. Technical and Content Comparisons
    // ----------------------------------------------------
    console.log("▶ TEST: Technical & Content SEO Comparisons...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-seo-run", async () => {
      const results = await seoService.compareSeo(tenantA, "tenant-brand.com", [competitorId]);

      // There should be findings generated for each comparison scope
      assert.strictEqual(results.length >= 2, true);

      // Technical finding: metadata_completeness
      const techFinding = results.find(f => f.findingType === "technical_gap" && f.comparisonScope === "metadata_completeness");
      assert.notStrictEqual(techFinding, undefined);
      // Tenant metadata coverage is 50% (1/2 pages), Competitor is 100% (1/1 page). So tenant is weaker.
      assert.strictEqual(techFinding!.competitivePosition, "disadvantage");
      assert.strictEqual(techFinding!.tenantValue, "50%");
      assert.strictEqual(techFinding!.competitorValue, "100%");
      assert.strictEqual(techFinding!.differenceDirection, "negative");

      // Content finding: word_volume
      const contentFinding = results.find(f => f.findingType === "content_gap" && f.comparisonScope === "word_volume");
      assert.notStrictEqual(contentFinding, undefined);
      assert.notStrictEqual(contentFinding!.difference, undefined);
      assert.strictEqual(contentFinding!.differenceDirection !== undefined, true);
    });
    console.log("  ✅ Technical & Content comparisons verified.");

    // ----------------------------------------------------
    // 3. Keyword Opportunities & Topic Gaps
    // ----------------------------------------------------
    console.log("▶ TEST: Keyword Opportunities & Topic Gaps...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-seo-run", async () => {
      const results = await seoService.compareSeo(tenantA, "tenant-brand.com", [competitorId]);

      // Keyword opportunity gap (competitor covers "Technical SEO" keyword which tenant lacks)
      const kwFinding = results.find(f => f.findingType === "keyword_gap" && f.comparisonScope === "keyword_coverage");
      assert.notStrictEqual(kwFinding, undefined);
      assert.strictEqual(kwFinding!.competitivePosition, "disadvantage");
      assert.strictEqual(kwFinding!.evidence.missingKeywordsList !== undefined, true);
      const list = kwFinding!.evidence.missingKeywordsList as string[];
      assert.strictEqual(list.includes("Technical SEO"), true);

      // Topic Gap: Core Web Vitals is missing from tenant's topic coverage
      const topicFinding = results.find(f => f.findingType === "topic_gap" && f.comparisonScope === "topic_coverage");
      assert.notStrictEqual(topicFinding, undefined);
      assert.strictEqual(topicFinding!.competitivePosition, "disadvantage");
      assert.strictEqual(topicFinding!.evidence.missingTopicsList !== undefined, true);
      const topicList = topicFinding!.evidence.missingTopicsList as string[];
      assert.strictEqual(topicList.includes("Core Web Vitals"), true);
    });
    console.log("  ✅ Keyword opportunities & Topic gaps verified successfully.");

    // ----------------------------------------------------
    // 4. Structural Differences
    // ----------------------------------------------------
    console.log("▶ TEST: Structural differences analysis...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-seo-run", async () => {
      const results = await seoService.compareSeo(tenantA, "tenant-brand.com", [competitorId]);

      // Structural URL depth finding
      const structFinding = results.find(f => f.findingType === "structural_difference" && f.comparisonScope === "url_hierarchy_depth");
      assert.notStrictEqual(structFinding, undefined);
      assert.strictEqual(structFinding!.tenantValue, "1 levels"); // /seo and /empty average depth is 1
      assert.strictEqual(structFinding!.competitorValue, "2 levels"); // /services/technical-seo is 2
      assert.strictEqual(structFinding!.difference, 1);
      assert.strictEqual(structFinding!.differenceDirection, "negative");
    });
    console.log("  ✅ Structural differences verified successfully.");

    // ----------------------------------------------------
    // 5. Zero-Trust Multi-Tenant Isolation
    // ----------------------------------------------------
    console.log("▶ TEST: Multi-Tenant Zero-Trust Isolation for competitive SEO findings...");

    // Scenario A: Tenant B attempts to compare SEO using Tenant A's competitor identifier or websites
    // A1: Passing Tenant B's organization ID (fail-closed, tenant website not found)
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-intruder", async () => {
        await seoService.compareSeo(tenantB, "tenant-brand.com", [competitorId]);
      });
      throw new Error("Security Failure: Allowed cross-tenant SEO comparison!");
    } catch (err: any) {
      assert.strictEqual(err.message.includes("Tenant website not found"), true);
    }

    // A2: Passing Tenant A's organization ID inside Tenant B's context (Context Violation)
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-intruder", async () => {
        await seoService.compareSeo(tenantA, "tenant-brand.com", [competitorId]);
      });
      throw new Error("Security Failure: Allowed cross-tenant SEO comparison with Tenant A ID!");
    } catch (err: any) {
      assert.strictEqual(err.name, "TenantContextViolationException");
    }

    // Scenario B: Tenant B attempts to directly read competitive findings owned by Tenant A
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-intruder", async () => {
        // Query findingRepo
        await findingRepo.findByCompetitorId(tenantA, competitorId);
      });
      throw new Error("Security Failure: Allowed cross-tenant direct findings query!");
    } catch (err: any) {
      assert.strictEqual(err.name, "TenantContextViolationException");
    }

    console.log("  ✅ Zero-trust multi-tenant isolation successfully validated.");

    // ----------------------------------------------------
    // 6. Determinism Verification
    // ----------------------------------------------------
    console.log("▶ TEST: Determinism validation...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-seo-run", async () => {
      const run1 = await seoService.compareSeo(tenantA, "tenant-brand.com", [competitorId]);
      const run2 = await seoService.compareSeo(tenantA, "tenant-brand.com", [competitorId]);

      // Identical normalized inputs must yield identical computed findings properties
      assert.strictEqual(run1.length, run2.length);
      for (let i = 0; i < run1.length; i++) {
        assert.strictEqual(run1[i].findingType, run2[i].findingType);
        assert.strictEqual(run1[i].comparisonScope, run2[i].comparisonScope);
        assert.strictEqual(run1[i].competitivePosition, run2[i].competitivePosition);
        assert.strictEqual(run1[i].tenantValue, run2[i].tenantValue);
        assert.strictEqual(run1[i].competitorValue, run2[i].competitorValue);
        assert.strictEqual(run1[i].difference, run2[i].difference);
        assert.strictEqual(run1[i].differenceDirection, run2[i].differenceDirection);
      }
    });
    console.log("  ✅ Deterministic output property verified successfully.");

    console.log("=========================================================================");
    console.log("✅ ALL PHASE 6: COMPETITIVE SEO INTELLIGENCE TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================================================");

  } catch (err: unknown) {
    console.error("❌ Test Suite failed:", err);
    throw err;
  }
}

// Support executing directly
if (require.main === module) {
  runCompetitiveSeoTests()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}
