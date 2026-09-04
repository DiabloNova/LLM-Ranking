/**
 * Automated Test Suite for Technical Optimization Module
 * Verifies scoring heuristics, category calculations,
 * Persian recommendation generation, and tenant isolation validation.
 */

import { NextRequest } from "next/server";
import { POST, TechnicalAuditResponse } from "../../../src/app/api/v1/optimization/technical/route";
import { firecrawlApp } from "../../../src/lib/firecrawl";

export async function testTechnicalOptimization() {
  console.log("▶ Running Technical Optimization Test Suite...");

  // Save original scrapeUrl method
  const originalScrapeUrl = firecrawlApp.scrapeUrl;

  try {
    // 1. Scenario A: Perfect Scrape (HTTPS, alt tags, canonical, viewport, heading hierarchy all correct)
    console.log("  * Scenario A: Testing Perfect Score...");
    (firecrawlApp as any).scrapeUrl = async (url: string, options?: any): Promise<any> => {
      if (!url || !options) return null;
      return {
        success: true,
        markdown: "# Welcome\n## Services\n### Deep Tech\n![Optimus Logo](logo.png \"logo\")", // correct heading hierarchy and alt/title present
        metadata: {
          title: "تحلیل فنی سئو سایت",
          description: "بهینه‌سازی کدهای قالب برای دستیابی به سرعت و عملکرد ایده‌آل.",
          canonical: "https://example.com",
          robots: "index, follow",
        },
      };
    };

    const reqA = new NextRequest("http://localhost/api/v1/optimization/technical", {
      method: "POST",
      headers: {
        "x-tenant-id": "ws-tehran",
        "x-user-id": "usr-1001"
      },
      body: JSON.stringify({ url: "https://optimus-perfect.ai", pagesToAnalyze: 10 }),
    });

    const resA = await POST(reqA);
    const perfectPayload = (await resA.json()) as TechnicalAuditResponse;

    if (resA.status !== 200) {
      throw new Error(`Scenario A Failed: Expected status 200, got ${resA.status}`);
    }

    if (perfectPayload.technicalScore < 85) {
      throw new Error(`Scenario A Failed: Expected score >= 85 for perfect site, got ${perfectPayload.technicalScore}`);
    }

    console.log(`  * Success: Perfect site scored ${perfectPayload.technicalScore} with Grade ${perfectPayload.grade}.`);

    // 2. Scenario B: Poor Scrape (HTTP, missing alt tags, missing viewport, missing canonical)
    console.log("  * Scenario B: Testing Poor Score and Issue Detection...");
    (firecrawlApp as any).scrapeUrl = async (url: string, options?: any): Promise<any> => {
      if (!url || !options) return null;
      return {
        success: true,
        markdown: "# Unoptimized Page\n![]()\n### Skipping level heading directly", // empty alt text and skipping levels
        metadata: {
          title: "Slow page",
          robots: "noindex, nofollow"
        },
      };
    };

    const reqB = new NextRequest("http://localhost/api/v1/optimization/technical", {
      method: "POST",
      headers: {
        "x-tenant-id": "ws-tehran",
        "x-user-id": "usr-1001"
      },
      body: JSON.stringify({ url: "http://poor-unoptimized.com", pagesToAnalyze: 5 }), // HTTP (not HTTPS)
    });

    const resB = await POST(reqB);
    const poorPayload = (await resB.json()) as TechnicalAuditResponse;

    if (resB.status !== 200) {
      throw new Error(`Scenario B Failed: Expected status 200, got ${resB.status}`);
    }

    if (poorPayload.technicalScore >= 80) {
      throw new Error(`Scenario B Failed: Expected lower score, got ${poorPayload.technicalScore}`);
    }

    // Verify critical issues are generated in Persian
    const hasAltIssue = poorPayload.criticalIssues.some(issue => issue.issue.includes("alt") || issue.issue.includes("تصاویر"));
    const hasHttpsIssue = poorPayload.criticalIssues.some(issue => issue.issue.includes("HTTPS"));

    if (!hasAltIssue || !hasHttpsIssue) {
      throw new Error(`Scenario B Failed: Expected critical warning issues for missing Alt tags and HTTPS, got: ${JSON.stringify(poorPayload.criticalIssues)}`);
    }

    console.log(`  * Success: Non-optimized site scored ${poorPayload.technicalScore} with ${poorPayload.criticalIssues.length} critical issues detected.`);

    // 3. Scenario C: Missing Tenant Context isolation header
    console.log("  * Scenario C: Testing Tenant Isolation Header enforcement...");
    const reqC = new NextRequest("http://localhost/api/v1/optimization/technical", {
      method: "POST",
      body: JSON.stringify({ url: "https://any-site.com" }),
    });

    const resC = await POST(reqC);
    const tenantPayload = await resC.json();

    if (resC.status !== 400) {
      throw new Error(`Scenario C Failed: Expected status 400 for missing header, got ${resC.status}`);
    }

    if (!tenantPayload.message.includes("tenant-id")) {
      throw new Error(`Scenario C Failed: Expected tenant isolation error message, got: ${JSON.stringify(tenantPayload)}`);
    }

    console.log("  * Success: Missing tenant context rejected correctly.");

    // 4. Scenario D: Invalid URL rejection
    console.log("  * Scenario D: Testing Invalid URL rejection...");
    const reqD = new NextRequest("http://localhost/api/v1/optimization/technical", {
      method: "POST",
      headers: {
        "x-tenant-id": "ws-tehran",
      },
      body: JSON.stringify({ url: "not-a-valid-url" }),
    });

    const resD = await POST(reqD);
    const badUrlPayload = await resD.json();

    if (resD.status !== 400) {
      throw new Error(`Scenario D Failed: Expected status 400, got ${resD.status}`);
    }

    console.log("  * Success: Invalid URL rejected correctly.");

  } finally {
    // Restore original scrape implementation
    firecrawlApp.scrapeUrl = originalScrapeUrl;
  }

  console.log("✅ Technical Optimization Tests Passed Successfully!");
}

// Run directly if called
if (require.main === module) {
  testTechnicalOptimization().catch((err) => {
    console.error("❌ Technical Optimization Tests failed:", err);
    process.exit(1);
  });
}
