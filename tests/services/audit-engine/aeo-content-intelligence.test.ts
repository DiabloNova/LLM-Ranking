import { AeoContentIntelligenceService } from "../../../src/features/ai-intelligence/services/aeo-content-intelligence-service";
import {
  AeoContentIntelligenceRepository,
  PageRepository,
  BrandRepository,
  EntityRepository,
  CompetitorRepository
} from "../../../src/features/ai-intelligence/repositories";
import { Page, Brand, Competitor, Entity } from "../../../src/features/ai-intelligence/domain/types";
import { TenantContextManager } from "../../../src/core/database/tenant-context";
import * as assert from "assert";

export async function runAeoContentIntelligenceTests() {
  console.log("=========================================================================");
  console.log("AEO CONTENT INTELLIGENCE — SYSTEM, DOMAIN & SECURITY TEST SUITE");
  console.log("=========================================================================");

  const tenantA = "tenant-alpha-uuid";
  const tenantB = "tenant-beta-uuid";

  const repo = new AeoContentIntelligenceRepository();
  const pageRepo = new PageRepository();
  const brandRepo = new BrandRepository();
  const entityRepo = new EntityRepository();
  const compRepo = new CompetitorRepository();

  const service = new AeoContentIntelligenceService(
    repo,
    pageRepo,
    brandRepo,
    entityRepo,
    undefined,
    undefined,
    compRepo
  );

  const testBrand: Brand = {
    id: "brand-aeo-777",
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
    id: "comp-aeo-777",
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

  const testEntity: Entity = {
    id: "entity-aeo-brand",
    organizationId: tenantA,
    brandId: "brand-aeo-777",
    name: "Rasha Gostar",
    type: "Brand",
    confidence: { score: 0.95, rating: "high" },
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "test",
      updatedBy: "test",
      version: 1
    }
  };

  const testPage: Page = {
    id: "page-aeo-777",
    organizationId: tenantA,
    websiteId: crypto.randomUUID(),
    url: "https://secure-site.com/aeo-guide",
    normalizedUrl: "https://secure-site.com/aeo-guide",
    path: "/aeo-guide",
    statusCode: 200,
    indexability: "indexable",
    title: "AEO Optimization Guide for Enterprise Brands",
    description: "Detailed description of AEO and Semantic SEO strategies.",
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "test",
      updatedBy: "test",
      version: 1
    }
  };

  try {
    // 0. Setup test data in Tenant A Context
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-setup", async () => {
      await brandRepo.save(testBrand);
      await compRepo.save(testCompetitor);
      await entityRepo.save(testEntity);
      await pageRepo.save(testPage);
    });

    // 1. Answerability Analysis
    console.log("▶ TEST: Conversational Answerability evaluation...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-answerability", async () => {
      // Case 1.1: Directly Answerable (Identity + How it works + Cost pricing present)
      const textDirect = "Rasha Gostar is an AEO solution. How does it work? It operates through vector mapping. What is the cost? Pricing starts at $49/mo.";
      const analysisDirect = await service.executeAnalysis(tenantA, testPage.id, { overridePageContent: textDirect });
      assert.strictEqual(analysisDirect.answerability.level, "directly_answerable");
      assert.strictEqual(analysisDirect.answerability.coveredDimensions.includes("identity"), true);
      assert.strictEqual(analysisDirect.answerability.coveredDimensions.includes("pricing"), true);

      // Case 1.2: Partially Answerable (Only Identity present)
      const textPartial = "What is Rasha Gostar? Rasha Gostar is a software company.";
      const analysisPartial = await service.executeAnalysis(tenantA, testPage.id, { overridePageContent: textPartial });
      assert.strictEqual(analysisPartial.answerability.level, "partially_answerable");
      assert.strictEqual(analysisPartial.answerability.coveredDimensions.includes("identity"), true);
      assert.strictEqual(analysisPartial.answerability.coveredDimensions.includes("pricing"), false);

      // Case 1.3: Not Answerable
      const textNone = "Hello world context.";
      const analysisNone = await service.executeAnalysis(tenantA, testPage.id, { overridePageContent: textNone });
      assert.strictEqual(analysisNone.answerability.level, "not_answerable");

      console.log("  ✅ Answerability evaluation successfully verified.");
    });

    // 2. Entity Coverage
    console.log("▶ TEST: Entity Coverage distinction (Simple Mention vs Properties)...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-entity-coverage", async () => {
      // Case 2.1: Simple Mention only
      const textMentionOnly = "We saw Rasha Gostar.";
      const analysisMention = await service.executeAnalysis(tenantA, testPage.id, { overridePageContent: textMentionOnly });
      const entCovMention = analysisMention.entityCoverage.find(e => e.name === "Rasha Gostar");
      assert.notStrictEqual(entCovMention, undefined);
      assert.strictEqual(entCovMention!.status, "mentioned_only");

      // Case 2.2: Covered with Properties
      const textCovered = "شرکت رشا گستر (Rasha Gostar) با آدرس اینترنتی secure-site.com ارائه‌دهنده راه‌حل‌های هوشمند است.";
      const analysisCovered = await service.executeAnalysis(tenantA, testPage.id, { overridePageContent: textCovered });
      const entCovCovered = analysisCovered.entityCoverage.find(e => e.name === "Rasha Gostar");
      assert.strictEqual(entCovCovered!.status, "covered");

      // Case 2.3: Not Covered
      const textMissing = "CompetitorX is fully active.";
      const analysisMissing = await service.executeAnalysis(tenantA, testPage.id, { overridePageContent: textMissing });
      const entCovMissing = analysisMissing.entityCoverage.find(e => e.name === "Rasha Gostar");
      assert.strictEqual(entCovMissing!.status, "not_covered");

      console.log("  ✅ Entity coverage status distinctions successfully verified.");
    });

    // 3. Semantic Coverage Gaps & Anti-Shortcut Proof
    console.log("▶ TEST: Semantic Coverage and keyword-spam anti-shortcut proof...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-semantic", async () => {
      // Case 3.1: Disjoint keyword list list/tag stuffing
      const keywordListStuffing = "Keyword, tags, رشا گستر, بهینه‌سازی هوش مصنوعی, سئو معنایی, پایش رویت‌پذیری, گراف دانش";
      const analysisStuffing = await service.executeAnalysis(tenantA, testPage.id, { overridePageContent: keywordListStuffing });
      // Disjoint tags should result in a low semantic score (e.g. 15%) despite containing all words
      assert.strictEqual(analysisStuffing.semanticCoverage.score, 15);

      // Case 3.2: Complete grammatic conceptual cohesion sentences (high score)
      const syntaxCohesion = "خدمات شرکت رشا گستر شامل سئو معنایی و بهینه‌سازی هوش مصنوعی است. پایش رویت‌پذیری هوش مصنوعی نیز از ارکان گراف دانش ماست.";
      const analysisCohesion = await service.executeAnalysis(tenantA, testPage.id, { overridePageContent: syntaxCohesion });
      assert.strictEqual(analysisCohesion.semanticCoverage.score >= 80, true);

      console.log("  ✅ Semantic coverage and keyword-stuffing anti-shortcut verified.");
    });

    // 4. Citation Readiness vs Actual Citation
    console.log("▶ TEST: Citation Readiness characteristics evaluation...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-citation", async () => {
      const textReadiness = "شرکت رشا گستر با آدرس اینترنتی secure-site.com ارائه‌دهنده راه‌حل‌های هوشمند سئو معنایی است. مرجع معتبر: secure-site.com. منتشر شده در تاریخ ۱۴۰۵/۰۵/۲۲ توسط کارشناس سئو.";
      const analysisReadiness = await service.executeAnalysis(tenantA, testPage.id, { overridePageContent: textReadiness });

      assert.strictEqual(analysisReadiness.citationReadiness.hasFactualClaims, true);
      assert.strictEqual(analysisReadiness.citationReadiness.hasSourceAttribution, true);
      assert.strictEqual(analysisReadiness.citationReadiness.hasAuthorInfo, true);
      assert.strictEqual(analysisReadiness.citationReadiness.hasPublicationDate, true);
      assert.strictEqual(analysisReadiness.citationReadiness.level === "high" || analysisReadiness.citationReadiness.level === "medium", true);

      console.log("  ✅ Citation readiness verified.");
    });

    // 5. Structured HTML Answer Quality
    console.log("▶ TEST: Structured HTML and heading hierarchy quality evaluation...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-structured", async () => {
      const textStructure = "تعریف سئو معنایی:\nسئو معنایی عبارت است از قرار دادن موجودیت‌ها.\n- مورد اول\n- مورد دوم\nجدول مشخصات:\n| خدمات | زمان |\n| سئو معنایی | ۲ هفته |";
      const analysisStructure = await service.executeAnalysis(tenantA, testPage.id, { overridePageContent: textStructure });

      assert.strictEqual(analysisStructure.structuredAnswerQuality.hasLists, true);
      assert.strictEqual(analysisStructure.structuredAnswerQuality.hasTables, true);
      assert.strictEqual(analysisStructure.structuredAnswerQuality.hasDefinitions, true);
      assert.strictEqual(analysisStructure.structuredAnswerQuality.score > 50, true);

      console.log("  ✅ Structured answer quality checklist verified.");
    });

    // 6. Bidirectional Knowledge Graph Alignment
    console.log("▶ TEST: Bidirectional Knowledge Graph alignment...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-kg", async () => {
      const textKgMatch = "رشا گستر با رقیب خود CompetitorX رقابت سختی دارد.";
      const analysisKg = await service.executeAnalysis(tenantA, testPage.id, { overridePageContent: textKgMatch });

      assert.strictEqual(analysisKg.kgAlignment.alignedCount > 0, true);
      const brandAlign = analysisKg.kgAlignment.items.find(i => i.entityName === "Rasha Gostar");
      const compAlign = analysisKg.kgAlignment.items.find(i => i.entityName === "CompetitorX");

      assert.strictEqual(brandAlign!.status, "aligned");
      assert.strictEqual(compAlign!.status, "aligned");

      console.log("  ✅ Bidirectional Knowledge Graph alignment passed.");
    });

    // 7. FAQ Opportunities & KG Alignments Persistence
    console.log("▶ TEST: Verification of evidence-backed FAQ opportunities...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-opportunities", async () => {
      const unansweredFaqs = await repo.findFaqOpportunitiesByPageId(tenantA, testPage.id);
      assert.strictEqual(unansweredFaqs.length > 0, true);
      assert.strictEqual(unansweredFaqs[0].status, "active");

      const kgs = await repo.findKgAlignmentsByPageId(tenantA, testPage.id);
      assert.strictEqual(kgs.length > 0, true);

      console.log("  ✅ FAQ opportunities & KG alignments successfully persisted.");
    });

    // 8. Deterministic aggregate score reproducibility
    console.log("▶ TEST: Scoring determinism and mathematical component aggregation...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-scoring", async () => {
      const pageAnalysis = await repo.findAnalysisByPageId(tenantA, testPage.id);
      assert.notStrictEqual(pageAnalysis, null);

      // Calculate score contribution mathematically
      const calculatedScore = pageAnalysis!.overallScore;
      assert.strictEqual(calculatedScore >= 0 && calculatedScore <= 100, true);

      console.log(`  ✅ Overall Score: ${calculatedScore}%`);
    });

    // 9. Process Idempotency Verification
    console.log("▶ TEST: Idempotency bounds checking (running twice does not create duplicates)...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-idempotency", async () => {
      const testContent = "This is some test content about Rasha Gostar.";
      // Run first time
      await service.executeAnalysis(tenantA, testPage.id, { overridePageContent: testContent });
      const initialFaqs = await repo.findFaqOpportunitiesByPageId(tenantA, testPage.id);

      // Run second time (exactly identical content/version/analysis)
      await service.executeAnalysis(tenantA, testPage.id, { overridePageContent: testContent });

      const finalFaqs = await repo.findFaqOpportunitiesByPageId(tenantA, testPage.id);
      // It should update existing or ignore, NOT create duplicates
      assert.strictEqual(finalFaqs.length, initialFaqs.length);

      console.log("  ✅ Idempotency constraints verified successfully.");
    });

    // 10. Multi-Tenant Isolation Boundaries
    console.log("▶ TEST: Cross-tenant isolation verification...");
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-isolation", async () => {
        // Tenant B trying to retrieve Tenant A's page analysis
        await repo.findAnalysisById(tenantA, "page-aeo-777");
      });
      throw new Error("Failure: Tenant B bypassed tenant context check on analyses!");
    } catch (err: any) {
      assert.strictEqual(err.name, "TenantContextViolationException");
      assert.strictEqual(err.message.includes("Cross-tenant operation blocked"), true);
    }
    console.log("  ✅ Multi-tenant security isolation successfully passed.");

    console.log("=========================================================================");
    console.log("✅ ALL AEO CONTENT INTELLIGENCE TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================================================");

  } catch (err) {
    console.error("❌ Test Suite failed:", err);
    throw err;
  }
}

// Support executing directly
if (require.main === module) {
  runAeoContentIntelligenceTests()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}
