/**
 * Phase 7C.1 — AI Visibility Intelligence Engine
 * Enterprise SaaS Security & Access Control Specifications
 */

export type UserRole = "SuperAdmin" | "WorkspaceAdmin" | "Viewer";

export interface SecurityActor {
  id: string;
  organizationId: string; // The tenant they represent
  role: UserRole;
  permissions: string[];
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  organizationId: string;
  action: string; // e.g. "BRAND_CREATE", "OBSERVATION_INGEST"
  resourceId: string; // Target aggregate ID
  ipAddress?: string;
  status: "success" | "denied" | "error";
  details?: string;
}

export class TenantSecurityGuard {
  /**
   * Enforces that the actor's tenant context matches the target resource's tenant scope
   */
  public static authorizeTenant(actor: SecurityActor, targetOrganizationId: string): void {
    if (actor.role === "SuperAdmin") return; // SuperAdmins bypass tenant checks

    if (actor.organizationId !== targetOrganizationId) {
      throw new Error(`Security Exception: Access Denied. Cross-tenant leakage blocked for actor ${actor.id}.`);
    }
  }

  /**
   * Enforces Role-Based Access Control (RBAC) permission checks on standard use-cases
   */
  public static authorizePermission(actor: SecurityActor, requiredPermission: string): void {
    if (actor.role === "SuperAdmin") return;

    const rolePermissions: Partial<Record<UserRole, string[]>> = {
      WorkspaceAdmin: [
        "brand:create", "brand:write", "brand:read",
        "entity:create", "entity:write", "entity:read",
        "observation:create", "observation:write", "observation:read",
        "score:create", "score:write", "score:read",
        "recommendation:write", "recommendation:read"
      ],
      Viewer: [
        "brand:read", "entity:read", "observation:read", "score:read", "recommendation:read"
      ]
    };

    const hasPermission = rolePermissions[actor.role]?.includes(requiredPermission) || actor.permissions.includes(requiredPermission);
    if (!hasPermission) {
      throw new Error(`Security Exception: Actor ${actor.id} lacks required permission: "${requiredPermission}".`);
    }
  }
}

export class SensitiveDataProtector {
  /**
   * Masks sensitive credentials or tokens in scraper response logs or API payloads
   */
  public static maskSecret(text: string): string {
    if (!text) return "";
    // Mask basic API keys and bearer tokens found in logs/responseText
    return text.replace(/(Bearer\s+)[A-Za-z0-9-_=.]{10,}/g, "$1[REDACTED]")
               .replace(/(api_key\s*=\s*['"]?)[A-Za-z0-9-_]{10,}/g, "$1[REDACTED]");
  }
}
