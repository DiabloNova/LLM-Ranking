/**
 * Phase 7C.5 — Enterprise Admin Security & Access Control Specifications
 * Implements strict Administrative separation, Hierarchical RBAC, Least Privilege, and Masking.
 */

import { UserRole, Permission, AccessPolicy, AdminUser } from "../domain/types";

/**
 * Strict Hierarchy Definition for Administrative Roles
 * Higher ranks inherit or supersede permissions of lower ranks where applicable.
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  "Super Admin": 100,
  "Platform Admin": 80,
  "Security Auditor": 70,
  "Operations": 60,
  "Finance": 50,
  "Support": 40,
  "Read-Only Observer": 10
};

/**
 * Role-Based Access Control Permission Map
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  "Super Admin": [
    "tenant:create", "tenant:write", "tenant:read", "tenant:suspend", "tenant:activate", "tenant:archive",
    "admin:write", "admin:read", "config:write", "config:read", "ai:manage", "ai:read", "audit:read",
    "billing:write", "billing:read", "prompt:manage", "crawler:manage", "system:monitor"
  ],
  "Platform Admin": [
    "tenant:create", "tenant:write", "tenant:read", "tenant:suspend", "tenant:activate",
    "admin:read", "config:write", "config:read", "ai:manage", "ai:read", "audit:read",
    "billing:read", "prompt:manage", "crawler:manage", "system:monitor"
  ],
  "Security Auditor": [
    "tenant:read", "admin:read", "config:read", "ai:read", "audit:read", "system:monitor"
  ],
  "Operations": [
    "tenant:read", "config:write", "config:read", "ai:manage", "ai:read",
    "prompt:manage", "crawler:manage", "system:monitor"
  ],
  "Finance": [
    "tenant:read", "billing:write", "billing:read", "config:read"
  ],
  "Support": [
    "tenant:read", "config:read", "prompt:manage"
  ],
  "Read-Only Observer": [
    "tenant:read", "config:read", "ai:read"
  ]
};

export class RoleHierarchyResolver {
  /**
   * Returns true if roleA is equal to or higher in authority than roleB
   */
  public static isStrongerOrEqual(roleA: UserRole, roleB: UserRole): boolean {
    return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
  }

  /**
   * Resolves the full inherited permission set of a role
   */
  public static getPermissionsForRole(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }
}

export class PermissionChecker {
  /**
   * Checks whether a specific role has the required permission
   */
  public static hasPermission(role: UserRole, requiredPermission: Permission): boolean {
    const permissions = RoleHierarchyResolver.getPermissionsForRole(role);
    return permissions.includes(requiredPermission);
  }

  /**
   * Verifies that the user object is an authorized administrator and has the required permission
   */
  public static checkUser(user: AdminUser, requiredPermission: Permission): void {
    if (!user.isActive) {
      throw new Error(`Security Exception: Administrative user ${user.email} is inactive.`);
    }

    const hasPerm = this.hasPermission(user.role, requiredPermission) || user.permissions.includes(requiredPermission);
    if (!hasPerm) {
      throw new Error(`Security Exception: Administrative user lacks required privilege: "${requiredPermission}".`);
    }
  }
}

export class SecurityPolicyEvaluator {
  /**
   * Evaluates custom policy blocks against resource context
   */
  public static evaluatePolicy(policy: AccessPolicy, action: string, resource: string): boolean {
    const actionMatch = policy.actions.includes("*") || policy.actions.includes(action);
    const resourceMatch = policy.resources.includes("*") || policy.resources.includes(resource);

    if (actionMatch && resourceMatch) {
      return policy.effect === "allow";
    }

    return false;
  }
}

export class AdminAuthorizationGuard {
  /**
   * Enforces 100% separation between administrative users and standard workspace/customer users.
   */
  public static enforceAdminSeparation(actorRole: string): void {
    const validAdminRoles = Object.keys(ROLE_HIERARCHY);
    if (!validAdminRoles.includes(actorRole)) {
      throw new Error(`Security Exception: Access Denied. Role "${actorRole}" is not a recognized Administrative Role.`);
    }
  }

  /**
   * Mask sensitive configuration keys or API tokens
   */
  public static maskSensitiveValue(key: string, value: string): string {
    if (!value) return "";
    const lowercaseKey = key.toLowerCase();
    if (
      lowercaseKey.includes("key") ||
      lowercaseKey.includes("secret") ||
      lowercaseKey.includes("token") ||
      lowercaseKey.includes("password")
    ) {
      if (value.length <= 8) return "[REDACTED]";
      return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
    }
    return value;
  }
}
