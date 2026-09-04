import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLLMClient } from "@/services/ai/llm-client";
import { TenantContextManager } from "@/core/database/tenant-context";

// Request validator schema
const requestSchema = z.object({
  brandName: z.string().min(1, "نام برند الزامی است"),
  competitorNames: z.array(z.string()).min(1, "حداقل وارد کردن نام یک رقیب الزامی است"),
  queries: z.array(z.string()).min(1, "حداقل وارد کردن یک پرس‌وجو الزامی است"),
});

export interface LlmAnalyticsResponse {
  shareOfVoice: {
    yourBrand: number; // percentage
    competitors: Array<{ name: string; percentage: number }>;
  };
  sentimentScore: number; // 0-100
  queryResults: Array<{
    query: string;
    simulatedResponse: string;
    brandMentioned: boolean;
    sentiment: "positive" | "neutral" | "negative";
    hallucinationRisk: "low" | "medium" | "high";
  }>;
  actionableInsights: string[];
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Tenant (Required parameter context)
    const tenantId = req.headers.get("x-tenant-id");
    const userId = req.headers.get("x-user-id") || "usr-analytics-default";

    if (!tenantId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "شناسه مستأجر معتبر ارسال نشده است. این ویژگی نیاز به اشتراک فعال دارد." },
        { status: 401 }
      );
    }

    // 2. Parse and Validate Payload
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "درخواست نامعتبر است.";
      return NextResponse.json(
        { error: "Bad Request", message: errorMsg },
        { status: 400 }
      );
    }

    const { brandName, competitorNames, queries } = parsed.data;

    // Run inside secure tenant isolation context
    return await TenantContextManager.runWithTenantContext(tenantId, userId, "req-llm-analytics", async () => {
      const llmClient = getLLMClient();
      let rawLlmOutput = "";

      const prompt = `
        You are a world-class AI Analyst and Brand Strategist.
        We are conducting simulated LLM brand visibility audits for the brand "${brandName}" versus its competitors: ${competitorNames.join(", ")}.

        For each of the following queries, simulate how a leading AI model (e.g. ChatGPT, Claude) would answer in professional fluent Persian:
        ${queries.map((q, idx) => `${idx + 1}. "${q}"`).join("\n")}

        Analyze each generated response to determine:
        1. brandMentioned: true if "${brandName}" is explicitly mentioned/recommended, otherwise false.
        2. sentiment: "positive" | "neutral" | "negative" regarding "${brandName}".
        3. hallucinationRisk: "low" | "medium" | "high" depending on factual clarity.

        Then, compile:
        - shareOfVoice: A generated recommendation percentage for "${brandName}" and each competitor (sum must equal 100).
        - sentimentScore: Overall calculated score (0-100) for "${brandName}" across the simulations.
        - actionableInsights: 3 highly specific brand recommendations in Persian (advising connections to Content Studio or Knowledge Graph).

        You must strictly output a valid JSON object in Persian with this structure (no markdown wrapper blocks, no explanations outside JSON):
        {
          "shareOfVoice": {
            "yourBrand": number,
            "competitors": [
              { "name": "string", "percentage": number }
            ]
          },
          "sentimentScore": number,
          "queryResults": [
            {
              "query": "string",
              "simulatedResponse": "string",
              "brandMentioned": boolean,
              "sentiment": "positive"|"neutral"|"negative",
              "hallucinationRisk": "low"|"medium"|"high"
            }
          ],
          "actionableInsights": ["string"]
        }
      `;

      try {
        rawLlmOutput = await llmClient.generateText(prompt, {
          temperature: 0.3,
          systemPrompt: "You are an expert brand analyst who outputs strictly valid JSON structures in Persian."
        });
      } catch (llmErr: unknown) {
        console.error("[LLM Analytics Model Error]:", llmErr);
      }

      let cleanJson = rawLlmOutput.trim();
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.substring(7, cleanJson.length - 3).trim();
      } else if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.substring(3, cleanJson.length - 3).trim();
      }

      let parsedAnalytics: LlmAnalyticsResponse;
      try {
        parsedAnalytics = JSON.parse(cleanJson);
        if (!parsedAnalytics || typeof parsedAnalytics !== "object" || !parsedAnalytics.shareOfVoice) {
          throw new Error("Parsed JSON is not a valid LlmAnalyticsResponse structure.");
        }
      } catch (parseErr: unknown) {
        console.error("[LLM Analytics JSON Parse Error]:", parseErr);
        return NextResponse.json(
          { error: "Internal Server Error", message: "پاسخ مدل زبانی قابل تحلیل نیست. لطفاً مجدداً تلاش کنید." },
          { status: 500 }
        );
      }

      return NextResponse.json(parsedAnalytics);
    });

  } catch (error: unknown) {
    console.error("[LLM Analytics API Error]:", error);
    const message = error instanceof Error ? error.message : "خطای سرور در تحلیل مدل‌های زبانی رخ داد.";
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
