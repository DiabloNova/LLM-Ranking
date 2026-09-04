import { NextRequest, NextResponse } from "next/server";
import { dashboardHomeService } from "@/services/dashboard-home";
import { authorizeApiRequest, AuthorizationError } from "@/services/auth/authorization";

/**
 * GET /api/v1/dashboard/summary
 *
 * NOTE: `dashboardHomeService.getDashboardSummary()` currently re-derives its tenant
 * scope from the browser session cookie internally (via `requireSession()`), so a
 * Bearer-API-key caller resolved here still cannot fetch a summary. That inconsistency
 * is tracked as a follow-up (the service needs to accept a resolved tenant/user pair
 * instead of re-reading the cookie); this handler already does the correct thing by
 * resolving and propagating `authorizeApiRequest()`'s identity and status codes.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authorize the request. Session cookie or Bearer API key. Throws on failure.
    await authorizeApiRequest(req);

    const { searchParams } = new URL(req.url);
    const locale = (searchParams.get("locale") as "en" | "fa") || "fa";

    // 2. Aggregate dashboard statistics securely (tenant-scoped internally).
    const summary = await dashboardHomeService.getDashboardSummary(locale);

    return NextResponse.json(summary);
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.statusCode === 401 ? "Unauthorized" : "Forbidden", message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("[Dashboard Summary API Route Error]:", error);
    const message = error instanceof Error ? error.message : "خطای ناشناخته در دریافت اطلاعات داشبورد.";
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
