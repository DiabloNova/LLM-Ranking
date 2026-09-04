/**
 * Phase 7C.5 — Enterprise Admin Console & Platform Operations Layer
 * Dedicated Admin Bounded Context Domain Type Definitions
 */

export type TenantStatus = "active" | "suspended" | "archived";

export interface AuditMetadata {
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  updatedBy: string;
  deletedAt?: Date | string;
  version: number;
}

export interface TenantQuota {
  maxUsers: number;
  maxBrands: number;
  maxPrompts: number;
  maxObservationsPerMonth: number;
  maxCrawlJobsPerDay: number;
  monthlyTokenLimit: number;
  monthlyCostLimitUsd: number;
  usedObservationsThisMonth: number;
  usedTokensThisMonth: number;
  usedCrawlJobsToday: number;
}

export interface TenantSubscription {
  plan: "free" | "growth" | "enterprise";
  status: "active" | "past_due" | "canceled";
  billingCycle: "monthly" | "yearly";
  startDate: string;
  endDate: string;
  priceAmount: number;
  currency: string;
}

export interface TenantConfiguration {
  allowedIPRanges: string[];
  mfaRequired: boolean;
  ssoRequired: boolean;
  ssoProviderId?: string;
  dataRetentionDays: number;
  customDomain?: string;
  encryptionKeyId?: string;
  isIranMarketLocalised: boolean; // Strategic Phase 1 flag
}

/**
 * Tenant Aggregate Root
 */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  configuration: TenantConfiguration;
  quota: TenantQuota;
  subscription: TenantSubscription;
  audit: AuditMetadata;
}

/**
 * Hierarchical Admin Roles
 */
export type UserRole =
  | "Super Admin"
  | "Platform Admin"
  | "Operations"
  | "Support"
  | "Finance"
  | "Security Auditor"
  | "Read-Only Observer";

export type Permission =
  | "tenant:create"
  | "tenant:write"
  | "tenant:read"
  | "tenant:suspend"
  | "tenant:activate"
  | "tenant:archive"
  | "admin:write"
  | "admin:read"
  | "config:write"
  | "config:read"
  | "ai:manage"
  | "ai:read"
  | "audit:read"
  | "billing:write"
  | "billing:read"
  | "prompt:manage"
  | "crawler:manage"
  | "system:monitor";

export interface AccessPolicy {
  id: string;
  name: string;
  effect: "allow" | "deny";
  actions: string[];
  resources: string[];
  conditions?: Record<string, unknown>;
}

/**
 * AdminUser Aggregate Root (SSO Prepared)
 */
export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  ssoIdentities?: {
    provider: "saml" | "oidc" | "google" | "azure";
    externalId: string;
    linkedAt: string;
  }[];
  audit: AuditMetadata;
}

/**
 * Feature Flag with Tenant Overrides
 */
export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  isEnabledGlobally: boolean;
  tenantOverrides: Record<string, boolean>; // tenantId -> isEnabled
  percentageRollout?: number; // 0 to 100
  audit: AuditMetadata;
}

export interface SystemConfiguration {
  id: string;
  key: string;
  value: string;
  category: "network" | "storage" | "security" | "compliance" | "general";
  isEncrypted: boolean;
  audit: AuditMetadata;
}

export interface IntegrationConfiguration {
  id: string;
  provider: string; // e.g., "Slack", "PagerDuty", "ElasticSearch"
  type: "webhook" | "oauth" | "api_key";
  endpointUrl?: string;
  apiKeyMasked?: string;
  isEnabled: boolean;
  audit: AuditMetadata;
}

/**
 * AI Operations Types
 */
export interface AIModelConfiguration {
  modelId: string;
  name: string;
  inputTokenCostPerK: number;
  outputTokenCostPerK: number;
  latencyAvgMs: number;
  isAvailable: boolean;
}

export interface AIProviderConfiguration {
  id: string;
  providerName: "OpenAI" | "Anthropic" | "Gemini" | "Local Models" | string;
  endpointUrl: string;
  apiKeyMasked: string;
  models: AIModelConfiguration[];
  isActive: boolean;
  failoverProviderId?: string;
  audit: AuditMetadata;
}

export interface AIUsagePolicy {
  id: string;
  tenantId?: string; // Empty means global default
  maxDailyTokens: number;
  maxDailyCostUsd: number;
  allowedModels: string[];
  rateLimitPerMin: number;
  audit: AuditMetadata;
}

/**
 * Audit System Types
 */
export interface AuditRecord {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string; // e.g., "TENANT_SUSPEND", "FEATURE_FLAG_CHANGE"
  resourceType: "tenant" | "user" | "ai_provider" | "feature_flag" | "system";
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  payloadBefore?: string; // JSON Stringified
  payloadAfter?: string; // JSON Stringified
  status: "success" | "denied" | "error";
  errorDetails?: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: "MFA_BYPASS_ATTEMPT" | "CROSS_TENANT_ACCESS_VIOLATION" | "UNAUTHORIZED_ADMIN_ACTION" | "BRUTE_FORCE_DETECTED";
  severity: "low" | "medium" | "high" | "critical";
  actorId?: string;
  ipAddress: string;
  details: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AdministrativeAction {
  id: string;
  timestamp: string;
  category: "provisioning" | "billing" | "security_override" | "maintenance";
  description: string;
  performedBy: string;
}
