import * as assert from "assert";
import { TenantContextManager } from "../../../src/core/database/tenant-context";
import {
  SiteArchitectureAnalyzerService,
  normalizeGraphUrl
} from "../../../src/features/ai-intelligence/services/site-architecture-analyzer-service";
import { Page } from "../../../src/features/ai-intelligence/domain/types";

export async function runSiteArchitectureTests() {
  console.log("=========================================================================");
  console.log("SITE ARCHITECTURE INTELLIGENCE (TASK 9.2) — TEST SUITE");
  console.log("=========================================================================");

  const tenantA = "tenant-alpha-001";
  const tenantB = "tenant-beta-002";
  const websiteId = "web-site-arch-01";

  const analyzer = new SiteArchitectureAnalyzerService();

  function createMockPage(url: string, path: string, title?: string): Page {
    return {
      id: `pg-${path.replace(/\//g, "-")}`,
      organizationId: tenantA,
      websiteId,
      url,
      normalizedUrl: url,
      path,
      statusCode: 200,
      indexability: "indexable",
      title: title || path,
      audit: {
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        createdBy: "test",
        updatedBy: "test",
        version: 1
      }
    };
  }

  try {
    // Test 1: Crawl Depth Calculation
    console.log("▶ TEST 1: Crawl Depth BFS Calculation...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-1", "ctx-arch-1", async () => {
      const pages = [
        createMockPage("https://site.com/", "/"),
        createMockPage("https://site.com/section", "/section"),
        createMockPage("https://site.com/section/topic", "/section/topic"),
        createMockPage("https://site.com/section/topic/page", "/section/topic/page")
      ];

      const links = [
        { sourceUrl: "https://site.com/", targetUrl: "https://site.com/section", normalizedTargetUrl: "https://site.com/section" },
        { sourceUrl: "https://site.com/section", targetUrl: "https://site.com/section/topic", normalizedTargetUrl: "https://site.com/section/topic" },
        { sourceUrl: "https://site.com/section/topic", targetUrl: "https://site.com/section/topic/page", normalizedTargetUrl: "https://site.com/section/topic/page" }
      ];

      const res = analyzer.analyzeArchitecture(tenantA, websiteId, { pages, links, rootUrl: "https://site.com/" });

      const depthMap = new Map(res.crawlDepths.map(cd => [normalizeGraphUrl(cd.url), cd.crawlDepth]));

      assert.strictEqual(depthMap.get(normalizeGraphUrl("https://site.com/")), 0);
      assert.strictEqual(depthMap.get(normalizeGraphUrl("https://site.com/section")), 1);
      assert.strictEqual(depthMap.get(normalizeGraphUrl("https://site.com/section/topic")), 2);
      assert.strictEqual(depthMap.get(normalizeGraphUrl("https://site.com/section/topic/page")), 3);
      assert.strictEqual(res.metrics.maxCrawlDepth, 3);
    });
    console.log("  ✅ Crawl Depth BFS calculation verified successfully.");

    // Test 2: Orphan Page Detection
    console.log("▶ TEST 2: Orphan Page Detection...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-1", "ctx-arch-2", async () => {
      const pages = [
        createMockPage("https://site.com/", "/"),
        createMockPage("https://site.com/products", "/products"),
        createMockPage("https://site.com/products/a", "/products/a"),
        createMockPage("https://site.com/orphan", "/orphan")
      ];

      const links = [
        { sourceUrl: "https://site.com/", targetUrl: "https://site.com/products", normalizedTargetUrl: "https://site.com/products" },
        { sourceUrl: "https://site.com/products", targetUrl: "https://site.com/products/a", normalizedTargetUrl: "https://site.com/products/a" }
      ];

      const res = analyzer.analyzeArchitecture(tenantA, websiteId, { pages, links, rootUrl: "https://site.com/" });

      assert.strictEqual(res.orphanCandidates.includes("https://site.com/orphan"), true);
      const orphanFinding = res.findings.find(f => f.code === "ERR_ORPHAN_PAGE_DETECTED" && f.affectedResource === "https://site.com/orphan");
      assert.notStrictEqual(orphanFinding, undefined);
      assert.strictEqual(orphanFinding!.severity, "high");
    });
    console.log("  ✅ Orphan Page Detection verified successfully.");

    // Test 3: Weak Internal Linking
    console.log("▶ TEST 3: Weak Internal Linking Analysis...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-1", "ctx-arch-3", async () => {
      const pages = [
        createMockPage("https://site.com/", "/"),
        createMockPage("https://site.com/p1", "/p1"),
        createMockPage("https://site.com/p2", "/p2"),
        createMockPage("https://site.com/p3", "/p3"),
        createMockPage("https://site.com/p4", "/p4"),
        createMockPage("https://site.com/p5", "/p5"),
        createMockPage("https://site.com/weak-page", "/weak-page")
      ];

      const links = [
        { sourceUrl: "https://site.com/", targetUrl: "https://site.com/p1", normalizedTargetUrl: "https://site.com/p1" },
        { sourceUrl: "https://site.com/p1", targetUrl: "https://site.com/p2", normalizedTargetUrl: "https://site.com/p2" },
        { sourceUrl: "https://site.com/p2", targetUrl: "https://site.com/p3", normalizedTargetUrl: "https://site.com/p3" },
        { sourceUrl: "https://site.com/p3", targetUrl: "https://site.com/p4", normalizedTargetUrl: "https://site.com/p4" },
        { sourceUrl: "https://site.com/p4", targetUrl: "https://site.com/p5", normalizedTargetUrl: "https://site.com/p5" },
        { sourceUrl: "https://site.com/p5", targetUrl: "https://site.com/weak-page", normalizedTargetUrl: "https://site.com/weak-page" }
      ];

      const res = analyzer.analyzeArchitecture(tenantA, websiteId, { pages, links, rootUrl: "https://site.com/" });

      const weakFinding = res.findings.find(f => f.code === "WARN_INTERNAL_LINK_WEAK" && f.affectedResource === "https://site.com/weak-page");
      assert.notStrictEqual(weakFinding, undefined);
      assert.strictEqual(weakFinding!.category, "internal-linking");
    });
    console.log("  ✅ Weak Internal Linking analysis verified successfully.");

    // Test 4: Content Hierarchy Analysis
    console.log("▶ TEST 4: Content Hierarchy & Missing Parent Category Analysis...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-1", "ctx-arch-4", async () => {
      const pages = [
        createMockPage("https://site.com/", "/"),
        createMockPage("https://site.com/products", "/products"),
        createMockPage("https://site.com/products/a", "/products/a"),
        createMockPage("https://site.com/products/a/item", "/products/a/item"),
        // Note: /guides/seo/audit exists, but /guides or /guides/seo is missing in catalog
        createMockPage("https://site.com/guides/seo/audit", "/guides/seo/audit")
      ];

      const links = [
        { sourceUrl: "https://site.com/", targetUrl: "https://site.com/products", normalizedTargetUrl: "https://site.com/products" },
        { sourceUrl: "https://site.com/products", targetUrl: "https://site.com/products/a", normalizedTargetUrl: "https://site.com/products/a" },
        { sourceUrl: "https://site.com/products/a", targetUrl: "https://site.com/products/a/item", normalizedTargetUrl: "https://site.com/products/a/item" },
        { sourceUrl: "https://site.com/", targetUrl: "https://site.com/guides/seo/audit", normalizedTargetUrl: "https://site.com/guides/seo/audit" }
      ];

      const res = analyzer.analyzeArchitecture(tenantA, websiteId, { pages, links, rootUrl: "https://site.com/" });

      const hierarchyFinding = res.findings.find(f => f.code === "WARN_HIERARCHY_PARENT_MISSING");
      assert.notStrictEqual(hierarchyFinding, undefined);
      assert.strictEqual(hierarchyFinding!.category, "content-hierarchy");
    });
    console.log("  ✅ Content Hierarchy analysis verified successfully.");

    // Test 5: Cyclic Graph Safety
    console.log("▶ TEST 5: Cyclic Graph Safety (Infinite Loop Prevention)...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-1", "ctx-arch-5", async () => {
      const pages = [
        createMockPage("https://site.com/", "/"),
        createMockPage("https://site.com/a", "/a"),
        createMockPage("https://site.com/b", "/b"),
        createMockPage("https://site.com/c", "/c")
      ];

      // Cyclic edges: / -> /a -> /b -> /c -> /a
      const links = [
        { sourceUrl: "https://site.com/", targetUrl: "https://site.com/a", normalizedTargetUrl: "https://site.com/a" },
        { sourceUrl: "https://site.com/a", targetUrl: "https://site.com/b", normalizedTargetUrl: "https://site.com/b" },
        { sourceUrl: "https://site.com/b", targetUrl: "https://site.com/c", normalizedTargetUrl: "https://site.com/c" },
        { sourceUrl: "https://site.com/c", targetUrl: "https://site.com/a", normalizedTargetUrl: "https://site.com/a" }
      ];

      const res = analyzer.analyzeArchitecture(tenantA, websiteId, { pages, links, rootUrl: "https://site.com/" });

      assert.strictEqual(res.crawlDepths.length, 4);
      assert.strictEqual(res.crawlDepths.every(cd => cd.isReachableFromRoot), true);
    });
    console.log("  ✅ Cyclic Graph Safety verified successfully.");

    // Test 6: Determinism Verification
    console.log("▶ TEST 6: Output Determinism (Identical Inputs -> Identical Results)...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-1", "ctx-arch-6", async () => {
      const pages = [
        createMockPage("https://site.com/", "/"),
        createMockPage("https://site.com/a", "/a"),
        createMockPage("https://site.com/b", "/b")
      ];
      const links = [
        { sourceUrl: "https://site.com/", targetUrl: "https://site.com/a", normalizedTargetUrl: "https://site.com/a" },
        { sourceUrl: "https://site.com/a", targetUrl: "https://site.com/b", normalizedTargetUrl: "https://site.com/b" }
      ];

      const res1 = analyzer.analyzeArchitecture(tenantA, websiteId, { pages, links, rootUrl: "https://site.com/" });
      const res2 = analyzer.analyzeArchitecture(tenantA, websiteId, { pages, links, rootUrl: "https://site.com/" });

      assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2));
    });
    console.log("  ✅ Output Determinism verified successfully.");

    // Test 7: Incomplete Data Handling
    console.log("▶ TEST 7: Incomplete Data Handling...");
    await TenantContextManager.runWithTenantContext(tenantA, "usr-1", "ctx-arch-7", async () => {
      const pages = [
        createMockPage("https://site.com/", "/"),
        createMockPage("https://site.com/p1", "/p1")
      ];
      // Note: Only 2 pages total, link dataset is empty
      const res = analyzer.analyzeArchitecture(tenantA, websiteId, { pages, links: [], rootUrl: "https://site.com/" });

      // Because analyzed page count < 3, it does not fabricate orphan findings under incomplete dataset rules
      assert.strictEqual(res.orphanCandidates.length, 0);
    });
    console.log("  ✅ Incomplete Data Handling verified successfully.");

    // Test 8: Multi-Tenant Zero-Trust Security Isolation
    console.log("▶ TEST 8: Multi-Tenant Zero-Trust Security Isolation...");
    try {
      await TenantContextManager.runWithTenantContext(tenantB, "usr-2", "ctx-malicious", async () => {
        // Requesting Tenant A analysis from Tenant B context must fail immediately
        analyzer.analyzeArchitecture(tenantA, websiteId, { pages: [], links: [] });
      });
      throw new Error("Security Failure: Cross-tenant analysis request was erroneously allowed!");
    } catch (err: unknown) {
      const error = err as Error;
      assert.strictEqual(error.message.includes("Tenant Context Violation"), true);
    }
    console.log("  ✅ Multi-Tenant Security Isolation verified successfully.");

    console.log("=========================================================================");
    console.log("✅ ALL SITE ARCHITECTURE INTELLIGENCE TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================================================");

  } catch (err: unknown) {
    console.error("❌ Test Suite failed:", err);
    throw err;
  }
}

// Support direct execution
if (require.main === module) {
  runSiteArchitectureTests()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}
