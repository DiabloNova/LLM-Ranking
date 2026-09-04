"use server";

import { User, Session, UserRole } from "@/types/auth";
import { createSession, invalidateSession, getSession } from "@/services/auth/session";
import { TenantContextManager } from "@/core/database/tenant-context";
import { randomUUID } from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import {
  hashPassword,
  verifyPassword,
  needsRehash,
  performDummyVerification,
  validatePasswordPolicy,
} from "@/lib/password";

/**
 * Generic authentication failure message.
 * Intentionally identical for "no such user" and "wrong password" so the endpoint
 * cannot be used to enumerate registered email addresses.
 */
const INVALID_CREDENTIALS = "Invalid credentials.";

interface UserCredentialRow {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
}

/**
 * Authenticates a user with an email + password pair, resolves identity and workspace
 * strictly on the server, then establishes a signed session.
 *
 * Security properties:
 * - The password is verified against `users.password_hash` before any session is issued.
 * - Failure responses are indistinguishable between unknown user and wrong password.
 * - Timing is equalised with a dummy scrypt derivation when no user record exists.
 * - Hashes stored with weaker parameters are transparently upgraded on success.
 */
export async function loginAction(email: string, password: string): Promise<User> {
  if (typeof email !== "string" || email.trim() === "" || typeof password !== "string" || password === "") {
    throw new Error(INVALID_CREDENTIALS);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const result = await TenantContextManager.runWithSystemContext(null, "sys-login", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) {
      throw new Error("Failed to get DB client in system context");
    }

    const { rows: userRows } = await client.query(
      "SELECT id, name, email, password_hash FROM users WHERE lower(email) = $1 AND deleted_at IS NULL",
      [normalizedEmail]
    );
    const userRecord = userRows[0] as UserCredentialRow | undefined;

    if (!userRecord) {
      // Equalise response timing so a missing account is not detectable by latency.
      await performDummyVerification();
      throw new Error(INVALID_CREDENTIALS);
    }

    const passwordMatches = await verifyPassword(password, userRecord.password_hash);
    if (!passwordMatches) {
      throw new Error(INVALID_CREDENTIALS);
    }

    const { rows: memberRows } = await client.query(
      `
        SELECT m.organization_id as "workspaceId", m.role, o.name as "workspaceName"
        FROM organization_members m
        JOIN organizations o ON m.organization_id = o.id
        WHERE m.user_id = $1 AND o.deleted_at IS NULL
        LIMIT 1
      `,
      [userRecord.id]
    );

    const memberRecord = memberRows[0];
    if (!memberRecord) {
      throw new Error("User does not belong to any active workspace.");
    }

    // Transparent hash upgrade when the stored parameters are below current policy.
    if (needsRehash(userRecord.password_hash)) {
      const upgraded = await hashPassword(password);
      await client.query(
        "UPDATE users SET password_hash = $1, password_updated_at = NOW(), updated_at = NOW() WHERE id = $2",
        [upgraded, userRecord.id]
      );
    }

    return {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: memberRecord.role as UserRole,
      workspaceId: memberRecord.workspaceId,
    };
  });

  await createSession(result);
  return result;
}

/**
 * Registers a new user with a hashed credential, provisions their workspace,
 * and establishes a signed session.
 *
 * The password policy is enforced server-side; the client-side check is advisory only.
 */
export async function registerAction(name: string, email: string, password: string): Promise<User> {
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("A display name is required.");
  }
  if (typeof email !== "string" || email.trim() === "") {
    throw new Error("A valid email address is required.");
  }

  const policy = validatePasswordPolicy(password);
  if (!policy.valid) {
    // Reason codes are returned so the UI can render localized copy per violation.
    throw new Error(`Password policy violation: ${policy.violations.join(", ")}`);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const displayName = name.trim();
  const passwordHash = await hashPassword(password);

  const result = await TenantContextManager.runWithSystemContext(null, "sys-register", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) {
      throw new Error("Failed to get DB client in system context");
    }

    const { rows: existingUser } = await client.query("SELECT id FROM users WHERE lower(email) = $1", [
      normalizedEmail,
    ]);
    if (existingUser.length > 0) {
      throw new Error("An account with this email address already exists.");
    }

    const userId = `usr-${randomUUID().slice(0, 8)}`;

    await client.query(
      "INSERT INTO users (id, name, email, password_hash, password_updated_at) VALUES ($1, $2, $3, $4, NOW())",
      [userId, displayName, normalizedEmail, passwordHash]
    );

    const orgId = randomUUID();
    const orgSlug = `${displayName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${randomUUID().slice(0, 4)}`;
    const orgName = `${displayName}'s Workspace`;

    await client.query("INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3)", [orgId, orgName, orgSlug]);

    await client.query(
      "INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)",
      [orgId, userId, "workspace_admin"]
    );

    return {
      id: userId,
      name: displayName,
      email: normalizedEmail,
      role: "workspace_admin" as UserRole,
      workspaceId: orgId,
    };
  });

  // Email verification link. NOTE: the token below is not yet persisted; the
  // /verify-email consumer therefore cannot validate it. Persisting verification
  // tokens is tracked as a separate task and must be completed before email
  // verification can be treated as a security control.
  const verificationToken = randomUUID();
  const verificationLink = `https://app.seorchable.com/verify-email?token=${verificationToken}`;

  sendVerificationEmail(normalizedEmail, displayName, verificationLink).catch((err) => {
    console.error("Failed to send verification email:", err);
  });

  await createSession(result);
  return result;
}

/**
 * Requests a password reset and sends a reset email.
 *
 * IMPORTANT LIMITATION: the generated token is not persisted, so no reset-consumption
 * endpoint can validate it. This action currently only proves the email pipeline works.
 * A `password_reset_tokens` table plus a consuming action are required before this
 * flow can actually reset a credential. Tracked as a separate task.
 *
 * The response is intentionally uniform so it cannot be used to enumerate accounts.
 */
export async function requestPasswordResetAction(email: string): Promise<void> {
  if (typeof email !== "string" || email.trim() === "") {
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  await TenantContextManager.runWithSystemContext(null, "sys-password-reset", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) {
      throw new Error("Failed to get DB client in system context");
    }

    const { rows: userRows } = await client.query(
      "SELECT id FROM users WHERE lower(email) = $1 AND deleted_at IS NULL",
      [normalizedEmail]
    );

    if (userRows.length === 0) {
      return;
    }

    const resetToken = randomUUID();
    const resetLink = `https://app.seorchable.com/reset-password?token=${resetToken}`;

    sendPasswordResetEmail(normalizedEmail, resetLink).catch((err) => {
      console.error("Failed to send password reset email:", err);
    });
  });
}

/**
 * Clears secure cookies and invalidates the session on logout.
 */
export async function logoutAction() {
  await invalidateSession();
}

/**
 * Securely verifies and returns the current server-validated session state for client synchronization.
 */
export async function getServerSessionAction(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    return { user: null, expiresAt: null, status: "unauthenticated" };
  }
  return session;
}
