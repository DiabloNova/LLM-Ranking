import { TenantStatus, UserRole, Permission } from "../domain/types";

export interface TenantDTO {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  plan: string;
  maxUsers: number;
  maxBrands: number;
  maxPrompts: number;
  maxObservationsPerMonth: number;
  usedObservationsThisMonth: number;
  usedTokensThisMonth: number;
  isIranMarketLocalised: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDTO {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  linkedSSOProviders: string[];
}

export interface AuditRecordDTO {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  status: string;
}

export interface FeatureFlagDTO {
  id: string;
  key: string;
  name: string;
  description: string;
  isEnabledGlobally: boolean;
  tenantOverridesCount: number;
}

export interface AIProviderDTO {
  id: string;
  providerName: string;
  endpointUrl: string;
  isActive: boolean;
  modelsCount: number;
}

export interface PlatformOverviewDTO {
  activeTenants: number;
  usersCount: number;
  aiRequestsCount: number;
  crawlerJobsCount: number;
  systemHealth: string;
  uptimeSeconds: number;
}

export interface SystemHealthDTO {
  status: "healthy" | "degraded" | "unhealthy";
  uptimeSeconds: number;
  dependencies: {
    database: "healthy" | "unhealthy";
    redisQueue: "healthy" | "unhealthy";
    elasticsearch: "healthy" | "unhealthy";
    s3Storage: "healthy" | "unhealthy";
  };
  workers: {
    activeCount: number;
    failedJobsCount: number;
    processingRatePerSec: number;
  };
}
