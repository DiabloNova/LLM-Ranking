import { Tenant, AdminUser, AuditRecord, FeatureFlag, AIProviderConfiguration } from "../domain/types";
import { TenantDTO, AdminUserDTO, AuditRecordDTO, FeatureFlagDTO, AIProviderDTO } from "./dto";

export const AdminDTOMappers = {
  tenantToDTO(tenant: Tenant): TenantDTO {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      plan: tenant.subscription.plan,
      maxUsers: tenant.quota.maxUsers,
      maxBrands: tenant.quota.maxBrands,
      maxPrompts: tenant.quota.maxPrompts,
      maxObservationsPerMonth: tenant.quota.maxObservationsPerMonth,
      usedObservationsThisMonth: tenant.quota.usedObservationsThisMonth,
      usedTokensThisMonth: tenant.quota.usedTokensThisMonth,
      isIranMarketLocalised: tenant.configuration.isIranMarketLocalised,
      createdAt: typeof tenant.audit.createdAt === "string" ? tenant.audit.createdAt : tenant.audit.createdAt.toISOString(),
      updatedAt: typeof tenant.audit.updatedAt === "string" ? tenant.audit.updatedAt : tenant.audit.updatedAt.toISOString()
    };
  },

  adminUserToDTO(user: AdminUser): AdminUserDTO {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      linkedSSOProviders: user.ssoIdentities?.map(i => i.provider) || []
    };
  },

  auditRecordToDTO(record: AuditRecord): AuditRecordDTO {
    return {
      id: record.id,
      timestamp: record.timestamp,
      actorEmail: record.actorEmail,
      actorRole: record.actorRole,
      action: record.action,
      resourceType: record.resourceType,
      resourceId: record.resourceId,
      ipAddress: record.ipAddress,
      status: record.status
    };
  },

  featureFlagToDTO(flag: FeatureFlag): FeatureFlagDTO {
    return {
      id: flag.id,
      key: flag.key,
      name: flag.name,
      description: flag.description,
      isEnabledGlobally: flag.isEnabledGlobally,
      tenantOverridesCount: Object.keys(flag.tenantOverrides).length
    };
  },

  aiProviderToDTO(provider: AIProviderConfiguration): AIProviderDTO {
    return {
      id: provider.id,
      providerName: provider.providerName,
      endpointUrl: provider.endpointUrl,
      isActive: provider.isActive,
      modelsCount: provider.models.length
    };
  }
};
