import { NextRequest } from "next/server";
import { requireSession, getSession } from "./session";
import { UserRole } from "@/types/auth";
import { TenantContextManager } from "@/core/database/tenant-context";
import { ApiService } from "@/features/public-api/services/api-service";

const apiService = new ApiService();

export class AuthorizationError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Asserts that the authenticated user has workspace membership access for the target workspaceId.
 * - A super_admin can access any workspace.
 * - Otherwise, queries the database authoritatively to verify that the user is a member of the given workspace.
 * - This prevents any cross-tenant workspace membership bypass.
 */
export async function requireWorkspaceMembership(userId: string, workspaceId: string): Promise<void> {
  const session = await requireSession();

  if (!session.user) {
    throw new AuthorizationError(401, "Unauthorized: No active session user.");
  }

  if (session.user!.id !== userId) {
      throw new AuthorizationError(403, "Forbidden: User ID mismatch.");
  }

  // A super_admin has access to all tenants/workspaces
  if (session.user.role === "super_admin") {
    return;
  }

  // Authoritatively verify membership against the database using system context
  const hasAccess = await TenantContextManager.runWithSystemContext(session.user!.id, "sys-auth-check", async () => {
      const client = TenantContextManager.getDbClient();
      if (!client) {
          throw new Error("Failed to get DB client in system context");
      }
      const { rows } = await client.query(
          "SELECT 1 FROM organization_members m JOIN organizations o ON m.organization_id = o.id WHERE m.user_id = $1 AND m.organization_id = $2 AND o.deleted_at IS NULL",
          [userId, workspaceId]
      );
      return rows.length > 0;
  });

  if (!hasAccess) {
    throw new AuthorizationError(403, "Forbidden: User is not a member of the requested workspace.");
  }
}

/**
 * Enforces RBAC permissions on the server.
 * Maps required roles to a hierarchy where:
 * - super_admin = 3
 * - workspace_admin = 2
 * - viewer = 1
 */
export async function requireRole(requiredRole: UserRole, targetWorkspaceId?: string): Promise<void> {
  const session = await requireSession();
  if (!session.user) {
    throw new AuthorizationError(401, "Unauthorized: No active session user.");
  }

  let activeRole = session.user.role;

  // If a specific workspace is targeted, authoritatively fetch their role in that workspace
  if (targetWorkspaceId && session.user.role !== "super_admin") {
      const role = await TenantContextManager.runWithSystemContext(session.user!.id, "sys-auth-role-check", async () => {
          const client = TenantContextManager.getDbClient();
          if (!client) {
              throw new Error("Failed to get DB client in system context");
          }
          const { rows } = await client.query(
              "SELECT m.role FROM organization_members m JOIN organizations o ON m.organization_id = o.id WHERE m.user_id = $1 AND m.organization_id = $2 AND o.deleted_at IS NULL",
              [session.user!.id, targetWorkspaceId]
          );
          return rows.length > 0 ? rows[0].role : null;
      });

      if (!role) {
          throw new AuthorizationError(403, "Forbidden: User is not a member of the requested workspace.");
      }
      activeRole = role as UserRole;
  }

  const roleHierarchy: Record<UserRole, number> = {
    super_admin: 3,
    workspace_admin: 2,
    viewer: 1,
  };

  const userRoleValue = roleHierarchy[activeRole] || 0;
  const requiredRoleValue = roleHierarchy[requiredRole] || 0;

  if (userRoleValue < requiredRoleValue) {
    throw new AuthorizationError(403, `Forbidden: Insufficient privileges. Required role: "${requiredRole}".`);
  }
}

/**
 * Validates and resolves the authoritative user and tenant identity for internal
 * `/api/v1/*` route handlers.
 *
 * Identity is resolved from exactly two sources, in order:
 * 1. The signed, HMAC-verified server session cookie (browser/dashboard callers).
 * 2. A hashed API key presented as `Authorization: Bearer seo_<secret>` (server-to-server
 *    / developer integrations), verified against `api_keys` via `ApiService.authenticateKey`.
 *
 * Client-supplied `x-user-id` / `x-tenant-id` headers are NEVER accepted as identity.
 * A previous version of this function trusted those headers outright (only checking that
 * *some* user happened to belong to *some* workspace, with no proof the caller actually
 * controls that user's account) which let anyone who knew or guessed a valid user/tenant
 * ID pair impersonate that user against every route that calls this function. There is no
 * secure way to "harden" a bare client-asserted identity header, so the header path is
 * removed rather than patched.
 */
export async function authorizeApiRequest(req: NextRequest): Promise<{ userId: string; tenantId: string }> {
  const session = await getSession();

  if (session && session.user) {
    return {
      userId: session.user!.id,
      tenantId: session.user.workspaceId
    };
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    throw new AuthorizationError(
      401,
      "Unauthorized: a valid session or an 'Authorization: Bearer <API_KEY>' header is required."
    );
  }

  const token = authHeader.slice(7).trim();
  if (token === "") {
    throw new AuthorizationError(401, "Unauthorized: empty bearer token.");
  }

  const apiKey = await apiService.authenticateKey(token);
  if (!apiKey) {
    throw new AuthorizationError(401, "Unauthorized: invalid, revoked, or expired API key.");
  }

  return {
    // The API key's creator is the acting identity for audit / created-by fields.
    userId: apiKey.createdBy,
    tenantId: apiKey.organizationId
  };
}
