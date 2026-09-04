import { NextRequest, NextResponse } from "next/server";
import { ApiService } from "../services/api-service";
import { ApiQuotaService } from "../services/api-quota-service";

const apiService = new ApiService();
const apiQuotaService = new ApiQuotaService();

export interface AuthenticatedApiRequest extends NextRequest {
  tenantId?: string;
  userId?: string;
}

/**
 * Common response error formatter for the Public API
 */
export function buildApiErrorResponse(
  code: string,
  message: string,
  status: number
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

/**
 * Middleware that wraps public API routes to enforce:
 * - API Key Authentication
 * - Tenant Context Resolution
 * - Rate Limiting
 * - Quota/Usage enforcement (optional, based on endpoint cost)
 */
export async function withPublicApi(
  req: NextRequest,
  handler: (
    req: AuthenticatedApiRequest
  ) => Promise<NextResponse>,
  options?: { requireQuotaTokens?: number }
): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get("authorization");

    if (
      !authHeader ||
      !authHeader.toLowerCase().startsWith("bearer ")
    ) {
      return buildApiErrorResponse(
        "UNAUTHORIZED",
        "Missing or invalid Authorization header. Expected Bearer <API_KEY>",
        401
      );
    }

    const token = authHeader.substring(7).trim();
    const apiKey = await apiService.authenticateKey(token);

    if (!apiKey) {
      return buildApiErrorResponse(
        "UNAUTHORIZED",
        "Invalid, revoked, or expired API key.",
        401
      );
    }

    const tenantId = apiKey.organizationId;
    const userId = apiKey.id;

    // 2. Check Rate Limit (e.g. 100 requests per minute)
    const rateLimit = await apiQuotaService.checkRateLimit(
      tenantId,
      100,
      60000
    );

    if (!rateLimit.allowed) {
      const response = buildApiErrorResponse(
        "RATE_LIMIT_EXCEEDED",
        "API rate limit exceeded.",
        429
      );

      response.headers.set("X-RateLimit-Remaining", "0");
      response.headers.set("Retry-After", "60");

      return response;
    }

    // 3. Optional: Enforce Usage Quota
    if (options?.requireQuotaTokens) {
      try {
        await apiQuotaService.enforceAndConsumeQuota(
          tenantId,
          options.requireQuotaTokens
        );
      } catch (err: unknown) {
        const errorObj = err as {
          message?: string;
        };

        const errorMessage =
          err instanceof Error
            ? err.message
            : errorObj.message || String(err);

        if (
          errorMessage === "Usage Limit Exceeded" ||
          errorMessage === "Quota Exceeded"
        ) {
          return buildApiErrorResponse(
            "USAGE_LIMIT_EXCEEDED",
            "API usage quota exceeded for this billing cycle.",
            403
          );
        }

        if (errorMessage === "Quota Not Found") {
          return buildApiErrorResponse(
            "QUOTA_NOT_FOUND",
            "No active quota found for this account.",
            403
          );
        }

        throw err;
      }
    }

    // 4. Attach resolved context to request for the downstream handler
    const authenticatedReq = req as AuthenticatedApiRequest;
    authenticatedReq.tenantId = tenantId;
    authenticatedReq.userId = userId;

    // 5. Execute handler
    const response = await handler(authenticatedReq);

    // Add rate limit headers to success responses
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimit.remaining.toString()
    );

    return response;
  } catch (error: unknown) {
    console.error("[Public API Error]", error);

    // Never expose stack traces or internal SQL errors to the API
    return buildApiErrorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred.",
      500
    );
  }
}