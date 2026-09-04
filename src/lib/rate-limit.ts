import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

/**
 * Distributed fixed-window rate limiter backed by Upstash Redis.
 *
 * Design decisions:
 * - FAIL CLOSED. These limits guard endpoints that spend real money (Firecrawl credits,
 *   LLM tokens, crawler compute). If the limiter cannot make a decision in production,
 *   the request is rejected with 503 rather than allowed through.
 * - In non-production environments, when Upstash is not configured, an in-process
 *   counter is used so local development still exercises the same code path. This
 *   fallback is explicitly gated on NODE_ENV !== "production" and is never used in
 *   a deployed production build.
 * - Anonymous endpoints are keyed by client IP, authenticated endpoints by tenant id.
 */

export type RateLimitScope = "ip" | "tenant";

export interface RateLimitRule {
  /** Stable identifier for the protected resource, e.g. "audit:free". */
  name: string;
  /** Maximum number of allowed requests inside the window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
  /** How the caller is identified. */
  scope: RateLimitScope;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  identifier: string;
}

export class RateLimitError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly result?: RateLimitResult
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

const isProduction = process.env.NODE_ENV === "production";

let redisClient: Redis | null = null;
let redisInitialised = false;

function getRedis(): Redis | null {
  if (redisInitialised) {
    return redisClient;
  }
  redisInitialised = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

/** Development-only in-process counter. Never reached in a production build. */
const localWindows = new Map<string, { count: number; expiresAt: number }>();

function consumeLocal(key: string, windowSeconds: number): { count: number; ttl: number } {
  const now = Date.now();
  const existing = localWindows.get(key);

  if (!existing || existing.expiresAt <= now) {
    const expiresAt = now + windowSeconds * 1000;
    localWindows.set(key, { count: 1, expiresAt });
    return { count: 1, ttl: windowSeconds };
  }

  existing.count += 1;
  return { count: existing.count, ttl: Math.ceil((existing.expiresAt - now) / 1000) };
}

/**
 * Resolves the caller IP from the standard proxy headers set by Vercel and
 * other reverse proxies. Returns null when no trustworthy value is present.
 */
export function resolveClientIp(req: NextRequest): string | null {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim() !== "") return realIp.trim();

  const vercelIp = req.headers.get("x-vercel-forwarded-for");
  if (vercelIp) {
    const first = vercelIp.split(",")[0]?.trim();
    if (first) return first;
  }

  return null;
}

/**
 * Applies a fixed-window rate limit and returns the decision.
 * Throws RateLimitError(503) when the limiter cannot reach a decision in production.
 */
export async function checkRateLimit(
  rule: RateLimitRule,
  identifier: string | null
): Promise<RateLimitResult> {
  if (!identifier || identifier.trim() === "") {
    throw new RateLimitError(
      400,
      `Rate limiting requires a ${rule.scope} identifier, none was resolvable for "${rule.name}".`
    );
  }

  const windowIndex = Math.floor(Date.now() / (rule.windowSeconds * 1000));
  const key = `ratelimit:${rule.name}:${rule.scope}:${identifier}:${windowIndex}`;

  const redis = getRedis();

  if (!redis) {
    if (isProduction) {
      throw new RateLimitError(
        503,
        "Rate limiting backend is not configured. Refusing to serve a metered endpoint without enforceable limits."
      );
    }

    const local = consumeLocal(key, rule.windowSeconds);
    return {
      allowed: local.count <= rule.limit,
      limit: rule.limit,
      remaining: Math.max(rule.limit - local.count, 0),
      resetSeconds: local.ttl,
      identifier,
    };
  }

  let count: number;
  try {
    count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, rule.windowSeconds);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown Redis error";
    console.error(`[RateLimit] Backend failure for rule "${rule.name}":`, message);
    throw new RateLimitError(
      503,
      "Rate limiting backend is unavailable. Request rejected to protect metered upstream services."
    );
  }

  return {
    allowed: count <= rule.limit,
    limit: rule.limit,
    remaining: Math.max(rule.limit - count, 0),
    resetSeconds: rule.windowSeconds,
    identifier,
  };
}

/** Standard rate-limit response headers, applied to both allowed and rejected responses. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetSeconds),
  };
}

/**
 * Convenience wrapper for API routes. Returns a ready-to-send 429 NextResponse when the
 * caller is over the limit, or the successful result (for header propagation) otherwise.
 */
export async function enforceRateLimit(
  rule: RateLimitRule,
  identifier: string | null
): Promise<{ rejection: NextResponse | null; result: RateLimitResult }> {
  const result = await checkRateLimit(rule, identifier);

  if (result.allowed) {
    return { rejection: null, result };
  }

  return {
    rejection: NextResponse.json(
      {
        error: "Too Many Requests",
        message: `Rate limit exceeded for "${rule.name}". Retry in ${result.resetSeconds} seconds.`,
      },
      { status: 429, headers: { ...rateLimitHeaders(result), "Retry-After": String(result.resetSeconds) } }
    ),
    result,
  };
}

/** Central rule registry so limits are auditable in one place. */
export const RATE_LIMIT_RULES = {
  auditFree: { name: "audit:free", limit: 5, windowSeconds: 3600, scope: "ip" } satisfies RateLimitRule,
  auditPremium: { name: "audit:premium", limit: 20, windowSeconds: 3600, scope: "tenant" } satisfies RateLimitRule,
  crawlerStart: { name: "crawler:start", limit: 10, windowSeconds: 3600, scope: "tenant" } satisfies RateLimitRule,
  ragQuery: { name: "rag:query", limit: 120, windowSeconds: 3600, scope: "tenant" } satisfies RateLimitRule,
  authLogin: { name: "auth:login", limit: 10, windowSeconds: 900, scope: "ip" } satisfies RateLimitRule,
} as const;
