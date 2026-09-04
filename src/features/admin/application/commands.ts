import { UserRole, Permission, TenantQuota, AIModelConfiguration } from "../domain/types";

export interface CreateTenantCommand {
  name: string;
  slug: string;
  plan: "free" | "growth" | "enterprise";
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  ipAddress: string;
  userAgent: string;
}

export interface SuspendTenantCommand {
  tenantId: string;
  reason?: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  ipAddress: string;
  userAgent: string;
}

export interface ActivateTenantCommand {
  tenantId: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  ipAddress: string;
  userAgent: string;
}

export interface UpdateTenantQuotaCommand {
  tenantId: string;
  quota: Partial<TenantQuota>;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  ipAddress: string;
  userAgent: string;
}

export interface ChangeUserRoleCommand {
  userId: string;
  newRole: UserRole;
  permissions: Permission[];
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  ipAddress: string;
  userAgent: string;
}

export interface UpdateAIProviderConfigCommand {
  providerId: string;
  endpointUrl?: string;
  apiKeyMasked?: string;
  isActive?: boolean;
  models?: AIModelConfiguration[];
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  ipAddress: string;
  userAgent: string;
}

export interface EnableFeatureFlagCommand {
  flagKey: string;
  tenantIdOverride?: string; // If supplied, sets an override; else global
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  ipAddress: string;
  userAgent: string;
}

export interface DisableFeatureFlagCommand {
  flagKey: string;
  tenantIdOverride?: string; // If supplied, sets an override; else global
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  ipAddress: string;
  userAgent: string;
}
