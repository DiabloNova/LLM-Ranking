/**
 * Automated Enterprise Integration Test Suite for Task 6.3 — Competitive Radar.
 * Validates radar data extraction, benchmarking, historical set changes, score contracts,
 * structured insights, zero-trust tenant isolation, and mathematical determinism.
 */

import { TenantContextManager } from "../../../src/core/database/tenant-context";
import {
  CompetitorRepository,
  CompetitiveSeoFindingRepository,
  VisibilityScoreRepository,
  CitationIntelligenceRepository,
  PromptIntelligenceRepository,
  BrandIntelligenceRepository,
  HistoricalMetricRepository,
  BrandRepository
} from "../../../src/features/ai-intelligence/repositories";
import { CompetitiveRadarService } from "../../../src/features/ai-intelligence/services/competitive-radar-service";
import {
  Competitor,
  Brand,
  CompetitiveSeoFinding,
  VisibilityScore,
  CitationSource,
  HistoricalMetric,
  AuditMetadata
} from "../../../src/features/ai-intelligence/domain/types";
import * as assert from "assert";

function createAudit(createdBy = "test-system"): AuditMetadata {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy,
    updatedBy: createdBy,
    version: 1
  };
}

export async function runCompetitiveRadarTests() {
  console.log("=========================================================================");
  console.log("PHASE 6.3: COMPETITIVE RADAR — INTEGRATION, SECURITY & DETERMINISM TESTS");
  console.log("=========================================================================");

  const tenantA = "55555555-5555-5555-5555-555555555555";
  const tenantB = "66666666-6666-6666-6666-666666666666";

  const competitorRepo = new CompetitorRepository();
  const findingRepo = new CompetitiveSeoFindingRepository();
  const visibilityScoreRepo = new VisibilityScoreRepository();
  const citationRepo = new CitationIntelligenceRepository();
  const promptRepo = new PromptIntelligenceRepository();
  const brandIntelRepo = new BrandIntelligenceRepository();
  const historicalRepo = new HistoricalMetricRepository();
  const brandRepo = new BrandRepository();

  const radarService = new CompetitiveRadarService(
    competitorRepo,
    findingRepo,
    visibilityScoreRepo,
    citationRepo,
    promptRepo,
    brandIntelRepo,
    historicalRepo,
    brandRepo
  );

  const brandId = "brand-radar-test";
  const comp1Id = "comp-radar-rival-1";
  const comp2Id = "comp-radar-rival-2";

  try {
    // ----------------------------------------------------
    // Setup and Seed Domain Models under Tenant Context
    // ----------------------------------------------------
    console.log("▶ TEST: Setting up datasets for Tenant A...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-r", "ctx-setup", async () => {
      // 1. Save Brand
      const brand: Brand = {
        id: brandId,
        organizationId: tenantA,
        name: "MyTenantBrand",
        website: "mybrand.io",
        audit: createAudit()
      };
      await brandRepo.save(brand);

      // 2. Save Competitors
      const rival1: Competitor = {
        id: comp1Id,
        organizationId: tenantA,
        name: "RivalOne",
        domain: "rivalone.com",
        status: "active",
        classification: "direct",
        monitoringStatus: "idle",
        audit: createAudit()
      };
      await competitorRepo.save(rival1);

      const rival2: Competitor = {
        id: comp2Id,
        organizationId: tenantA,
        name: "RivalTwo",
        domain: "rivaltwo.com",
        status: "active",
        classification: "direct",
        monitoringStatus: "idle",
        audit: createAudit()
      };
      await competitorRepo.save(rival2);

      // 3. Save SEO Findings for RivalOne
      const seoFinding1: CompetitiveSeoFinding = {
        id: "finding-seo-tech-rival-1",
        organizationId: tenantA,
        competitorId: comp1Id,
        findingType: "technical_gap",
        comparisonScope: "metadata_completeness",
        competitivePosition: "disadvantage",
        tenantValue: "60%",
        competitorValue: "90%",
        difference: -0.3,
        differenceDirection: "negative",
        severity: "medium",
        evidence: { explanation: "RivalOne has better metadata completeness" },
        calculationMetadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };
      await findingRepo.save(seoFinding1);

      const seoFinding2: CompetitiveSeoFinding = {
        id: "finding-seo-content-rival-1",
        organizationId: tenantA,
        competitorId: comp1Id,
        findingType: "content_gap",
        comparisonScope: "word_volume",
        competitivePosition: "advantage",
        tenantValue: "800 words",
        competitorValue: "400 words",
        difference: 400,
        differenceDirection: "positive",
        severity: "low",
        evidence: { explanation: "You have more word count" },
        calculationMetadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };
      await findingRepo.save(seoFinding2);

      // 4. Save Citation Intelligence sources
      const sourceOwned: CitationSource = {
        id: "cit-source-owned",
        organizationId: tenantA,
        domain: "mybrand.io",
        classification: "owned",
        qualityScore: 80,
        authorityScore: 75,
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        occurrenceCount: 15, // 15 citations
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await citationRepo.saveSource(sourceOwned);

      const sourceRival1: CitationSource = {
        id: "cit-source-rival1",
        organizationId: tenantA,
        domain: "rivalone.com",
        classification: "competitor",
        qualityScore: 70,
        authorityScore: 65,
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        occurrenceCount: 5, // 5 citations
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await citationRepo.saveSource(sourceRival1);

      // 5. Save AI Visibility Score
      const tenantVis: VisibilityScore = {
        id: "vis-score-tenant",
        organizationId: tenantA,
        brandId: brandId,
        engineId: "engine-chatgpt",
        overallScore: 78,
        mentionScore: 80,
        citationScore: 70,
        authorityScore: 75,
        sentimentScore: 82,
        positionScore: 85,
        date: new Date().toISOString(),
        audit: createAudit()
      };
      await visibilityScoreRepo.save(tenantVis);

      // Save competitor visibility metric in historical logs
      const compVisMetric: HistoricalMetric = {
        id: "hist-metric-rival1",
        organizationId: tenantA,
        targetType: "competitor",
        targetId: comp1Id,
        metricName: "visibility_score",
        metricValue: 62,
        dimensions: {},
        timestamp: new Date().toISOString(),
        audit: createAudit()
      };
      await historicalRepo.save(compVisMetric);
    });

    // ----------------------------------------------------
    // Test Case 1: Radar Visualization dimensions and normalization
    // ----------------------------------------------------
    console.log("▶ TEST: Radar visualization data and normalization correctness...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-r", "ctx-radar", async () => {
      const snapshot = await radarService.generateRadarSnapshot(tenantA, brandId, [comp1Id, comp2Id]);

      // Verify tenant dimensions
      const tenantDim = snapshot.tenantData.dimensions;
      assert.strictEqual(tenantDim["technical_seo"].status, "available");
      assert.strictEqual(tenantDim["technical_seo"].normalizedValue, 60);

      assert.strictEqual(tenantDim["content_coverage"].status, "available");
      // raw value is "800 words". Normalized: Math.min(100, Math.round((800/1500)*100)) = 53
      assert.strictEqual(tenantDim["content_coverage"].normalizedValue, 53);

      assert.strictEqual(tenantDim["citation_presence"].status, "available");
      // raw: 15. Normalized: 15 * 5 = 75
      assert.strictEqual(tenantDim["citation_presence"].normalizedValue, 75);

      assert.strictEqual(tenantDim["ai_visibility"].status, "available");
      assert.strictEqual(tenantDim["ai_visibility"].normalizedValue, 78);

      // Verify competitor 1 dimensions
      const comp1Data = snapshot.competitorData.find(c => c.competitorId === comp1Id);
      assert.notStrictEqual(comp1Data, undefined);
      const comp1Dim = comp1Data!.dimensions;
      assert.strictEqual(comp1Dim["technical_seo"].status, "available");
      assert.strictEqual(comp1Dim["technical_seo"].normalizedValue, 90);
      assert.strictEqual(comp1Dim["ai_visibility"].status, "available");
      assert.strictEqual(comp1Dim["ai_visibility"].normalizedValue, 62);

      // Verify missing dimensions are marked unavailable or missing rather than fabricated
      assert.strictEqual(comp1Dim["prompt_visibility"].status, "unavailable");
      assert.strictEqual(comp1Dim["prompt_visibility"].normalizedValue, null);
    });
    console.log("  ✅ Radar visualization verified successfully.");

    // ----------------------------------------------------
    // Test Case 2: Benchmarking median, ranks, and percentiles
    // ----------------------------------------------------
    console.log("▶ TEST: Benchmarking capabilities...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-r", "ctx-benchmark", async () => {
      const bRes = await radarService.benchmark(tenantA, brandId, [comp1Id]);
      const benchmarks = bRes.benchmarks;

      // Technical SEO benchmarking: Tenant has 60, RivalOne has 90
      const techBench = benchmarks["technical_seo"];
      assert.strictEqual(techBench.status, "valid");
      assert.strictEqual(techBench.best, 90);
      assert.strictEqual(techBench.median, 90);
      assert.strictEqual(techBench.average, 90);
      assert.strictEqual(techBench.rank, 2); // 60 is second after 90
      assert.strictEqual(techBench.percentile, 25); // (0 below + 0.5 equal)/2 * 100 = 25th percentile

      // AI Visibility benchmarking: Tenant has 78, RivalOne has 62
      const visBench = benchmarks["ai_visibility"];
      assert.strictEqual(visBench.best, 62);
      assert.strictEqual(visBench.rank, 1); // 78 is first
      assert.strictEqual(visBench.percentile, 75); // (1 below + 0.5 equal)/2 * 100 = 75th percentile
    });
    console.log("  ✅ Benchmarking verified successfully.");

    // ----------------------------------------------------
    // Test Case 3: Historical Comparison with dynamic memberships
    // ----------------------------------------------------
    console.log("▶ TEST: Historical comparison...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-r", "ctx-historical", async () => {
      // Dynamic set memberships: Current: [comp1Id, comp2Id], Past: [comp1Id]
      const histRes = await radarService.compareHistorical(
        tenantA,
        brandId,
        [comp1Id, comp2Id],
        [comp1Id],
        "Q2",
        "Q1"
      );

      assert.strictEqual(histRes.tenantTrend["technical_seo"].current, 60);
      assert.strictEqual(histRes.tenantTrend["technical_seo"].past, 60);
      assert.strictEqual(histRes.tenantTrend["technical_seo"].change, 0);

      // Verify that no trend is reported when the underlying contexts are missing or incompatible
      assert.strictEqual(histRes.tenantTrend["prompt_visibility"].change, null);
    });
    console.log("  ✅ Historical comparisons verified successfully.");

    // ----------------------------------------------------
    // Test Case 4: Competitive Score absence logic
    // ----------------------------------------------------
    console.log("▶ TEST: Competitive score absence fail-closed contract...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-r", "ctx-score", async () => {
      const scoreRes = await radarService.getCompetitiveScore(tenantA, brandId, [comp1Id]);
      assert.strictEqual(scoreRes.score, null);
      assert.strictEqual(scoreRes.status, "unavailable");
      assert.strictEqual(scoreRes.reason.includes("No approved competitive scoring formula"), true);
    });
    console.log("  ✅ Competitive Score unavailability validated perfectly.");

    // ----------------------------------------------------
    // Test Case 5: Evidence-backed structured insights
    // ----------------------------------------------------
    console.log("▶ TEST: Evidence-backed strengths, weaknesses, and opportunities...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-r", "ctx-insights", async () => {
      const insights = await radarService.generateInsights(tenantA, brandId, [comp1Id]);

      // Weakness finding: Technical SEO (60% vs 90%)
      const techWeakness = insights.find(i => i.type === "weakness" && i.dimension === "Technical SEO");
      assert.notStrictEqual(techWeakness, undefined);
      assert.strictEqual(techWeakness!.tenantValue, "60%");
      assert.strictEqual(techWeakness!.competitiveReference, "90%");
      assert.strictEqual(techWeakness!.competitiveGap, -30);
      assert.strictEqual((techWeakness!.evidence as any).explanation.includes("holds a performance advantage"), true);

      // Strength finding: Content Coverage (800 words vs 400 words)
      const contentStrength = insights.find(i => i.type === "strength" && i.dimension === "Content Coverage");
      assert.notStrictEqual(contentStrength, undefined);
      assert.strictEqual(contentStrength!.tenantValue, "800 words");
      assert.strictEqual(contentStrength!.competitiveReference, "400 words");
      assert.strictEqual(contentStrength!.competitiveGap, 26);
    });
    console.log("  ✅ Insights structured verification passed.");

    // ----------------------------------------------------
    // Test Case 6: Zero-Trust Multi-Tenant Isolation
    // ----------------------------------------------------
    console.log("▶ TEST: Multi-Tenant isolation safety...");
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-r2", "ctx-intruder", async () => {
        // Attempt to call with tenantA (cross-tenant mismatch)
        await radarService.generateRadarSnapshot(tenantA, brandId, [comp1Id]);
      });
      throw new Error("Security Failure: Allowed cross-tenant snapshot calculation!");
    } catch (err: any) {
      assert.strictEqual(err.name, "TenantContextViolationException");
    }

    // Verify that passing tenantB but requesting comp1Id (owned by tenantA) returns empty competitor data due to RLS
    await TenantContextManager.runWithTenantContext(tenantB, "usr-test-r2", "ctx-intruder", async () => {
      const snapshot = await radarService.generateRadarSnapshot(tenantB, brandId, [comp1Id]);
      assert.strictEqual(snapshot.competitorData.length, 0); // comp1Id filtered out safely!
    });
    console.log("  ✅ Zero-trust multi-tenant isolation validated successfully.");

    // ----------------------------------------------------
    // Test Case 7: Determinism
    // ----------------------------------------------------
    console.log("▶ TEST: Mathematical determinism...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-r", "ctx-det", async () => {
      const run1 = await radarService.generateRadarSnapshot(tenantA, brandId, [comp1Id]);
      const run2 = await radarService.generateRadarSnapshot(tenantA, brandId, [comp1Id]);

      assert.deepStrictEqual(run1, run2);
    });
    console.log("  ✅ Deterministic aggregation validated successfully.");

    console.log("=========================================================================");
    console.log("✅ ALL PHASE 6.3: COMPETITIVE RADAR INTEGRATION TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================================================");

  } catch (err: unknown) {
    console.error("❌ Test Suite failed:", err);
    throw err;
  }
}

// Support executing directly
if (require.main === module) {
  runCompetitiveRadarTests()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}
