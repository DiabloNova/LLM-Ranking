/**
 * Automated Enterprise Integration Test Suite for Competitor Discovery and Monitoring.
 * Validates candidate normalization, deterministic classification rules, state-machine lifecycles,
 * change logs tracking, idempotency, and strict zero-trust tenant isolation.
 */

import { TenantContextManager } from "../../../src/core/database/tenant-context";
import { CompetitorRepository } from "../../../src/features/ai-intelligence/repositories";
import {
  CompetitorDiscoveryService,
  normalizeDomain,
  isValidHostname
} from "../../../src/features/ai-intelligence/services/competitor-discovery-service";
import { CompetitorClassificationService } from "../../../src/features/ai-intelligence/services/competitor-classification-service";
import { CompetitorMonitoringService } from "../../../src/features/ai-intelligence/services/competitor-monitoring-service";
import { Competitor, CompetitorStatusType, AuditMetadata } from "../../../src/features/ai-intelligence/domain/types";
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

export async function runCompetitorDiscoveryTests() {
  console.log("=========================================================================");
  console.log("PHASE 6: COMPETITOR DISCOVERY & MONITORING — INTEGRATION & SECURITY TEST SUITE");
  console.log("=========================================================================");

  // Define Mock Tenants
  const tenantA = "11111111-1111-1111-1111-111111111111";
  const tenantB = "22222222-2222-2222-2222-222222222222";

  // Repositories & Services
  const competitorRepo = new CompetitorRepository();
  const discoveryService = new CompetitorDiscoveryService(competitorRepo);
  const classificationService = new CompetitorClassificationService();
  const monitoringService = new CompetitorMonitoringService(competitorRepo);

  try {
    // ----------------------------------------------------
    // 1. Normalization Rules
    // ----------------------------------------------------
    console.log("▶ TEST: Candidate Domain Normalization Rules...");

    assert.strictEqual(normalizeDomain("HTTPS://Example.com/"), "example.com");
    assert.strictEqual(normalizeDomain("example.com"), "example.com");
    assert.strictEqual(normalizeDomain("https://example.com/path?query=1#frag"), "example.com");
    assert.strictEqual(normalizeDomain("EXAMPLE.COM"), "example.com");
    assert.strictEqual(normalizeDomain("example.com."), "example.com");
    assert.strictEqual(normalizeDomain("www.example.com"), "example.com");

    // Hostname Validation
    assert.strictEqual(isValidHostname("example.com"), true);
    assert.strictEqual(isValidHostname("invalid_domain"), false);
    assert.strictEqual(isValidHostname("invalid hostname"), false);
    assert.strictEqual(isValidHostname("http://invalid.com"), false);
    assert.strictEqual(isValidHostname(""), false);

    console.log("  ✅ Normalization rules validated.");

    // ----------------------------------------------------
    // 2. Competitor Identification (Self-domain, Invalid, Deduplication, Rejection)
    // ----------------------------------------------------
    console.log("▶ TEST: Competitor Identification & Candidate Evaluation...");

    const targetDomain = "my-brand.com";

    // Rejection as self-domain
    const selfEval = discoveryService.evaluateCandidate("my-brand.com", targetDomain, "crawl_external_link");
    assert.strictEqual(selfEval.isCompetitor, false);
    assert.strictEqual(selfEval.rejectionReason, "self-domain");

    // Rejection as invalid
    const invalidEval = discoveryService.evaluateCandidate("invalid domain name", targetDomain, "crawl_external_link");
    assert.strictEqual(invalidEval.isCompetitor, false);
    assert.strictEqual(invalidEval.rejectionReason, "invalid domain");

    // Valid direct supplier / competitor candidate
    const validEval = discoveryService.evaluateCandidate("competitor-a.com", targetDomain, "crawl_external_link");
    assert.strictEqual(validEval.isCompetitor, true);
    assert.notStrictEqual(validEval.evidence, undefined);
    assert.strictEqual(validEval.evidence!.normalizedDomain, "competitor-a.com");
    assert.strictEqual(validEval.confidence, 0.6);

    console.log("  ✅ Candidate evaluation and rejection behaviors validated.");

    // ----------------------------------------------------
    // 3. Competitor Classification (Explainable & Deterministic)
    // ----------------------------------------------------
    console.log("▶ TEST: Competitor Classification Deterministic Rules...");

    // Marketplace/Aggregator match
    const classG2 = classificationService.classify("clutch.co");
    assert.strictEqual(classG2.classification, "marketplace_aggregator");
    assert.strictEqual(classG2.reason.includes("marketplace aggregator"), true);

    const classTorob = classificationService.classify("torob.com");
    assert.strictEqual(classTorob.classification, "marketplace_aggregator");

    // Content/Authority match
    const classWiki = classificationService.classify("wikipedia.org");
    assert.strictEqual(classWiki.classification, "content_authority");
    assert.strictEqual(classWiki.reason.includes("content authority"), true);

    // Heuristics from notes
    const classDirect = classificationService.classify("rival.com", "This is a direct substitute platform.");
    assert.strictEqual(classDirect.classification, "direct");

    const classIndirect = classificationService.classify("rival.com", "Serves an adjacent need for clients.");
    assert.strictEqual(classIndirect.classification, "indirect");

    // Unknown case
    const classUnknown = classificationService.classify("unknown-competitor-site.com");
    assert.strictEqual(classUnknown.classification, "unknown");

    console.log("  ✅ Deterministic and explainable classifications validated.");

    // ----------------------------------------------------
    // 4. Competitor Lifecycle and Safe Transitions
    // ----------------------------------------------------
    console.log("▶ TEST: Competitor Lifecycle Transitions...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-lifecycle-test", async () => {
      const compId = "c1111111-1111-1111-1111-11111111111c";
      const comp: Competitor = {
        id: compId,
        organizationId: tenantA,
        name: "Lifecycle Rival",
        domain: "lifecycle-rival.com",
        status: "candidate",
        classification: "unknown",
        monitoringStatus: "idle",
        audit: createAudit()
      };
      await competitorRepo.save(comp);

      // candidate -> active (Valid)
      const compActive = await monitoringService.transitionStatus(tenantA, compId, "active");
      assert.strictEqual(compActive.status, "active");

      // Verify status change was logged
      const changes = await competitorRepo.findChangesByCompetitorId(tenantA, compId);
      assert.strictEqual(changes.length, 1);
      assert.strictEqual(changes[0].changedField, "status");
      assert.strictEqual(changes[0].previousValue, "candidate");
      assert.strictEqual(changes[0].newValue, "active");

      // active -> inactive (Valid)
      const compInactive = await monitoringService.transitionStatus(tenantA, compId, "inactive");
      assert.strictEqual(compInactive.status, "inactive");

      // inactive -> active (Valid)
      const compActiveAgain = await monitoringService.transitionStatus(tenantA, compId, "active");
      assert.strictEqual(compActiveAgain.status, "active");

      // active -> candidate (Invalid transition)
      try {
        await monitoringService.transitionStatus(tenantA, compId, "candidate");
        throw new Error("Security Failure: Allowed invalid state-machine status transition (active -> candidate)!");
      } catch (err: any) {
        assert.strictEqual(err.message.includes("Invalid status transition"), true);
      }
    });

    console.log("  ✅ Competitor lifecycle and validation rules verified.");

    // ----------------------------------------------------
    // 5. Monitoring & Change Detection Logs
    // ----------------------------------------------------
    console.log("▶ TEST: Competitor Monitoring & Field Change Detection...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-monitor-test", async () => {
      const compId = "d1111111-1111-1111-1111-11111111111d";
      const comp: Competitor = {
        id: compId,
        organizationId: tenantA,
        name: "Monitor Rival",
        domain: "monitor-rival.com",
        status: "active",
        classification: "unknown",
        monitoringStatus: "idle",
        audit: createAudit()
      };
      await competitorRepo.save(comp);

      // First observation with unchanged fields -> no change logs created
      const run1 = await monitoringService.observeState(tenantA, compId, {
        name: "Monitor Rival",
        classification: "unknown"
      });
      assert.strictEqual(run1.changes.length, 0);

      // Second observation with changes -> should log changes for classification and brandName
      const run2 = await monitoringService.observeState(tenantA, compId, {
        classification: "direct",
        brandName: "Monitor Rival Elite"
      });
      assert.strictEqual(run2.changes.length, 2);

      const savedChanges = await competitorRepo.findChangesByCompetitorId(tenantA, compId);
      // Find logged changes (e.g. classification chg & brandName chg)
      const classChg = savedChanges.find(c => c.changedField === "classification");
      assert.notStrictEqual(classChg, undefined);
      assert.strictEqual(classChg!.previousValue, "unknown");
      assert.strictEqual(classChg!.newValue, "direct");

      const brandChg = savedChanges.find(c => c.changedField === "brandName");
      assert.notStrictEqual(brandChg, undefined);
      assert.strictEqual(brandChg!.previousValue, null);
      assert.strictEqual(brandChg!.newValue, "Monitor Rival Elite");

      // Verify monitoring metadata timestamps were updated
      assert.notStrictEqual(run2.competitor.lastObservedAt, undefined);
      assert.notStrictEqual(run2.competitor.lastMonitoredAt, undefined);
    });

    console.log("  ✅ Change logs and observation metadata successfully validated.");

    // ----------------------------------------------------
    // 6. Idempotency & Repeated Discovery
    // ----------------------------------------------------
    console.log("▶ TEST: Discovery Idempotency & Duplicate Prevention...");

    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-idempotence-test", async () => {
      const explicitDomains = ["competitor-unique.com", "competitor-unique.com"];
      const discovered = await discoveryService.discoverExplicitCompetitors(
        tenantA,
        "my-brand.com",
        explicitDomains
      );

      // Unique count must be exactly 1 despite supplying duplicate entry
      assert.strictEqual(discovered.length, 1);
      assert.strictEqual(discovered[0].domain, "competitor-unique.com");

      // Running discovery again with same domain should return existing and NOT duplicate the identity
      const rediscovered = await discoveryService.discoverExplicitCompetitors(
        tenantA,
        "my-brand.com",
        ["competitor-unique.com"]
      );
      assert.strictEqual(rediscovered.length, 1);
      assert.strictEqual(rediscovered[0].id, discovered[0].id);

      const allComps = await competitorRepo.findByOrganizationId(tenantA);
      const uniqueOccurrences = allComps.data.filter(c => c.domain === "competitor-unique.com");
      assert.strictEqual(uniqueOccurrences.length, 1);
    });

    console.log("  ✅ Idempotency and duplicate prevention verified successfully.");

    // ----------------------------------------------------
    // 7. Multi-Tenant Zero-Trust Isolation Tests
    // ----------------------------------------------------
    console.log("▶ TEST: Multi-Tenant Zero-Trust Isolation for Competitor Data...");

    // Scenario A: Tenant B attempts to read Tenant A's competitor changes or profile
    const compId = "d1111111-1111-1111-1111-11111111111d";
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-intruder", async () => {
        await competitorRepo.findById(tenantA, compId);
      });
      throw new Error("Security Failure: Allowed cross-tenant competitor reads!");
    } catch (err: any) {
      assert.strictEqual(err.name, "TenantContextViolationException");
    }

    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-intruder", async () => {
        await competitorRepo.findChangesByCompetitorId(tenantA, compId);
      });
      throw new Error("Security Failure: Allowed cross-tenant competitor changes read!");
    } catch (err: any) {
      assert.strictEqual(err.name, "TenantContextViolationException");
    }

    // Scenario B: Tenant B attempts to update Tenant A's competitor profile
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-intruder", async () => {
        const fakeComp: Competitor = {
          id: compId, // Tenant A's ID
          organizationId: tenantA, // Points to Tenant A
          name: "Malicious Inject",
          domain: "malicious.com",
          status: "active",
          classification: "direct",
          monitoringStatus: "idle",
          audit: createAudit()
        };
        await competitorRepo.save(fakeComp);
      });
      throw new Error("Security Failure: Allowed cross-tenant competitor update!");
    } catch (err: any) {
      assert.strictEqual(err.name, "TenantContextViolationException");
    }

    // Scenario C: Tenant B attempts to transition status of Tenant A's competitor
    // C1: Passing Tenant B's organization ID (fail-closed, competitor not found)
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-intruder", async () => {
        await monitoringService.transitionStatus(tenantB, compId, "inactive");
      });
      throw new Error("Security Failure: Allowed cross-tenant status transition!");
    } catch (err: any) {
      assert.strictEqual(err.message.includes("Competitor not found"), true);
    }

    // C2: Passing Tenant A's organization ID inside Tenant B's context (Context Violation)
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-intruder", async () => {
        await monitoringService.transitionStatus(tenantA, compId, "inactive");
      });
      throw new Error("Security Failure: Allowed cross-tenant status transition with raw ID!");
    } catch (err: any) {
      assert.strictEqual(err.name, "TenantContextViolationException");
    }

    console.log("  ✅ Strict zero-trust multi-tenant isolation successfully validated.");

    console.log("=========================================================================");
    console.log("✅ ALL PHASE 6: COMPETITOR DISCOVERY & MONITORING TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================================================");

  } catch (err: unknown) {
    console.error("❌ Test Suite failed:", err);
    throw err;
  }
}

// Support executing directly
if (require.main === module) {
  runCompetitorDiscoveryTests()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}
