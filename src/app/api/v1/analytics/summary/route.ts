import { NextRequest, NextResponse } from "next/server";
import { TenantContextManager } from "@/core/database/tenant-context";

export async function GET(req: NextRequest) {
  try {
    const organizationId = req.headers.get("x-tenant-id") || "tenant-pipeline-a";
    const userId = req.headers.get("x-user-id") || "usr-1001";
    const requestId = req.headers.get("x-request-id") || `req-analytics-${Date.now()}`;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("locale") || "fa";

    const response = await TenantContextManager.runWithTenantContext(
      organizationId,
      userId,
      requestId,
      async () => {
        // High-fidelity Mock Response that maps production specifications perfectly
        const isPersian = locale === "fa";

        const recentTrend = isPersian
          ? [
              { date: "۱ اسفند", score: 0.52 },
              { date: "۲ اسفند", score: 0.58 },
              { date: "۳ اسفند", score: 0.61 },
              { date: "۴ اسفند", score: 0.60 },
              { date: "۵ اسفند", score: 0.65 },
              { date: "۶ اسفند", score: 0.68 },
              { date: "۷ اسفند", score: 0.72 },
            ]
          : [
              { date: "Feb 12", score: 0.52 },
              { date: "Feb 13", score: 0.58 },
              { date: "Feb 14", score: 0.61 },
              { date: "Feb 15", score: 0.60 },
              { date: "Feb 16", score: 0.65 },
              { date: "Feb 17", score: 0.68 },
              { date: "Feb 18", score: 0.72 },
            ];

        const topEntities = isPersian
          ? [
              { name: "اپتیموس هوش مصنوعی", type: "brand", mentionCount: 520 },
              { name: "جی‌پی‌تی-۴", type: "model", mentionCount: 382 },
              { name: "کلود ۳.۵", type: "model", mentionCount: 310 },
              { name: "جمینای پرو", type: "model", mentionCount: 215 },
              { name: "دیجی‌کالا", type: "competitor", mentionCount: 145 },
            ]
          : [
              { name: "Optimus AI", type: "brand", mentionCount: 520 },
              { name: "GPT-4o", type: "model", mentionCount: 382 },
              { name: "Claude 3.5", type: "model", mentionCount: 310 },
              { name: "Gemini Pro", type: "model", mentionCount: 215 },
              { name: "Digikala", type: "competitor", mentionCount: 145 },
            ];

        return {
          totalMentions: 1572,
          averageSentimentScore: 0.65, // -1 to 1
          sentimentDistribution: {
            positive: 943,
            neutral: 472,
            negative: 157,
          },
          topEntities,
          recentTrend,
        };
      }
    );

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("[API Analytics Summary Route Error]:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
