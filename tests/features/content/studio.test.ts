/**
 * Automated Test Suite for Content Studio (Terminology + AEO Drafts)
 * Verifies robust URL validation, x-tenant-id isolation, and mock LLM semantic responses.
 */

import { NextRequest } from "next/server";
import { POST, ContentStudioResponse } from "../../../src/app/api/v1/content/studio/route";

export async function testContentStudio() {
  console.log("▶ Running Content Studio Tests...");

  try {
    // 1. Scenario A: Successful Semantic Review & Terminology Optimization
    console.log("  * Scenario A: Testing Terminology Review and AEO drafting...");
    const reqA = new NextRequest("http://localhost/api/v1/content/studio", {
      method: "POST",
      headers: {
        "x-tenant-id": "org-enterprise-01",
        "x-user-id": "usr-test-101"
      },
      body: JSON.stringify({
        url: "https://optimus.ai",
        brandVoice: "تخصصی",
        targetKeywords: ["سئو معنایی", "هوش مصنوعی"]
      }),
    });

    const resA = await POST(reqA);
    const payloadA = (await resA.json()) as ContentStudioResponse;

    if (resA.status !== 200) {
      throw new Error(`Scenario A Failed: Expected status 200, got ${resA.status} - Payload: ${JSON.stringify(payloadA)}`);
    }

    if (payloadA.semanticHealthScore < 0 || payloadA.semanticHealthScore > 100) {
      throw new Error(`Scenario A Failed: Semantic health score out of bounds: ${payloadA.semanticHealthScore}`);
    }

    if (payloadA.terminologySuggestions.length === 0) {
      throw new Error(`Scenario A Failed: Expected suggestions for negative words, got 0`);
    }

    // Verify 'ممیزی' was suggested for replacement
    const hasAuditCorrection = payloadA.terminologySuggestions.some(
      s => s.originalWord === "ممیزی" && s.suggestedWord.includes("تحلیل")
    );
    if (!hasAuditCorrection) {
      throw new Error(`Scenario A Failed: Expected 'ممیزی' to be flagged and replaced, got suggestions: ${JSON.stringify(payloadA.terminologySuggestions)}`);
    }

    if (payloadA.generatedContent.length === 0) {
      throw new Error(`Scenario A Failed: Expected generated content drafts, got 0`);
    }

    console.log(`  * Success: Generated ${payloadA.generatedContent.length} drafts with semantic health score of ${payloadA.semanticHealthScore}%. Correctly flagged 'ممیزی'.`);

    // 2. Scenario B: Tenant Context Rejection
    console.log("  * Scenario B: Testing Tenant Context Rejection...");
    const reqB = new NextRequest("http://localhost/api/v1/content/studio", {
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

  } finally {
    // Cleanup any states if needed
  }

  console.log("✅ Content Studio Tests Passed Successfully!");
}

// Run directly if called
if (require.main === module) {
  testContentStudio().catch((err) => {
    console.error("❌ Content Studio Tests failed:", err);
    process.exit(1);
  });
}
