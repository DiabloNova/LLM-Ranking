import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { answerQuestion } from "@/services/rag/query-service";
import { TenantContextManager } from "@/core/database/tenant-context";
import { authorizeApiRequest } from "@/services/auth/authorization";
import { enforceRateLimit, rateLimitHeaders, RateLimitError, RATE_LIMIT_RULES } from "@/lib/rate-limit";

// Input validation schema
const requestSchema = z.object({
  question: z.string().min(1, "Question must be provided"),
  limit: z.number().int().positive().optional().default(5),
});

export async function POST(req: NextRequest) {
  let limitHeaders: Record<string, string> = {};

  try {
    // 1. Authoritative API identity resolution (session overrides client headers)
    let userId: string;
    let tenantId: string;

    try {
      const auth = await authorizeApiRequest(req);
      userId = auth.userId;
      tenantId = auth.tenantId;
    } catch (err: unknown) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message:
            err instanceof Error ? err.message : "Authentication failed",
        },
        {
          status: (err as { statusCode?: number }).statusCode || 401,
        }
      );
    }

    // 2. Spend protection: RAG queries consume LLM tokens. Fails closed per RATE_LIMIT_RULES.ragQuery.
    const { rejection, result } = await enforceRateLimit(RATE_LIMIT_RULES.ragQuery, tenantId);
    limitHeaders = rateLimitHeaders(result);
    if (rejection) {
      return rejection;
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Bad Request", details: parsed.error.format() },
        { status: 400, headers: limitHeaders }
      );
    }

    const { question, limit } = parsed.data;

    // Strict Tenant Context Isolation wrapping
    const requestId =
      req.headers.get("x-request-id") || `req-rag-${Date.now()}`;

    const ragResponse = await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      requestId,
      async () => {
        return await answerQuestion(question, tenantId, limit);
      }
    );

    return NextResponse.json(ragResponse, { headers: limitHeaders });
  } catch (error: unknown) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Service Unavailable", message: error.message },
        { status: error.statusCode, headers: limitHeaders }
      );
    }

    console.error("[API RAG Query Route Error]:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500, headers: limitHeaders }
    );
  }
}