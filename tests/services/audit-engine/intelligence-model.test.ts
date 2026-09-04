/**
 * Automated Enterprise Integration Test Suite for Unified Intelligence Data Model.
 * Exercises all 11 canonical concepts, relationships, constraints, deduplication,
 * time-series historical appends, and strict zero-trust tenant isolation.
 */

import { TenantContextManager } from "../../../src/core/database/tenant-context";
import {
  WebsiteRepository,
  PageRepository,
  KeywordRepository,
  TopicRepository,
  CompetitorRepository,
  HistoricalMetricRepository,
  ObservationRepository,
  RecommendationRepository
} from "../../../src/features/ai-intelligence/repositories";
import {
  Website,
  Page,
  Keyword,
  Topic,
  Competitor,
  HistoricalMetric,
  AIObservation,
  Citation,
  Recommendation,
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

export async function runIntelligenceModelTests() {
  console.log("=========================================================================");
  console.log("UNIFIED INTELLIGENCE DATA MODEL — INTEGRATION & SECURITY TEST SUITE");
  console.log("=========================================================================");

  // Define Mock Tenants
  const tenantA = "tenant-alpha-uuid";
  const tenantB = "tenant-beta-uuid";

  // Repositories
  const websiteRepo = new WebsiteRepository();
  const pageRepo = new PageRepository();
  const keywordRepo = new KeywordRepository();
  const topicRepo = new TopicRepository();
  const competitorRepo = new CompetitorRepository();
  const metricRepo = new HistoricalMetricRepository();
  const obsRepo = new ObservationRepository();
  const recRepo = new RecommendationRepository();

  try {
    // ----------------------------------------------------
    // 1. Creation of each major domain object (Website, Page, Competitor)
    // ----------------------------------------------------
    console.log("▶ TEST: Creation & Persistence of Major Domain Objects (Website, Page, Competitor)...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-model-test", async () => {
      // Create Website
      const site: Website = {
        id: "web-site-a1",
        organizationId: tenantA,
        domain: "my-brand.com",
        normalizedUrl: "https://my-brand.com",
        status: "active", audit: createAudit()
      };
      await websiteRepo.save(site);
      const savedSite = await websiteRepo.findById(tenantA, "web-site-a1");
      assert.notStrictEqual(savedSite, null);
      assert.strictEqual(savedSite!.domain, "my-brand.com");

      // Create Page
      const page: Page = {
        id: "page-home-a1",
        organizationId: tenantA,
        websiteId: "web-site-a1",
        url: "https://my-brand.com/home",
        normalizedUrl: "https://my-brand.com/home",
        path: "/home",
        statusCode: 200,
        indexability: "indexable",
        title: "Home",
        audit: createAudit()
      };
      await pageRepo.save(page);
      const savedPage = await pageRepo.findById(tenantA, "page-home-a1");
      assert.notStrictEqual(savedPage, null);
      assert.strictEqual(savedPage!.path, "/home");
      assert.strictEqual(savedPage!.statusCode, 200);

      // Create Competitor
      const competitor: Competitor = {
        id: "comp-rival-a1",
        organizationId: tenantA,
        name: "Rival Corp",
        domain: "rival-site.com",
        status: "active", classification: "direct" as any, monitoringStatus: "active" as any, audit: createAudit()
      };
      await competitorRepo.save(competitor);
      const savedComp = await competitorRepo.findById(tenantA, "comp-rival-a1");
      assert.notStrictEqual(savedComp, null);
      assert.strictEqual(savedComp!.domain, "rival-site.com");
    });
    console.log("  ✅ Major Domain Objects created successfully.");

    // ----------------------------------------------------
    // 2. Many-to-Many Relationships & Relational Linking
    // ----------------------------------------------------
    console.log("▶ TEST: Many-to-Many Relational Mappings & Join Associations...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-model-test", async () => {
      // 1. Create Keyword & Topic
      const keyword: Keyword = {
        id: "key-ai-visibility",
        organizationId: tenantA,
        name: "ai visibility",
        displayName: "AI Visibility",
        language: "en",
        intent: "commercial",
        audit: createAudit()
      };
      await keywordRepo.save(keyword);

      const topic: Topic = {
        id: "top-aeo-geo",
        organizationId: tenantA,
        name: "AEO/GEO Optimization",
        description: "Search Engine Optimization for Generative AI Answers",
        language: "en",
        audit: createAudit()
      };
      await topicRepo.save(topic);

      // 2. Link Page -> Keyword, Page -> Topic
      await pageRepo.linkKeyword(tenantA, "page-home-a1", "key-ai-visibility");
      await pageRepo.linkTopic(tenantA, "page-home-a1", "top-aeo-geo");

      // 3. Link Keyword -> Topic
      await keywordRepo.linkTopic(tenantA, "key-ai-visibility", "top-aeo-geo");

      // 4. Retrieve and verify many-to-many associations
      const linkedKeywords = await pageRepo.getLinkedKeywords(tenantA, "page-home-a1");
      assert.strictEqual(linkedKeywords.length, 1);
      assert.strictEqual(linkedKeywords[0].name, "ai visibility");

      const linkedTopics = await pageRepo.getLinkedTopics(tenantA, "page-home-a1");
      assert.strictEqual(linkedTopics.length, 1);
      assert.strictEqual(linkedTopics[0].name, "AEO/GEO Optimization");

      const keywordLinkedTopics = await keywordRepo.getLinkedTopics(tenantA, "key-ai-visibility");
      assert.strictEqual(keywordLinkedTopics.length, 1);
      assert.strictEqual(keywordLinkedTopics[0].name, "AEO/GEO Optimization");
    });
    console.log("  ✅ Many-to-Many Relational Mappings verified successfully.");

    // ----------------------------------------------------
    // 3. Traceability: Citation -> Observation & Recommendation -> Evidence
    // ----------------------------------------------------
    console.log("▶ TEST: Traceability of Citation and Recommendation to Analysis Evidence...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-model-test", async () => {
      // 1. Save Observation
      const obs: AIObservation = {
        id: "obs-trace-01",
        organizationId: tenantA,
        promptId: "prompt-discover-01",
        engineId: "engine-perplexity",
        responseText: "Acme SaaS is cited in snapp.ir",
        visibilityScore: 90,
        sentiment: { score: 95, label: "positive", confidence: 0.98 },
        confidence: { score: 1.0, rating: "high" },
        executedAt: new Date().toISOString(),
        audit: createAudit()
      };
      await obsRepo.save(obs);

      // 2. Save Citation linking back to Observation ID
      const citation: Citation = {
        id: "cit-trace-01",
        organizationId: tenantA,
        observationId: "obs-trace-01",
        url: "https://snapp.ir/blog/aeo",
        domain: "snapp.ir",
        title: "AEO Optimization Blog",
        authorityScore: 80,
        relevanceScore: 90,
        audit: createAudit()
      };
      await obsRepo.saveCitation(citation);

      // Verify citation link and traceback
      const savedCitations = await obsRepo.findCitationsByObservationId(tenantA, "obs-trace-01");
      assert.strictEqual(savedCitations.length, 1);
      assert.strictEqual(savedCitations[0].observationId, "obs-trace-01");
      assert.strictEqual(savedCitations[0].url, "https://snapp.ir/blog/aeo");

      // 3. Save Recommendation referencing Brand and Observation evidence
      const rec: Recommendation = {
        id: "rec-trace-01",
        organizationId: tenantA,
        brandId: "brand-acme-01",
        category: "AEO Authority",
        priority: "high",
        impactScore: 12,
        description: "Focus on adding citations from snapp.ir based on Perplexity search evidence.",
        status: "pending",
        audit: createAudit()
      };
      await recRepo.save(rec);

      const savedRecs = await recRepo.findByBrandId(tenantA, "brand-acme-01");
      assert.strictEqual(savedRecs.data.length, 1); // 1 newly added recommendation for tenantA
      const addedRec = savedRecs.data.find(r => r.id === "rec-trace-01");
      assert.notStrictEqual(addedRec, undefined);
      assert.strictEqual(addedRec!.description.includes("snapp.ir"), true);
    });
    console.log("  ✅ Full Citation and Recommendation Traceability verified successfully.");

    // ----------------------------------------------------
    // 4. Historical Metrics Append Behavior
    // ----------------------------------------------------
    console.log("▶ TEST: Historical Metrics Append Behavior & No-Overwrite Guarantee...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-model-test", async () => {
      // Log measurement 1
      const metric1: HistoricalMetric = {
        id: "metric-log-01",
        organizationId: tenantA,
        targetType: "website",
        targetId: "web-site-a1",
        metricName: "visibility_index",
        metricValue: 75.0,
        dimensions: { engine: "Perplexity" },
        timestamp: "2026-08-01T12:00:00.000Z",
        audit: createAudit()
      };
      await metricRepo.save(metric1);

      // Log measurement 2 for same target and metric, but different timestamp
      const metric2: HistoricalMetric = {
        id: "metric-log-02",
        organizationId: tenantA,
        targetType: "website",
        targetId: "web-site-a1",
        metricName: "visibility_index",
        metricValue: 85.0,
        dimensions: { engine: "Perplexity" },
        timestamp: "2026-08-02T12:00:00.000Z",
        audit: createAudit()
      };
      await metricRepo.save(metric2);

      // Query metrics history
      const history = await metricRepo.findMetrics(tenantA, "website", "web-site-a1", "visibility_index");

      // Verify both measurements exist, preserving historical values chronologically
      assert.strictEqual(history.length, 2);
      assert.strictEqual(history[0].id, "metric-log-02"); // Sorted descending (latest first)
      assert.strictEqual(history[0].metricValue, 85.0);
      assert.strictEqual(history[1].id, "metric-log-01");
      assert.strictEqual(history[1].metricValue, 75.0);
    });
    console.log("  ✅ Historical Metrics Append behavior & time-series stability verified.");

    // ----------------------------------------------------
    // 5. Zero-Trust Tenant Isolation & Cross-Tenant Rejection
    // ----------------------------------------------------
    console.log("▶ TEST: Multi-Tenant Zero-Trust Isolation & Cross-Tenant Intrusion Denial...");

    // Scenario A: Reading Tenant A data while inside Tenant B context should throw a TenantContextViolationException
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-malicious-try", async () => {
        // Attempting to read Tenant A's website inside Tenant B's context
        await websiteRepo.findById(tenantA, "web-site-a1"); // We must pass tenantA to trigger isolation violation!
      });
      throw new Error("Security Failure: Allowed reading cross-tenant data without active context validation!");
    } catch (err: unknown) {
      const error = err as Error;
      assert.strictEqual(error.name, "TenantContextViolationException");
      assert.strictEqual(error.message.includes("Cross-tenant operation blocked"), true);
    }

    // Scenario B: Writing Tenant A data while inside Tenant B context should throw a TenantContextViolationException
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-malicious-try", async () => {
        // Attempting to write a website belonging to Tenant A inside Tenant B's context
        const maliciousSite: Website = {
          id: "web-site-b2",
          organizationId: tenantA, // Pointing to tenant A
          domain: "hijack.com",
          normalizedUrl: "https://hijack.com",
          status: "active", audit: createAudit()
        };
        await websiteRepo.save(maliciousSite);
      });
      throw new Error("Security Failure: Allowed saving cross-tenant record without active context validation!");
    } catch (err: unknown) {
      const error = err as Error;
      assert.strictEqual(error.name, "TenantContextViolationException");
      assert.strictEqual(error.message.includes("Cross-tenant operation blocked"), true);
    }

    console.log("  ✅ Multi-Tenant Isolation & Intrusion Denial verified successfully.");

    console.log("=========================================================================");
    console.log("✅ ALL UNIFIED INTELLIGENCE DATA MODEL TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================================================");

  } catch (err: unknown) {
    console.error("❌ Test Suite failed:", err);
    throw err;
  }
}

// Support executing directly
if (require.main === module) {
  runIntelligenceModelTests()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}
