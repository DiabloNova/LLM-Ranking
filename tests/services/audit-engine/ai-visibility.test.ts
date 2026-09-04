import { AIVisibilityAuditEngine } from "../../../src/features/ai-intelligence/services/ai-visibility-audit-engine";
import { BrandRepository, AIVisibilityAuditRepository } from "../../../src/features/ai-intelligence/repositories";
import { Brand, AuditMetadata, AIVisibilityAudit } from "../../../src/features/ai-intelligence/domain/types";
import { TenantContextManager } from "../../../src/core/database/tenant-context";
import * as assert from "assert";

export async function runAIVisibilityTests() {
  console.log("=========================================================================");
  console.log("AI VISIBILITY AUDIT ENGINE — SYSTEM, DOMAIN & SECURITY TEST SUITE");
  console.log("=========================================================================");

  const tenantA = "tenant-alpha-uuid";
  const tenantB = "tenant-beta-uuid";

  const brandRepo = new BrandRepository();
  const auditRepo = new AIVisibilityAuditRepository();
  const engine = new AIVisibilityAuditEngine(brandRepo, auditRepo);

  const testBrand: Brand = {
    id: "brand-test-001",
    organizationId: tenantA,
    name: "Rasha Gostar",
    description: "بهینه‌سازی دیده شدن برند شما در هوش مصنوعی",
    website: "https://secure-site.com",
    industry: "AI Optimization",
    country: "Iran",
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "test-system",
      updatedBy: "test-system",
      version: 1
    }
  };

  try {
    // ----------------------------------------------------
    // 1. Save Brand under Tenant A Context
    // ----------------------------------------------------
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-vis-test", async () => {
      await brandRepo.save(testBrand);
    });

    // ----------------------------------------------------
    // 2. Domain Extraction / Lexical Analyzer Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Domain Lexical Analysis & Evidence Tracing...");

    // Test Case 2.1: Exact brand mention & Recommended inclusion (Farsi)
    const res21 = engine.analyzeResponse(
      "برند رشا گستر یکی از پیشگامان است و من آن را شدیداً توصیه می‌کنم. وب‌سایت مرجع: https://secure-site.com",
      "Rasha Gostar",
      ["rasha gostar", "رشا گستر", "رشا"],
      "secure-site.com",
      "brand discovery"
    );
    assert.strictEqual(res21.brandMentions.detected, true);
    assert.strictEqual(res21.brandMentions.count >= 1, true);
    assert.strictEqual(res21.answerVisibility.level, "recommended_preferred");
    assert.strictEqual(res21.answerInclusion.status, "recommended_preferred");
    assert.strictEqual(res21.entityRecognition.status, "strongly_associated");
    assert.strictEqual(res21.citationPresence.present, true);
    assert.strictEqual(res21.citationPresence.citations[0].isTargetDomain, true);
    assert.strictEqual(res21.sourceAuthority.status, "resolved");

    // Test Case 2.2: English brand mention and Prominent Inclusion
    const res22 = engine.analyzeResponse(
      "Rasha Gostar is recognized as an industry leader in RAG matching. They have built high-performance models.",
      "Rasha Gostar",
      ["rasha gostar", "رشا گستر"],
      "secure-site.com",
      "brand discovery"
    );
    assert.strictEqual(res22.brandMentions.detected, true);
    assert.strictEqual(res22.answerVisibility.level, "prominently_included");
    assert.strictEqual(res22.citationPresence.present, false); // No URL cited in text

    // Test Case 2.3: Unrelated Similar Name & Ambiguous Recognition
    const res23 = engine.analyzeResponse(
      "Some other brand Rasha Trading competitor is a trading company specializing in goods.",
      "Rasha Gostar",
      ["rasha", "رشا"],
      "secure-site.com",
      "brand discovery"
    );
    assert.strictEqual(res23.brandMentions.detected, true);
    assert.strictEqual(res23.entityRecognition.status, "ambiguously_recognized");

    // Test Case 2.4: Domain cited but brand name absent (Indirect reference)
    const res24 = engine.analyzeResponse(
      "To optimize conversational search, refer to the guides at https://secure-site.com.",
      "Rasha Gostar",
      ["rasha gostar", "رشا گستر"],
      "secure-site.com",
      "brand discovery"
    );
    assert.strictEqual(res24.brandMentions.detected, false);
    assert.strictEqual(res24.answerVisibility.level, "indirectly_referenced");
    assert.strictEqual(res24.citationPresence.present, true);
    assert.strictEqual(res24.citationPresence.citations[0].isTargetDomain, true);

    // Test Case 2.5: No brand presence completely
    const res25 = engine.analyzeResponse(
      "Conversational search is evolving rapidly through large language models.",
      "Rasha Gostar",
      ["rasha gostar", "رشا گستر"],
      "secure-site.com",
      "brand discovery"
    );
    assert.strictEqual(res25.brandMentions.detected, false);
    assert.strictEqual(res25.answerVisibility.level, "not_mentioned");
    assert.strictEqual(res25.answerInclusion.status, "absent");

    console.log("  ✅ Domain extraction tests passed.");

    // ----------------------------------------------------
    // 3. Scoring Boundaries, Normalization & Weights
    // ----------------------------------------------------
    console.log("▶ TEST: Scoring Boundaries, Normalization & Weights Calculations...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-vis-test", async () => {
      // Execute a real deterministic audit run
      const audit = await engine.executeAudit(tenantA, "brand-test-001", "usr-test-1", "mock");

      assert.strictEqual(audit.status, "COMPLETED");
      assert.strictEqual(audit.overallScore !== null, true);
      assert.strictEqual(audit.overallScore! >= 0 && audit.overallScore! <= 100, true);

      // Verify breakdown metrics are populated
      assert.strictEqual(audit.metrics.answerVisibilityScore !== undefined, true);
      assert.strictEqual(audit.metrics.brandMentionScore !== undefined, true);
      assert.strictEqual(audit.metrics.entityRecognitionScore !== undefined, true);
      assert.strictEqual(audit.metrics.citationPresenceScore !== undefined, true);
      assert.strictEqual(audit.metrics.sourceAuthorityScore !== undefined, true);
      assert.strictEqual(audit.metrics.answerInclusionScore !== undefined, true);

      // Verify evidence summarizes and tracks properly
      assert.strictEqual(audit.evidenceSummary.mentions.length > 0, true);
      assert.strictEqual(audit.evidenceSummary.citations.length > 0, true);

      // Verify scoring and analyzer versioning are logged
      assert.strictEqual(audit.scoringVersion, "1.0.0");
      assert.strictEqual(audit.analyzerVersion, "1.0.0");

      console.log(`  ✅ Overall Score: ${audit.overallScore}%`);
      console.log(`  ✅ Breakdown metrics: ${JSON.stringify(audit.metrics)}`);
    });

    console.log("  ✅ Scoring tests passed.");

    // ----------------------------------------------------
    // 4. Audit Lifecycle Transitions
    // ----------------------------------------------------
    console.log("▶ TEST: Audit Lifecycle Transitions & Partial Failures...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-vis-test", async () => {
      const activeAuditId = crypto.randomUUID();
      const auditMeta: AuditMetadata = {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "usr-test-1",
        updatedBy: "usr-test-1",
        version: 1
      };

      const customAudit: AIVisibilityAudit = {
        id: activeAuditId,
        organizationId: tenantA,
        brandId: "brand-test-001",
        status: "PENDING",
        overallScore: null,
        metrics: {},
        promptsCoverage: { total: 2, executed: 0, analyzed: 0, failed: 0, skipped: 0 },
        evidenceSummary: { mentions: [], citations: [], entityRecognition: [], answerInclusion: [] },
        scoringVersion: "1.0.0",
        analyzerVersion: "1.0.0",
        audit: auditMeta
      };

      await auditRepo.save(customAudit);

      // Check transition to RUNNING
      customAudit.status = "RUNNING";
      const savedRunning = await auditRepo.save(customAudit);
      assert.strictEqual(savedRunning.status, "RUNNING");

      // Verify audit is retrieved in running state
      const fetched = await auditRepo.findById(tenantA, activeAuditId);
      assert.strictEqual(fetched?.status, "RUNNING");
    });
    console.log("  ✅ Audit Lifecycle Transitions passed.");

    // ----------------------------------------------------
    // 5. Multi-Tenant Isolation
    // ----------------------------------------------------
    console.log("▶ TEST: Multi-Tenant Zero-Trust Isolation boundaries...");

    // Tenant B cannot retrieve Tenant A's audit score
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-vis-test", async () => {
        // Attempting to read Tenant A's brand or audit
        await auditRepo.findByBrandId(tenantA, "brand-test-001");
      });
      throw new Error("Multi-Tenant Isolation Failure: Tenant B was allowed to query Tenant A's audit!");
    } catch (err: any) {
      assert.strictEqual(err.name, "TenantContextViolationException");
      assert.strictEqual(err.message.includes("Cross-tenant operation blocked"), true);
    }

    // Tenant B cannot save or manipulate Tenant A's audits
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-vis-test", async () => {
        const maliciousAudit: AIVisibilityAudit = {
          id: "audit-hijack",
          organizationId: tenantA, // pointing to Tenant A
          brandId: "brand-test-001",
          status: "COMPLETED",
          overallScore: 100,
          metrics: {},
          promptsCoverage: { total: 1, executed: 1, analyzed: 1, failed: 0, skipped: 0 },
          evidenceSummary: { mentions: [], citations: [], entityRecognition: [], answerInclusion: [] },
          scoringVersion: "1.0.0",
          analyzerVersion: "1.0.0",
          audit: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "attacker",
            updatedBy: "attacker",
            version: 1
          }
        };
        await auditRepo.save(maliciousAudit);
      });
      throw new Error("Multi-Tenant Isolation Failure: Tenant B allowed to save cross-tenant audit!");
    } catch (err: any) {
      assert.strictEqual(err.name, "TenantContextViolationException");
      assert.strictEqual(err.message.includes("Cross-tenant operation blocked"), true);
    }

    console.log("  ✅ Multi-Tenant Zero-Trust Isolation successfully passed.");

    console.log("=========================================================================");
    console.log("✅ ALL AI VISIBILITY AUDIT ENGINE TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================================================");

  } catch (err) {
    console.error("❌ Test Suite failed:", err);
    throw err;
  }
}

// Support executing directly
if (require.main === module) {
  runAIVisibilityTests()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}
