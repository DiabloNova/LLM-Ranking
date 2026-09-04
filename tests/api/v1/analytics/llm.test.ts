import { POST } from "../../../../src/app/api/v1/analytics/llm/route";
import { NextRequest } from "next/server";

async function runDirectLlmAnalyticsTests() {
  console.log("=========================================================================");
  console.log("DIRECT REGRESSION TEST: src/app/api/v1/analytics/llm/route.ts");
  console.log("=========================================================================\n");

  let passed = 0;
  let total = 0;

  function assertTest(id: number, scenario: string, condition: boolean, details?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`Test ${id.toString().padStart(2, " ")} | ${scenario.padEnd(50, " ")} | Result: PASS ✅`);
    } else {
      console.error(`Test ${id.toString().padStart(2, " ")} | ${scenario.padEnd(50, " ")} | Result: FAIL ❌`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  // 1. Test missing x-tenant-id (Authorization Boundary)
  {
    const req = new NextRequest("http://localhost:3000/api/v1/analytics/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: "Rasha Gostar",
        competitorNames: ["Digikala"],
        queries: ["بهترین برند کدام است؟"],
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    assertTest(
      1,
      "Missing x-tenant-id -> 401 Unauthorized",
      res.status === 401 && body.error === "Unauthorized",
      `Expected 401, got ${res.status}: ${JSON.stringify(body)}`
    );
  }

  // 2. Test invalid / unparseable LLM output -> Fail Closed HTTP 500
  {
    const req = new NextRequest("http://localhost:3000/api/v1/analytics/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "00000000-0000-0000-0000-000000000001",
        "x-user-id": "usr-test-123",
      },
      body: JSON.stringify({
        brandName: "Rasha Gostar",
        competitorNames: ["Digikala"],
        queries: ["بهترین برند کدام است؟"],
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    const isFailClosed = res.status === 500 && body.error === "Internal Server Error";
    const hasNoRandomData = body.shareOfVoice === undefined && body.sentimentScore === undefined;

    assertTest(
      2,
      "Invalid LLM output -> HTTP 500 Fail Closed (No Math.random / synthetic fallback)",
      isFailClosed && hasNoRandomData,
      `Expected HTTP 500 with no synthetic payload, got status ${res.status}: ${JSON.stringify(body)}`
    );
  }

  console.log("\n=========================================================================");
  console.log(`SUMMARY: ${passed}/${total} DIRECT TESTS PASSED`);
  console.log("=========================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runDirectLlmAnalyticsTests().catch((err) => {
  console.error("Direct LLM Analytics test runner error:", err);
  process.exit(1);
});
