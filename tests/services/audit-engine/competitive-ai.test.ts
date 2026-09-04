/**
 * Automated Enterprise Integration Test Suite for Competitive AI Intelligence Engine.
 * Exercises AI visibility, citation sources, prompt visibility, brand mentions volume,
 * and observed AI recommendation comparison systems with strict zero-trust tenant isolation,
 * context compatibility constraints, and observational recommendation validations.
 */

import { TenantContextManager } from "../../../src/core/database/tenant-context";
import {
  CompetitorRepository,
  AIVisibilityAuditRepository,
  CitationIntelligenceRepository,
  PromptIntelligenceRepository,
  BrandIntelligenceRepository,
  CompetitiveSeoFindingRepository
} from "../../../src/features/ai-intelligence/repositories";
import { CompetitiveAiService } from "../../../src/features/ai-intelligence/services/competitive-ai-service";
import {
  Competitor,
  AIVisibilityAudit,
  CitationSource,
  BrandAssociation,
  RecommendationObservation,
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

export async function runCompetitiveAiTests() {
  console.log("=========================================================================");
  console.log("PHASE 6: COMPETITIVE AI INTELLIGENCE — INTEGRATION & SECURITY TEST SUITE");
  console.log("=========================================================================");

  // Define Mock Tenants
  const tenantA = "55555555-5555-5555-5555-555555555555";
  const tenantB = "66666666-6666-6666-6666-666666666666";

  // Repositories
  const competitorRepo = new CompetitorRepository();
  const auditRepo = new AIVisibilityAuditRepository();
  const citationRepo = new CitationIntelligenceRepository();
  const promptRepo = new PromptIntelligenceRepository(); // mock provider
  const brandRepo = new BrandIntelligenceRepository();
  const findingRepo = new CompetitiveSeoFindingRepository();

  // Service
  const aiService = new CompetitiveAiService(
    competitorRepo,
    auditRepo,
    citationRepo,
    promptRepo,
    brandRepo,
    findingRepo
  );

  try {
    // ----------------------------------------------------
    // Setup and Seed Domain Models under Tenant Context
    // ----------------------------------------------------
    console.log("▶ TEST: Setting up competitive AI dataset for Tenant A...");

    const brandId = "brand-tenant-a";
    const competitorId = "comp-tenant-a";

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-ai-setup", async () => {
      // 1. Save Competitor profile
      const competitor: Competitor = {
        id: competitorId,
        organizationId: tenantA,
        name: "Rival AI Corp",
        domain: "rival-ai.com",
        status: "active",
        classification: "direct",
        monitoringStatus: "idle",
        audit: createAudit()
      };
      await competitorRepo.save(competitor);

      // 2. Save AI Visibility Audits
      const tenantAudit: AIVisibilityAudit = {
        id: "audit-tenant-01",
        organizationId: tenantA,
        brandId: brandId,
        status: "COMPLETED",
        overallScore: 68,
        metrics: { answerVisibilityScore: 70, brandMentionScore: 65 },
        promptsCoverage: { total: 10, executed: 10, analyzed: 10, failed: 0, skipped: 0 },
        evidenceSummary: { mentions: [], citations: [], entityRecognition: [], answerInclusion: [] },
        scoringVersion: "1.0",
        analyzerVersion: "1.0",
        audit: createAudit()
      };
      await auditRepo.save(tenantAudit);

      const competitorAudit: AIVisibilityAudit = {
        id: "audit-competitor-01",
        organizationId: tenantA,
        brandId: competitorId,
        status: "COMPLETED",
        overallScore: 82, // competitor is stronger
        metrics: { answerVisibilityScore: 85, brandMentionScore: 80 },
        promptsCoverage: { total: 10, executed: 10, analyzed: 10, failed: 0, skipped: 0 },
        evidenceSummary: { mentions: [], citations: [], entityRecognition: [], answerInclusion: [] },
        scoringVersion: "1.0",
        analyzerVersion: "1.0",
        audit: createAudit()
      };
      await auditRepo.save(competitorAudit);

      // 3. Citation Intelligence
      const source1: CitationSource = {
        id: "src-wikipedia",
        organizationId: tenantA,
        domain: "wikipedia.org",
        classification: "competitor",
        qualityScore: 90,
        authorityScore: 95,
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        occurrenceCount: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await citationRepo.saveSource(source1);

      const source2: CitationSource = {
        id: "src-own-blog",
        organizationId: tenantA,
        domain: "tenant-blog.com",
        classification: "owned",
        qualityScore: 70,
        authorityScore: 60,
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        occurrenceCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await citationRepo.saveSource(source2);

      // 4. Brand Intelligence Mentions
      const competitorAssociation: BrandAssociation = {
        id: "assoc-comp-01",
        organizationId: tenantA,
        brandId: competitorId,
        entityName: "SEO Tools",
        relationshipType: "compares_with",
        occurrenceCount: 22,
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        supportingContext: "Rival AI Corp is considered a premium SEO tool.",
        confidence: 0.95,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await brandRepo.saveAssociation(competitorAssociation);

      const tenantAssociation: BrandAssociation = {
        id: "assoc-tenant-01",
        organizationId: tenantA,
        brandId: brandId,
        entityName: "Audit Software",
        relationshipType: "product_of",
        occurrenceCount: 8,
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        supportingContext: "Your brand serves as and is associated with Audit Software.",
        confidence: 0.90,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await brandRepo.saveAssociation(tenantAssociation);

      // 5. Observed AI Recommendations (Strictly Observational)
      const competitorRec: RecommendationObservation = {
        id: "rec-obs-comp-01",
        organizationId: tenantA,
        brandId: competitorId,
        observationId: "obs-perplexity-01",
        recommendationStatus: "strong_recommendation",
        evidenceExcerpt: "We strongly recommend using Rival AI Corp for enterpise needs.",
        createdAt: new Date().toISOString()
      };
      await brandRepo.saveRecommendationObservation(competitorRec);
    });
    console.log("  ✅ AI Dataset set up successfully.");

    // ----------------------------------------------------
    // 2. AI Visibility and Citation Comparisons
    // ----------------------------------------------------
    console.log("▶ TEST: AI Visibility & Citation Gaps Comparisons...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-ai-run", async () => {
      const results = await aiService.compareAi(tenantA, brandId, competitorId);

      // Expected findings: visibility score comparison and citation footprint comparison
      assert.strictEqual(results.length >= 2, true);

      // Visibility Find
      const visFinding = results.find(f => f.findingType === "ai_visibility_gap" && f.comparisonScope === "overall_visibility_score");
      assert.notStrictEqual(visFinding, undefined);
      // Tenant score is 68, Competitor is 82. Score diff is -14, representing disadvantage.
      assert.strictEqual(visFinding!.competitivePosition, "disadvantage");
      assert.strictEqual(visFinding!.tenantValue, "68/100");
      assert.strictEqual(visFinding!.competitorValue, "82/100");
      assert.strictEqual(visFinding!.difference, -14);
      assert.strictEqual(visFinding!.differenceDirection, "negative");
      assert.strictEqual(visFinding!.severity, "high");

      // Citation Find
      const citationFinding = results.find(f => f.findingType === "citation_gap" && f.comparisonScope === "citation_source_coverage");
      assert.notStrictEqual(citationFinding, undefined);
      assert.strictEqual(citationFinding!.competitivePosition, "disadvantage");
      assert.strictEqual(citationFinding!.differenceDirection, "negative");
      const list = citationFinding!.evidence.competitorOnlyCitations as string[];
      assert.strictEqual(list.includes("wikipedia.org"), true);
    });
    console.log("  ✅ AI Visibility & Citation comparisons verified.");

    // ----------------------------------------------------
    // 3. Prompt and Brand Mention Comparisons
    // ----------------------------------------------------
    console.log("▶ TEST: Prompt Visibility & Brand Mentions Gaps Comparisons...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-ai-run", async () => {
      const results = await aiService.compareAi(tenantA, brandId, competitorId);

      // Prompt visibility concept gap (competitor covers "SEO Tools" concept which tenant lacks)
      const promptFinding = results.find(f => f.findingType === "prompt_gap" && f.comparisonScope === "concept_prompt_visibility");
      assert.notStrictEqual(promptFinding, undefined);
      assert.strictEqual(promptFinding!.competitivePosition, "disadvantage");
      assert.strictEqual(promptFinding!.differenceDirection, "negative");
      const concepts = promptFinding!.evidence.promptGapConcepts as string[];
      assert.strictEqual(concepts.includes("SEO Tools"), true);

      // Brand mentions volume gap
      const brandFinding = results.find(f => f.findingType === "brand_mention_gap" && f.comparisonScope === "observed_brand_mentions");
      assert.notStrictEqual(brandFinding, undefined);
      assert.strictEqual(brandFinding!.competitivePosition, "disadvantage");
      assert.strictEqual(brandFinding!.tenantValue, "8 mentions"); // tenantAssociation occurrenceCount
      assert.strictEqual(brandFinding!.competitorValue, "22 mentions"); // competitorAssociation occurrenceCount
      assert.strictEqual(brandFinding!.difference, -14);
    });
    console.log("  ✅ Prompt visibility & Brand Mentions gaps verified.");

    // ----------------------------------------------------
    // 4. Observed Recommendations Comparison
    // ----------------------------------------------------
    console.log("▶ TEST: Observed Recommendations Comparison (Strictly Observational)...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-ai-run", async () => {
      const results = await aiService.compareAi(tenantA, brandId, competitorId);

      const recFinding = results.find(f => f.findingType === "ai_recommendation_gap" && f.comparisonScope === "observed_ai_recommendations");
      assert.notStrictEqual(recFinding, undefined);
      assert.strictEqual(recFinding!.competitivePosition, "disadvantage");
      assert.strictEqual(recFinding!.tenantValue, "0 recommendations observed"); // no tenant recs seeded
      assert.strictEqual(recFinding!.competitorValue, "1 recommendations observed"); // 1 comp rec seeded
      assert.strictEqual(recFinding!.difference, -1);

      // Strict observational assurance check
      assert.strictEqual(recFinding!.calculationMetadata.strictlyObservational, true);
      // No predictive probability or likelihood model should be generated
      assert.strictEqual(recFinding!.calculationMetadata.predictiveScore, undefined);
    });
    console.log("  ✅ Observed AI recommendations comparison verified.");

    // ----------------------------------------------------
    // 5. Zero-Trust Multi-Tenant Isolation
    // ----------------------------------------------------
    console.log("▶ TEST: Multi-Tenant Zero-Trust Isolation for competitive AI findings...");

    // Scenario A: Tenant B attempts to compare AI using Tenant A's competitor or brand identifiers
    // A1: Passing Tenant B's organization ID (fail-closed, returns empty findings, no data leaked)
    await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-intruder", async () => {
      const results = await aiService.compareAi(tenantB, brandId, competitorId);
      assert.strictEqual(results.length, 0);
    });

    // A2: Passing Tenant A's organization ID inside Tenant B's context (Context Violation)
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-intruder", async () => {
        await aiService.compareAi(tenantA, brandId, competitorId);
      });
      throw new Error("Security Failure: Allowed cross-tenant AI comparison with raw ID!");
    } catch (err: any) {
      assert.strictEqual(err.name, "TenantContextViolationException");
    }

    // Scenario B: Tenant B attempts to directly read competitive findings owned by Tenant A
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-intruder", async () => {
        await findingRepo.findByCompetitorId(tenantA, competitorId);
      });
      throw new Error("Security Failure: Allowed cross-tenant direct findings query!");
    } catch (err: any) {
      assert.strictEqual(err.name, "TenantContextViolationException");
    }

    console.log("  ✅ Zero-trust multi-tenant isolation successfully validated.");

  } catch (err: unknown) {
    console.error("❌ Test Suite failed:", err);
    throw err;
  }
}

// Support executing directly
if (require.main === module) {
  runCompetitiveAiTests()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}
