import * as assert from "assert";
import { TenantContextManager } from "../../../src/core/database/tenant-context";
import {
  normalizeKeyword,
  classifySearchIntent,
  calculateOpportunityScore,
  KeywordIntelligenceService
} from "../../../src/features/ai-intelligence/services/keyword-intelligence-service";
import {
  KeywordRepository,
  PageRepository,
  WebsiteRepository,
  CompetitorRepository,
  CompetitiveSeoFindingRepository,
  EntityRepository,
  TopicRepository,
  PromptIntelligenceRepository
} from "../../../src/features/ai-intelligence/repositories";

export async function runKeywordIntelligenceTests() {
  console.log("=========================================================================");
  console.log("KEYWORD INTELLIGENCE ENGINE (TASK 9.1) — TEST SUITE");
  console.log("=========================================================================");

  const tenantA = "tenant-alpha-001";
  const tenantB = "tenant-beta-002";
  const userId = "usr-test-001";

  // Repositories
  const keywordRepo = new KeywordRepository();
  const pageRepo = new PageRepository();
  const websiteRepo = new WebsiteRepository();
  const competitorRepo = new CompetitorRepository();
  const findingRepo = new CompetitiveSeoFindingRepository();
  const entityRepo = new EntityRepository();
  const topicRepo = new TopicRepository();
  const promptRepo = new PromptIntelligenceRepository();

  const service = new KeywordIntelligenceService(
    keywordRepo,
    pageRepo,
    websiteRepo,
    competitorRepo,
    findingRepo,
    entityRepo,
    topicRepo,
    promptRepo
  );

  try {
    // 1. Normalization and Deduplication Unit Tests
    console.log("▶ TEST 1: Keyword Normalization & Deduplication...");
    assert.strictEqual(normalizeKeyword("  Technical   SEO "), "technical seo");
    assert.strictEqual(normalizeKeyword("Robots.txt Audit!!!"), "robotstxt audit");

    // Distinct keywords must remain separate
    const normA = normalizeKeyword("SEO tools");
    const normB = normalizeKeyword("SEO audit tools");
    assert.notStrictEqual(normA, normB);
    console.log("  ✅ Normalization & Deduplication verified successfully.");

    // 2. Search Intent Classification Tests
    console.log("▶ TEST 2: Evidence-based Search Intent Classification...");
    assert.strictEqual(classifySearchIntent("what is technical SEO").intent, "informational");
    assert.strictEqual(classifySearchIntent("best technical SEO tools").intent, "commercial");
    assert.strictEqual(classifySearchIntent("buy SEO audit software").intent, "transactional");
    assert.strictEqual(classifySearchIntent("Google Search Console login").intent, "navigational");

    // Insufficient evidence falls back to "unknown"
    const unknownRes = classifySearchIntent("xyz");
    assert.strictEqual(unknownRes.intent, "unknown");
    assert.strictEqual(unknownRes.confidence, 0.0);
    console.log("  ✅ Search Intent Classifier verified successfully.");

    // 3. Opportunity Scoring Tests
    console.log("▶ TEST 3: Deterministic Opportunity Scoring...");
    const scoreTransactionalGap = calculateOpportunityScore({
      intent: "transactional",
      source: "competitor",
      tenantCoverageStatus: "absent",
      competitorPresent: true
    });
    const scoreCovered = calculateOpportunityScore({
      intent: "informational",
      source: "content",
      tenantCoverageStatus: "covered",
      competitorPresent: false
    });
    assert.strictEqual(scoreTransactionalGap > scoreCovered, true);
    console.log("  ✅ Opportunity Scoring verified successfully.");

    // 4. Seed Tenant Data and Execute Full Analysis Pipeline
    console.log("▶ TEST 4: Seed Tenant Data & Execute Keyword Analysis...");
    await TenantContextManager.runWithTenantContext(tenantA, userId, "ctx-kw-test-1", async () => {
      // Seed Website & Pages
      const website = await websiteRepo.save({
        id: "web-acme-01",
        organizationId: tenantA,
        domain: "acme-saas.io",
        normalizedUrl: "https://acme-saas.io",
        status: "active",
        audit: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: userId, updatedBy: userId, version: 1 }
      });

      const page1 = await pageRepo.save({
        id: "page-home-01",
        organizationId: tenantA,
        websiteId: website.id,
        url: "https://acme-saas.io/",
        normalizedUrl: "https://acme-saas.io/",
        path: "/",
        statusCode: 200,
        indexability: "indexable",
        title: "Technical SEO & Brand Intelligence Platform",
        description: "Leading platform for technical SEO and conversational AI visibility.",
        audit: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: userId, updatedBy: userId, version: 1 }
      });

      // Seed Competitor & Gap Finding
      const comp = await competitorRepo.save({
        id: "comp-01",
        organizationId: tenantA,
        name: "CompetitorX",
        domain: "competitorx.com",
        status: "active",
        classification: "direct",
        monitoringStatus: "enabled",
        audit: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: userId, updatedBy: userId, version: 1 }
      });

      await findingRepo.save({
        id: "finding-kw-01",
        organizationId: tenantA,
        competitorId: comp.id,
        findingType: "keyword_gap",
        comparisonScope: "keyword_coverage",
        competitivePosition: "disadvantage",
        differenceDirection: "negative",
        severity: "high",
        evidence: { reason: "Competitor ranks for schema markup validator" },
        sourceReference: "schema markup validator",
        calculationMetadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      });

      // Execute Analysis
      const result = await service.analyzeKeywords(tenantA);

      // Verify Discovery
      assert.strictEqual(result.discoveredKeywords.length > 0, true);
      const titleKw = result.discoveredKeywords.find(k => k.source === "title");
      assert.notStrictEqual(titleKw, undefined);
      assert.strictEqual(titleKw!.evidence.sourceType, "title");

      // Verify Clustering
      assert.strictEqual(result.clusters.length > 0, true);
      assert.notStrictEqual(result.clusters[0].primaryKeyword, undefined);

      // Verify Semantic Keywords
      assert.strictEqual(result.semanticKeywords.length > 0, true);

      // Verify Long-Tail Keywords
      assert.strictEqual(result.longTailKeywords.length > 0, true);

      // Verify Keyword Gap Detection & Semantic Equivalence
      assert.strictEqual(result.gaps.length > 0, true);
      const techSeoGap = result.gaps.find(g => g.normalizedKeyword.includes("technical"));
      assert.notStrictEqual(techSeoGap, undefined);
      // Because tenant homepage title has "Technical SEO", coverage status should be "covered" or "semantic_coverage"
      assert.notStrictEqual(techSeoGap!.tenantCoverageStatus, "absent");
      console.log("  ✅ Full Keyword Analysis Pipeline verified successfully.");
    });

    // 5. Determinism Verification Tests
    console.log("▶ TEST 5: Determinism Verification (Identical Inputs -> Identical Results)...");
    await TenantContextManager.runWithTenantContext(tenantA, userId, "ctx-kw-test-2", async () => {
      const res1 = await service.analyzeKeywords(tenantA);
      const res2 = await service.analyzeKeywords(tenantA);

      assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2));
    });
    console.log("  ✅ Determinism verified successfully.");

    // 6. Multi-Tenant Isolation Security Tests
    console.log("▶ TEST 6: Multi-Tenant Zero-Trust Security Isolation...");
    try {
      await TenantContextManager.runWithTenantContext(tenantB, userId, "ctx-malicious", async () => {
        // Attempting to access Tenant A keywords from Tenant B context must fail immediately
        await service.analyzeKeywords(tenantA);
      });
      throw new Error("Security Failure: Cross-tenant keyword access was erroneously allowed!");
    } catch (err: unknown) {
      const error = err as Error;
      assert.strictEqual(error.message.includes("Tenant Context Violation"), true);
    }
    console.log("  ✅ Multi-Tenant Security Isolation verified successfully.");

    console.log("=========================================================================");
    console.log("✅ ALL KEYWORD INTELLIGENCE TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================================================");

  } catch (err: unknown) {
    console.error("❌ Test Suite failed:", err);
    throw err;
  }
}

// Support direct execution
if (require.main === module) {
  runKeywordIntelligenceTests()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}
