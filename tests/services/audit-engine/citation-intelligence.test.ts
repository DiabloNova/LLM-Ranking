import { CitationIntelligenceService } from "../../../src/features/ai-intelligence/services/citation-intelligence-service";
import { BrandRepository, CompetitorRepository, CitationIntelligenceRepository } from "../../../src/features/ai-intelligence/repositories";
import { Brand, Competitor, CitationSource, CitationOccurrence } from "../../../src/features/ai-intelligence/domain/types";
import { TenantContextManager } from "../../../src/core/database/tenant-context";
import * as assert from "assert";

export async function runCitationIntelligenceTests() {
  console.log("=========================================================================");
  console.log("AI CITATION INTELLIGENCE — SYSTEM, DOMAIN & SECURITY TEST SUITE");
  console.log("=========================================================================");

  const tenantA = "tenant-alpha-uuid";
  const tenantB = "tenant-beta-uuid";

  const brandRepo = new BrandRepository();
  const compRepo = new CompetitorRepository();
  const repo = new CitationIntelligenceRepository();
  const service = new CitationIntelligenceService(repo, brandRepo, compRepo);

  const testBrand: Brand = {
    id: "brand-test-888",
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
    id: "comp-test-888",
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

    // 1. URL Normalization
    console.log("▶ TEST: URL Normalization and UTM query stripping...");
    const norm1 = service.normalizeUrl("https://WWW.SECURE-SITE.com/About/?utm_source=news&gclid=123");
    assert.strictEqual(norm1, "https://secure-site.com/About");

    const norm2 = service.normalizeUrl("http://wikipedia.org/");
    assert.strictEqual(norm2, "http://wikipedia.org/");
    console.log("  ✅ Normalization verified.");

    // 2. Extensible Classification
    console.log("▶ TEST: Rule-based Citation Classification...");
    const class1 = service.classifyDomain("secure-site.com", testBrand, [testCompetitor]);
    assert.strictEqual(class1, "owned");

    const class2 = service.classifyDomain("external-competitor.com", testBrand, [testCompetitor]);
    assert.strictEqual(class2, "competitor");

    const class3 = service.classifyDomain("mimes.gov", testBrand, [testCompetitor]);
    assert.strictEqual(class3, "government");

    const class4 = service.classifyDomain("unicef.org", testBrand, [testCompetitor]);
    assert.strictEqual(class4, "third_party");
    console.log("  ✅ Classification rules verified.");

    // 3. Quality & Authority Evaluations
    console.log("▶ TEST: Quality and Authority Evaluations...");
    const qual = service.evaluateCitationQuality("https://secure-site.com/deep-guide", "Rasha Gostar is cited here", testBrand);
    assert.strictEqual(qual >= 50 && qual <= 100, true);

    const auth = service.evaluateCitationAuthority("mimes.gov", "government");
    assert.strictEqual(auth, 95);
    console.log("  ✅ Evaluations verified.");

    // 4. Idempotent Discovery
    console.log("▶ TEST: Idempotent Discovery (Rerun yields no duplicate occurrences)...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-test-1", "ctx-discovery", async () => {
      const responseText = "Check https://wikipedia.org and https://secure-site.com for references.";
      const obsId = crypto.randomUUID();

      // Run Discovery First Time
      const firstRun = await service.discoverCitationsFromObservation(tenantA, obsId, responseText, {});
      assert.strictEqual(firstRun.length, 2);

      // Run Discovery Second Time on same observation
      const secondRun = await service.discoverCitationsFromObservation(tenantA, obsId, responseText, {});
      // Unique index on database / Map should block duplicate saves, yielding empty or skipped additions
      assert.strictEqual(secondRun.length, 0); // No new duplicates saved successfully
    });
    console.log("  ✅ Discovery Idempotency verified.");

    // 5. Multi-Tenant Isolation Boundaries
    console.log("▶ TEST: Multi-Tenant Zero-Trust Isolation for Citations...");
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-test-2", "ctx-isolation", async () => {
        // Tenant B trying to retrieve Tenant A's citation sources
        await repo.findSources(tenantA);
      });
      throw new Error("Failure: Tenant B bypassed tenant isolation checks on sources!");
    } catch (err: any) {
      assert.strictEqual(err.name, "TenantContextViolationException");
      assert.strictEqual(err.message.includes("Cross-tenant operation blocked"), true);
    }
    console.log("  ✅ Tenant isolation verified.");

    console.log("=========================================================================");
    console.log("✅ ALL AI CITATION INTELLIGENCE TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================================================");

  } catch (err) {
    console.error("❌ Test Suite failed:", err);
    throw err;
  }
}

// Support executing directly
if (require.main === module) {
  runCitationIntelligenceTests()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}
