import { siteConfig } from "@/config/site";

/**
 * Centralised security header policy, applied to every response via `next.config.ts`.
 *
 * Kept as plain data (not inline in `next.config.ts`) so the policy is unit-testable
 * and reusable from anywhere that needs to reason about it (e.g. a future CSP report
 * endpoint).
 */

function buildConnectSrc(): string {
  // `self` covers same-origin API routes and Server Actions. External hosts the client
  // genuinely calls over HTTPS are added explicitly rather than left wide open.
  const hosts = ["'self'", "https://vitals.vercel-insights.com"];

  let siteOrigin: string | null = null;
  try {
    siteOrigin = new URL(siteConfig.url).origin;
  } catch {
    siteOrigin = null;
  }
  if (siteOrigin) {
    hosts.push(siteOrigin);
  }

  return hosts.join(" ");
}

/**
 * Content-Security-Policy directives.
 *
 * `script-src` allows `'unsafe-inline'` for Next.js's inline bootstrap/hydration script
 * and `'unsafe-eval'` is deliberately NOT included. Tighten `script-src` to a nonce or
 * hash-based policy once the inline-script surface is audited; that is tracked
 * separately and must not block shipping the other directives now.
 */
function buildContentSecurityPolicy(): string {
  const directives: Record<string, string> = {
    "default-src": "'self'",
    "script-src": "'self' 'unsafe-inline' https://vercel.live",
    "style-src": "'self' 'unsafe-inline'",
    "img-src": "'self' data: blob: https:",
    "font-src": "'self' data:",
    "connect-src": buildConnectSrc(),
    "frame-ancestors": "'none'",
    "base-uri": "'self'",
    "form-action": "'self'",
    "object-src": "'none'",
    "upgrade-insecure-requests": "",
  };

  return Object.entries(directives)
    .map(([key, value]) => (value ? `${key} ${value}` : key))
    .join("; ");
}

export interface SecurityHeader {
  key: string;
  value: string;
}

/**
 * Returns the full set of security headers to attach to every response.
 * HSTS is only meaningful (and only sent) once the app is actually served over HTTPS in
 * production; sending it in local HTTP development would be actively misleading.
 */
export function getSecurityHeaders(): SecurityHeader[] {
  const isProduction = process.env.NODE_ENV === "production";

  const headers: SecurityHeader[] = [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
  ];

  if (isProduction) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}
