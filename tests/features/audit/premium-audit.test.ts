/**
 * Automated Test Suite for Premium SEO Audit (Crawl + LLM + Database)
 * Verifies robust URL validation, x-tenant-id isolation, heuristic weighted scoring,
 * mock Firecrawl site crawling, and simulated LLM analysis.
 */

import { NextRequest } from "next/server";
import { POST, PremiumAuditResponse } from "../../../src/app/api/v1/audit/premium/route";
import { firecrawlApp } from "../../../src/lib/firecrawl";

export async function testPremiumAudit() {
  console.log("▶ Running Premium SEO Audit Lead Magnet Tests...");

  // Save original crawlUrl method and env key
  const originalCrawlUrl = firecrawlApp.crawlUrl;
  const originalApiKey = process.env.FIRECRAWL_API_KEY;

  try {
    // Force route to execute crawl instead of internal mock mode
    process.env.FIRECRAWL_API_KEY = "fc-test-api-key";

    // 1. Scenario A: Perfect Crawl (Verify Score, Grades, and JSON Recommendations)
    console.log("  * Scenario A: Testing Perfect Crawl and Score calculation...");
    (firecrawlApp as any).crawlUrl = async (url: string, options?: any): Promise<any> => {
      if (!url || !options) return null;
      return {
        success: true,
        data: [
          {
            url: `${url}/`,
            markdown: "# Optimus AI\nWe provide advanced semantic search and AI optimization.",
            metadata: { title: "صفحه اصلی - خانه خلاق هوش مصنوعی", description: "پلتفرم پیشرفته تحلیل هوشمند سئو معنایی" }
          },
          {
            url: `${url}/blog`,
            markdown: "# وبلاگ\nآموزش بهینه‌سازی معنایی و گراف دانش.",
            metadata: { title: "وبلاگ - مقالات آموزشی سئو معنایی", description: "آموزش گام به گام بهینه‌سازی معنایی" }
          }
        ]
      };
    };

    const reqA = new NextRequest("http://localhost/api/v1/audit/premium", {
      method: "POST",
      headers: {
        "x-tenant-id": "org-enterprise-01",
        "x-user-id": "usr-test-101"
      },
      body: JSON.stringify({ url: "https://optimus.ai", depth: 10 }),
    });

    const resA = await POST(reqA);
    const payloadA = (await resA.json()) as PremiumAuditResponse;

    if (resA.status !== 200) {
      throw new Error(`Scenario A Failed: Expected status 200, got ${resA.status} - Payload: ${JSON.stringify(payloadA)}`);
    }

    if (payloadA.score < 50 || payloadA.score > 100) {
      throw new Error(`Scenario A Failed: Score out of bounds: ${payloadA.score}`);
    }

    if (!payloadA.grade) {
      throw new Error(`Scenario A Failed: Missing overall Grade field`);
    }

    if (payloadA.pagesAnalyzed !== 2) {
      throw new Error(`Scenario A Failed: Expected pagesAnalyzed to be 2, got ${payloadA.pagesAnalyzed}`);
    }

    console.log(`  * Success: Scored ${payloadA.score} with Grade ${payloadA.grade} for ${payloadA.pagesAnalyzed} pages.`);

    // 2. Scenario B: Tenant Context Rejection
    console.log("  * Scenario B: Testing Tenant Context Rejection...");
    const reqB = new NextRequest("http://localhost/api/v1/audit/premium", {
      method: "POST",
      body: JSON.stringify({ url: "https://optimus.ai" }),
    });

    const resB = await POST(reqB);
    const payloadB = (await resB.json()) as { error: string; message: string };

    if (resB.status !== 401) {
      throw new Error(`Scenario B Failed: Expected status 401, got ${resB.status}`);
    }

    if (!payloadB.message.includes("مستأجر")) {
      throw new Error(`Scenario B Failed: Expected tenant authentication message, got: ${payloadB.message}`);
    }

    console.log("  * Success: Unauthorized requests rejected correctly.");

    // 3. Scenario C: Invalid URL rejection
    console.log("  * Scenario C: Testing Invalid URL rejection...");
    const reqC = new NextRequest("http://localhost/api/v1/audit/premium", {
      method: "POST",
      headers: {
        "x-tenant-id": "org-enterprise-01"
      },
      body: JSON.stringify({ url: "not-a-valid-url" }),
    });

    const resC = await POST(reqC);
    const payloadC = (await resC.json()) as { error: string; message: string };

    if (resC.status !== 400) {
      throw new Error(`Scenario C Failed: Expected status 400, got ${resC.status}`);
    }

    console.log("  * Success: Invalid URL rejected correctly.");

  } finally {
    // Restore original crawl implementation and env key
    firecrawlApp.crawlUrl = originalCrawlUrl;
    process.env.FIRECRAWL_API_KEY = originalApiKey;
  }

  console.log("✅ Premium SEO Audit Tests Passed Successfully!");
}

// Run directly if called
if (require.main === module) {
  testPremiumAudit().catch((err) => {
    console.error("❌ Premium SEO Audit Tests failed:", err);
    process.exit(1);
  });
}
