import { cookies as nextCookies } from "next/headers";
import crypto from "crypto";
import { User, Session } from "@/types/auth";

let cookiesFn = nextCookies;

/**
 * Utility to override cookies function for unit testing environments.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setCookiesMock(mockFn: any) {
  cookiesFn = mockFn;
}

export const SESSION_COOKIE_NAME = "seorchable_session";
const COOKIE_NAME = SESSION_COOKIE_NAME;
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const MIN_SECRET_LENGTH = 32;

/**
 * SESSION_SECRET resolution.
 *
 * A per-process random secret is unusable in any horizontally scaled or serverless
 * deployment: a cookie signed by one instance fails verification on every other
 * instance, producing random logouts. Therefore:
 *
 * - Runtime + production  -> SESSION_SECRET is MANDATORY. Missing or too short throws.
 * - Production build step -> an ephemeral secret is allowed so that `next build` page
 *   data collection can run without a real secret. Nothing signed during build is served.
 * - Development / test    -> falls back to an ephemeral secret with a loud warning.
 */
let cachedSecret: string | null = null;

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function resolveSessionSecret(): string {
  if (cachedSecret) {
    return cachedSecret;
  }

  const configured = process.env.SESSION_SECRET;

  if (configured && configured.length >= MIN_SECRET_LENGTH) {
    cachedSecret = configured;
    return cachedSecret;
  }

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !isBuildPhase()) {
    throw new Error(
      "Configuration error: SESSION_SECRET is required in production and must be at least " +
        `${MIN_SECRET_LENGTH} characters. Set it in the deployment environment before serving traffic.`
    );
  }

  if (configured && configured.length < MIN_SECRET_LENGTH) {
    console.warn(
      `[Auth] SESSION_SECRET is shorter than the required ${MIN_SECRET_LENGTH} characters. ` +
        "Using an ephemeral secret for this process. Sessions will not survive a restart."
    );
  } else {
    console.warn(
      "[Auth] SESSION_SECRET is not set. Using an ephemeral per-process secret. " +
        "Sessions will not survive a restart and will not validate across instances."
    );
  }

  cachedSecret = crypto.randomBytes(32).toString("hex");
  return cachedSecret;
}

/**
 * Asserts session configuration at boot / health-check time so a misconfigured
 * deployment fails fast instead of on the first user login.
 */
export function assertSessionConfiguration(): void {
  resolveSessionSecret();
}

interface SessionPayload {
  user: User;
  expiresAt: string;
}

export function signPayload(payloadStr: string): string {
  return crypto.createHmac("sha256", resolveSessionSecret()).update(payloadStr).digest("hex");
}

export function verifyPayload(payloadStr: string, signature: string): boolean {
  const expected = signPayload(payloadStr);
  if (signature.length !== expected.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Creates a cryptographically signed, integrity-protected server session and sets secure cookies.
 */
export async function createSession(user: User): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);
  const payload: SessionPayload = {
    user,
    expiresAt: expiresAt.toISOString(),
  };

  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr).toString("base64url");
  const signature = signPayload(payloadBase64);
  const cookieValue = `${payloadBase64}.${signature}`;

  const cookieStore = await cookiesFn();
  cookieStore.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });

  // Legacy convenience cookies. NOT authoritative on the server: every authorization
  // decision resolves identity from the signed session cookie above.
  cookieStore.set("tenant_id", user.workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
  cookieStore.set("user_id", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Pure verification of a raw session cookie value: signature integrity + expiry.
 * Contains no dependency on `next/headers`, so it can run anywhere a cookie string is
 * available -- Server Components/Actions/Route Handlers (via `getSession()` below) as
 * well as `src/middleware.ts`, which reads cookies off the raw `NextRequest` instead.
 *
 * Returns `null` on any malformed, unsigned, tampered, or expired cookie. Never throws.
 */
export function verifySessionCookieValue(cookieValue: string | undefined | null): Session | null {
  if (!cookieValue) {
    return null;
  }

  try {
    const parts = cookieValue.split(".");
    if (parts.length !== 2) {
      return null;
    }

    const [payloadBase64, signature] = parts;
    if (!verifyPayload(payloadBase64, signature)) {
      return null;
    }

    const payloadStr = Buffer.from(payloadBase64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr) as SessionPayload;

    if (new Date(payload.expiresAt) < new Date()) {
      return null; // Expired
    }

    return {
      user: payload.user,
      expiresAt: payload.expiresAt,
      status: "authenticated",
    };
  } catch {
    return null;
  }
}

/**
 * Parses and verifies the signed server session cookie, checking integrity and expiration.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookiesFn();
  const cookie = cookieStore.get(COOKIE_NAME);
  return verifySessionCookieValue(cookie?.value);
}

/**
 * Asserts that an active, valid session exists on the server, otherwise fails closed by throwing an error.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session || !session.user) {
    throw new Error("Unauthorized: Active session is missing, invalid or expired.");
  }
  return session;
}

/**
 * Helper to retrieve only the User entity from a validated session.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const session = await getSession();
  return session ? session.user : null;
}

/**
 * Invalidates the authoritative session on the server and expires the cookies.
 */
export async function invalidateSession(): Promise<void> {
  const cookieStore = await cookiesFn();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete("tenant_id");
  cookieStore.delete("user_id");
}
