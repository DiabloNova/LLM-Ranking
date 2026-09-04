import { NextRequest, NextResponse } from "next/server";

/**
 * CORS policy for the public, Bearer-token-authenticated API surface
 * (`src/features/public-api`).
 *
 * Default-deny: with no `PUBLIC_API_ALLOWED_ORIGINS` configured, cross-origin
 * browser requests are rejected (server-to-server callers, which send no `Origin`
 * header, are unaffected -- CORS is a browser-enforced mechanism only). Operators that
 * need first-party browser JS to call this API from another origin must explicitly
 * allowlist it.
 */
function getAllowedOrigins(): string[] {
  const raw = process.env.PUBLIC_API_ALLOWED_ORIGINS;
  if (!raw || raw.trim() === "") {
    return [];
  }
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin !== "");
}

function resolveAllowedOrigin(requestOrigin: string | null): string | null {
  if (!requestOrigin) {
    return null;
  }
  const allowed = getAllowedOrigins();
  return allowed.includes(requestOrigin) ? requestOrigin : null;
}

/** Standard CORS response headers for an allowed origin, or `null` when disallowed. */
export function buildCorsHeaders(req: NextRequest): Record<string, string> | null {
  const origin = resolveAllowedOrigin(req.headers.get("origin"));
  if (!origin) {
    return null;
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Request-Id",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/**
 * Handles a CORS preflight (`OPTIONS`) request for the public API.
 * Returns a 204 with CORS headers for an allowlisted origin, or a plain 403 otherwise.
 */
export function handleCorsPreflight(req: NextRequest): NextResponse {
  const corsHeaders = buildCorsHeaders(req);
  if (!corsHeaders) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
