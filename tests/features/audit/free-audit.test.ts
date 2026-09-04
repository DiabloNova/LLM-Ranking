/**
 * Automated Test Suite for Free SEO Audit (Firecrawl Lead Magnet Module)
 * Verifies precise scoring heuristics, Persian quick-tip generation,
 * Grade boundaries, and mock-based Firecrawl App scraping.
 */

import { NextRequest } from "next/server";
import { POST, FreeAuditResponse } from "../../../src/app/api/v1/audit/free/route";
import { firecrawlApp } from "../../../src/lib/firecrawl";

export async function testFreeAudit() {
  console.log("▶ Running Free SEO Audit Lead Magnet Tests...");

  // Save original scrapeUrl method
  const originalScrapeUrl = firecrawlApp.scrapeUrl;

  try {
    // 1. Scenario A: Perfect Scrape (Score 100, Grade A)
    console.log("  * Scenario A: Testing Perfect Score (100) & Grade A...");
    (firecrawlApp as any).scrapeUrl = async (url: string, options?: any): Promise<any> => {
      // Avoid unused variable warnings
      if (!url || !options) return null;
      return {
        success: true,
        markdown: "# Welcome to Optimus AI\nThis is a beautiful page content.",
        metadata: {
          title: "تحلیل پیشرفته سئو معنایی و هوشمندسازی کسب‌وکار آنلاین", // Exactly 53 chars (between 50 and 60)
          description: "تحلیل جامع ساختار سئو معنایی، پایش سلامت احساسات برند، استخراج تخصصی گراف دانش و بررسی بهینه‌سازی موتورهای پاسخ‌دهی هوشمند به زبان فارسی انجام می‌گردد.", // Exactly 152 chars (between 150 and 160)
          language: "fa",
          robots: "index, follow",
        },
      };
    };

    const reqA = new NextRequest("http://localhost/api/v1/audit/free", {
      method: "POST",
      body: JSON.stringify({ url: "https://optimus.ai" }),
    });

    const resA = await POST(reqA);
    const perfectPayload = (await resA.json()) as FreeAuditResponse;

    if (resA.status !== 200) {
      throw new Error(`Scenario A Failed: Expected status 200, got ${resA.status}`);
    }

    if (perfectPayload.score !== 100) {
      throw new Error(`Scenario A Failed: Expected score 100, got ${perfectPayload.score}`);
    }

    if (perfectPayload.grade !== "A") {
      throw new Error(`Scenario A Failed: Expected grade A, got ${perfectPayload.grade}`);
    }

    if (perfectPayload.quickTips.length < 2) {
      throw new Error(`Scenario A Failed: Expected perfect general Pro Tips fallback to be added, got ${perfectPayload.quickTips.length} tips`);
    }

    console.log(`  * Success: Perfect page scored ${perfectPayload.score} with Grade ${perfectPayload.grade} and perfect general Persian tips.`);

    // 2. Scenario B: Imperfect/Poor Scrape (Missing tags, HTTP, noindex -> score 0, Grade F)
    console.log("  * Scenario B: Testing Poor Score & Grade F...");
    (firecrawlApp as any).scrapeUrl = async (url: string, options?: any): Promise<any> => {
      // Avoid unused variable warnings
      if (!url || !options) return null;
      return {
        success: true,
        markdown: "No header content at all.",
        metadata: {
          title: "",
          description: "",
          language: "",
          robots: "noindex, nofollow",
        },
      };
    };

    const reqB = new NextRequest("http://localhost/api/v1/audit/free", {
      method: "POST",
      body: JSON.stringify({ url: "http://poor-site.com" }), // HTTP (not HTTPS)
    });

    const resB = await POST(reqB);
    const poorPayload = (await resB.json()) as FreeAuditResponse;

    if (resB.status !== 200) {
      throw new Error(`Scenario B Failed: Expected status 200, got ${resB.status}`);
    }

    if (poorPayload.score !== 0) {
      throw new Error(`Scenario B Failed: Expected score 0, got ${poorPayload.score}`);
    }

    if (poorPayload.grade !== "F") {
      throw new Error(`Scenario B Failed: Expected grade F, got ${poorPayload.grade}`);
    }

    // Verify checks are all false
    const { checks } = poorPayload;
    if (checks.hasTitle || checks.hasMetaDescription || checks.hasH1 || checks.isHttps || checks.hasLanguage || checks.isIndexable) {
      throw new Error(`Scenario B Failed: Expected all checks to be false, got ${JSON.stringify(checks)}`);
    }

    // Verify correct custom tips mapping exists for sliced high priority issues (Title, Meta Description, H1)
    const hasTitleTip = (poorPayload.quickTips as Array<{ issue: string; recommendation: string }>).some((tip) => tip.issue.includes("عنوان"));
    const hasMetaTip = (poorPayload.quickTips as Array<{ issue: string; recommendation: string }>).some((tip) => tip.issue.includes("توضیحات"));
    const hasH1Tip = (poorPayload.quickTips as Array<{ issue: string; recommendation: string }>).some((tip) => tip.issue.includes("H1"));
    if (!hasTitleTip || !hasMetaTip || !hasH1Tip) {
      throw new Error(`Scenario B Failed: Expected critical warning tips for Title, Meta Description and H1, got ${JSON.stringify(poorPayload.quickTips)}`);
    }

    console.log(`  * Success: Non-optimized page scored ${poorPayload.score} with Grade ${poorPayload.grade} and custom warning tips.`);

    // 3. Scenario C: Invalid URL rejection
    console.log("  * Scenario C: Testing Invalid URL rejection...");
    const reqC = new NextRequest("http://localhost/api/v1/audit/free", {
      method: "POST",
      body: JSON.stringify({ url: "not-a-valid-url" }),
    });

    const resC = await POST(reqC);
    const badUrlPayload = (await resC.json()) as { error: string; message: string };

    if (resC.status !== 400) {
      throw new Error(`Scenario C Failed: Expected status 400, got ${resC.status}`);
    }

    if (!badUrlPayload.message.includes("لطفاً")) {
      throw new Error(`Scenario C Failed: Expected Persian validation error message, got: ${badUrlPayload.message}`);
    }

    console.log("  * Success: Invalid URL rejected correctly with Persian instructions.");

  } finally {
    // Restore original scrape implementation
    firecrawlApp.scrapeUrl = originalScrapeUrl;
  }

  console.log("✅ Free SEO Audit Lead Magnet Tests Passed Successfully!");
}

// Run directly if called
if (require.main === module) {
  testFreeAudit().catch((err) => {
    console.error("❌ Free SEO Audit Tests failed:", err);
    process.exit(1);
  });
}
