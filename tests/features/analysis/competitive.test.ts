/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Automated Test Suite for Competitive Analysis Module
 * Verifies score heuristics, pair-wise comparisons, market position labels,
 * and tenant context isolation header validation.
 */

import { NextRequest } from "next/server";
import { POST, CompetitiveAnalysisResponse } from "../../../src/app/api/v1/analysis/competitive/route";
import { firecrawlApp } from "../../../src/lib/firecrawl";

export async function testCompetitiveAnalysis() {
  console.log("▶ Running Competitive Analysis Test Suite...");

  // Save original scrapeUrl method
  const originalScrapeUrl = firecrawlApp.scrapeUrl;

  try {
    // Scenario A: Successful standard analysis with multiple competitors
    console.log("  * Scenario A: Testing pair-wise comparisons and scoring...");
    (firecrawlApp as any).scrapeUrl = async (url: string, options?: any): Promise<any> => {
      return {
        success: true,
        markdown: `# Site content for ${url}\nWe are better than anyone.`,
        metadata: { title: "Test Site" }
      };
    };

    const reqA = new NextRequest("http://localhost/api/v1/analysis/competitive", {
      method: "POST",
      headers: {
        "x-tenant-id": "ws-tehran",
        "x-user-id": "usr-1001"
      },
      body: JSON.stringify({
        userUrl: "https://optimus-ai-brand.ir",
        competitorUrls: ["https://competitor-alpha.com", "https://competitor-beta.com"],
        analysisDepth: "standard"
      }),
    });

    const resA = await POST(reqA);
    const payload = (await resA.json()) as CompetitiveAnalysisResponse;

    if (resA.status !== 200) {
      throw new Error(`Scenario A Failed: Expected status 200, got ${resA.status}`);
    }

    // Verify properties of Response Schema
    if (typeof payload.overallScore !== "number" || payload.overallScore < 0 || payload.overallScore > 100) {
      throw new Error(`Scenario A Failed: Invalid overallScore in response: ${payload.overallScore}`);
    }

    if (!["leader", "challenger", "follower", "niche"].includes(payload.marketPosition)) {
      throw new Error(`Scenario A Failed: Invalid marketPosition: ${payload.marketPosition}`);
    }

    if (payload.competitorComparison.length !== 2) {
      throw new Error(`Scenario A Failed: Expected 2 competitors analyzed, got ${payload.competitorComparison.length}`);
    }

    const firstComp = payload.competitorComparison[0];
    if (!firstComp.competitorName || typeof firstComp.winProbability !== "number" || firstComp.winProbability < 0 || firstComp.winProbability > 100) {
      throw new Error(`Scenario A Failed: Competitor comparison data format incorrect: ${JSON.stringify(firstComp)}`);
    }

    if (!payload.competitiveAdvantages.length || !payload.gapAnalysis.length || !payload.strategicOpportunities.length) {
      throw new Error("Scenario A Failed: Advantages, gaps, or strategic opportunities are missing from output.");
    }

    // Ensure fluent Persian translations are returned in key insights
    const hasPersianAdvantage = payload.competitiveAdvantages.some(adv => adv.category.includes("سئو") || adv.category.includes("تولید"));
    const hasPersianGap = payload.gapAnalysis.some(gap => gap.category.includes("سرعت") || gap.category.includes("اعتبار") || gap.recommendedAction.includes("بهینه‌سازی"));

    if (!hasPersianAdvantage || !hasPersianGap) {
      throw new Error("Scenario A Failed: UI/Strategic recommendations are not returned in fluent Persian.");
    }

    console.log(`  * Success: Competitive analysis completed with score: ${payload.overallScore}, position: ${payload.marketPosition}`);

    // Scenario B: Missing Tenant Context Header (Enforce isolation)
    console.log("  * Scenario B: Testing tenant isolation context...");
    const reqB = new NextRequest("http://localhost/api/v1/analysis/competitive", {
      method: "POST",
      body: JSON.stringify({
        userUrl: "https://optimus-brand.ir",
        competitorUrls: ["https://competitor.com"]
      }),
    });

    const resB = await POST(reqB);
    const errorPayload = await resB.json();

    if (resB.status !== 400) {
      throw new Error(`Scenario B Failed: Expected 400 for missing tenant-id, got ${resB.status}`);
    }

    if (!errorPayload.message.toLowerCase().includes("tenant-id")) {
      throw new Error(`Scenario B Failed: Expected message indicating missing tenant-id, got: ${JSON.stringify(errorPayload)}`);
    }

    console.log("  * Success: Tenant isolation header successfully enforced.");

    // Scenario C: Validation error (no competitors provided)
    console.log("  * Scenario C: Testing validation rules (empty competitor array)...");
    const reqC = new NextRequest("http://localhost/api/v1/analysis/competitive", {
      method: "POST",
      headers: {
        "x-tenant-id": "ws-tehran"
      },
      body: JSON.stringify({
        userUrl: "https://optimus-brand.ir",
        competitorUrls: []
      }),
    });

    const resC = await POST(reqC);
    if (resC.status !== 400) {
      throw new Error(`Scenario C Failed: Expected 400 for invalid competitor list, got ${resC.status}`);
    }

    console.log("  * Success: Invalid competitor array rejected correctly.");

  } finally {
    // Restore original scrapeUrl function
    firecrawlApp.scrapeUrl = originalScrapeUrl;
  }

  console.log("✅ Competitive Analysis Tests Passed Successfully!");
}

// Execute test suite directly
if (require.main === module) {
  testCompetitiveAnalysis().catch((err) => {
    console.error("❌ Competitive Analysis Tests failed:", err);
    process.exit(1);
  });
}
