import crypto from "node:crypto";
import { promisify } from "node:util";

/**
 * Credential hashing for the local email/password authentication path.
 *
 * Uses scrypt from Node's built-in crypto module. This is a deliberate choice:
 * scrypt is memory-hard, FIPS-adjacent, available on every Node runtime the app
 * targets, and requires no native build step or extra dependency (bcrypt/argon2
 * both add native compilation to the deploy pipeline).
 *
 * Stored format (single text column, self-describing so parameters can be raised later):
 *   scrypt$<N>$<r>$<p>$<keylen>$<saltBase64>$<hashBase64>
 */
const scrypt = promisify(crypto.scrypt) as (
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
  keylen: number,
  options: crypto.ScryptOptions
) => Promise<Buffer>;

const ALGORITHM = "scrypt";
const COST_N = 16384; // 2^14
const BLOCK_SIZE_R = 8;
const PARALLELISM_P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
// scrypt memory usage is roughly 128 * N * r bytes; raise maxmem to match the cost params.
const MAX_MEM = 256 * COST_N * BLOCK_SIZE_R;

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 200;

export interface PasswordPolicyResult {
  valid: boolean;
  /** Machine-readable reason codes; the UI layer maps these to localized copy. */
  violations: string[];
}

/**
 * Validates a candidate password against the repository password policy.
 * Returns reason codes rather than prose so both locales can render their own copy.
 */
export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  const violations: string[] = [];

  if (typeof password !== "string" || password.length === 0) {
    return { valid: false, violations: ["password_required"] };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    violations.push("password_too_short");
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    violations.push("password_too_long");
  }
  if (!/[a-z]/.test(password)) {
    violations.push("password_missing_lowercase");
  }
  if (!/[A-Z]/.test(password)) {
    violations.push("password_missing_uppercase");
  }
  if (!/[0-9]/.test(password)) {
    violations.push("password_missing_digit");
  }

  return { valid: violations.length === 0, violations };
}

/** Hashes a plaintext password into the self-describing storage format. */
export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("hashPassword requires a non-empty password.");
  }

  const salt = crypto.randomBytes(SALT_LENGTH);
  const derived = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N: COST_N,
    r: BLOCK_SIZE_R,
    p: PARALLELISM_P,
    maxmem: MAX_MEM,
  });

  return [
    ALGORITHM,
    COST_N,
    BLOCK_SIZE_R,
    PARALLELISM_P,
    KEY_LENGTH,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$");
}

/**
 * Verifies a plaintext password against a stored hash in constant time.
 * Returns false (never throws) for malformed or missing stored hashes, so callers
 * cannot distinguish "no credential on record" from "wrong password".
 */
export async function verifyPassword(password: string, storedHash: string | null | undefined): Promise<boolean> {
  if (!storedHash || typeof password !== "string" || password.length === 0) {
    return false;
  }

  const parts = storedHash.split("$");
  if (parts.length !== 7 || parts[0] !== ALGORITHM) {
    return false;
  }

  const [, nRaw, rRaw, pRaw, keyLenRaw, saltB64, hashB64] = parts;
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  const keylen = Number(keyLenRaw);

  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p) || !Number.isFinite(keylen)) {
    return false;
  }

  try {
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");

    if (expected.length !== keylen) {
      return false;
    }

    const derived = await scrypt(password.normalize("NFKC"), salt, keylen, {
      N,
      r,
      p,
      maxmem: Math.max(MAX_MEM, 256 * N * r),
    });

    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/**
 * Reports whether a stored hash was produced with weaker parameters than the current
 * policy, so it can be transparently upgraded on the next successful login.
 */
export function needsRehash(storedHash: string | null | undefined): boolean {
  if (!storedHash) return true;

  const parts = storedHash.split("$");
  if (parts.length !== 7 || parts[0] !== ALGORITHM) return true;

  return Number(parts[1]) < COST_N || Number(parts[2]) < BLOCK_SIZE_R || Number(parts[4]) < KEY_LENGTH;
}

/**
 * Constant-ish-time dummy verification used to equalise response timing when no user
 * record exists, preventing account enumeration through login latency.
 */
export async function performDummyVerification(): Promise<void> {
  await scrypt("dummy-password-for-timing-equalisation", crypto.randomBytes(SALT_LENGTH), KEY_LENGTH, {
    N: COST_N,
    r: BLOCK_SIZE_R,
    p: PARALLELISM_P,
    maxmem: MAX_MEM,
  });
}
