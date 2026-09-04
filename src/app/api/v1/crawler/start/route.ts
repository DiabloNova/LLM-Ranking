import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { CrawlerOrchestrator } from "@/services/crawler/crawler-orchestrator";
import { authorizeApiRequest, AuthorizationError } from "@/services/auth/authorization";
import { enforceRateLimit, rateLimitHeaders, RateLimitError, RATE_LIMIT_RULES } from "@/lib/rate-limit";

/**
 * POST /api/v1/crawler/start
 *
 * Starts a crawl campaign for the caller's tenant.
 *
 * Identity: resolved exclusively via authorizeApiRequest(), which prefers the signed
 * session cookie and, for developer API integrations, verifies that the header-supplied
 * user is an actual member of the header-supplied tenant. The client-supplied
 * `x-tenant-id` header is NEVER trusted as authorization on its own.
 *
 * Spend control: crawl campaigns consume Firecrawl credits and compute, so the route is
 * rate limited per tenant and fails closed if the limiter cannot reach a decision.
 */
const requestSchema = z.object({
  seedUrls: z
    .array(z.string().url("Each seed URL must be a valid URL"))
    .min(1, "At least one seed URL is required")
    .max(50, "A maximum of 50 seed URLs may be submitted per campaign"),
});

export async function POST(req: NextRequest) {
  let rateLimitResultHeaders: Record<string, string> = {};

  try {
    // 1. Authoritative identity resolution. Fails closed.
    const { userId, tenantId } = await authorizeApiRequest(req);

    // 2. Spend protection, keyed by the verified tenant.
    const { rejection, result } = await enforceRateLimit(RATE_LIMIT_RULES.crawlerStart, tenantId);
    rateLimitResultHeaders = rateLimitHeaders(result);
    if (rejection) {
      return rejection;
    }

    const requestId = req.headers.get("x-request-id") || randomUUID();

    // 3. Parse and validate the JSON request body.
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid JSON body structure." },
        { status: 400, headers: rateLimitResultHeaders }
      );
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Bad Request", details: parsed.error.format() },
        { status: 400, headers: rateLimitResultHeaders }
      );
    }

    const { seedUrls } = parsed.data;

    // 4. Run the campaign for the verified tenant/user pair.
    const orchestrator = new CrawlerOrchestrator();
    const campaignResult = await orchestrator.runCrawlerCampaign(seedUrls, tenantId, userId, requestId);

    return NextResponse.json(campaignResult, { status: 200, headers: rateLimitResultHeaders });
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.statusCode === 401 ? "Unauthorized" : "Forbidden", message: error.message },
        { status: error.statusCode, headers: rateLimitResultHeaders }
      );
    }

    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Service Unavailable", message: error.message },
        { status: error.statusCode, headers: rateLimitResultHeaders }
      );
    }

    console.error("[API Crawler Campaign Start Route Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "The crawl campaign could not be started." },
      { status: 500, headers: rateLimitResultHeaders }
    );
  }
}
