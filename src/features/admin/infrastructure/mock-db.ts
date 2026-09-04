import { Tenant, AdminUser, FeatureFlag, AIProviderConfiguration, AuditRecord } from "../domain/types";

/**
 * Mock Administrative Database / Repository Store
 * Thread-safe simulated state storage with realistic enterprise SaaS mock data.
 */
export class AdminMockDatabase {
  private static instance: AdminMockDatabase;

  public tenants: Map<string, Tenant> = new Map();
  public adminUsers: Map<string, AdminUser> = new Map();
  public featureFlags: Map<string, FeatureFlag> = new Map();
  public aiProviders: Map<string, AIProviderConfiguration> = new Map();
  public auditRecords: AuditRecord[] = [];

  private constructor() {
    if (process.env.NODE_ENV === "test") this.seed();
  }

  public static getInstance(): AdminMockDatabase {
    if (process.env.NODE_ENV !== "test") {
      throw new Error("Admin in-memory persistence is disabled outside tests.");
    }
    if (!AdminMockDatabase.instance) {
      AdminMockDatabase.instance = new AdminMockDatabase();
    }
    return AdminMockDatabase.instance;
  }

  public clear(): void {
    this.tenants.clear();
    this.adminUsers.clear();
    this.featureFlags.clear();
    this.aiProviders.clear();
    this.auditRecords = [];
    this.seed();
  }

  private seed(): void {
    // 1. Seed Tenants
    const tenant1: Tenant = {
      id: "tenant-acme-uuid",
      name: "Acme Corp",
      slug: "acme",
      status: "active",
      configuration: {
        allowedIPRanges: ["0.0.0.0/0"],
        mfaRequired: true,
        ssoRequired: false,
        dataRetentionDays: 90,
        isIranMarketLocalised: false
      },
      quota: {
        maxUsers: 50,
        maxBrands: 5,
        maxPrompts: 100,
        maxObservationsPerMonth: 5000,
        maxCrawlJobsPerDay: 50,
        monthlyTokenLimit: 10000000,
        monthlyCostLimitUsd: 500,
        usedObservationsThisMonth: 1200,
        usedTokensThisMonth: 250000,
        usedCrawlJobsToday: 12
      },
      subscription: {
        plan: "growth",
        status: "active",
        billingCycle: "monthly",
        startDate: "2026-01-01T00:00:00Z",
        endDate: "2026-02-01T00:00:00Z",
        priceAmount: 149,
        currency: "USD"
      },
      audit: {
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-15T12:00:00Z",
        createdBy: "billing-service",
        updatedBy: "support-agent",
        version: 2
      }
    };

    const tenant2: Tenant = {
      id: "tenant-globex-uuid",
      name: "Globex Iran Branch",
      slug: "globex-fa",
      status: "active",
      configuration: {
        allowedIPRanges: ["185.0.0.0/8"],
        mfaRequired: true,
        ssoRequired: true,
        ssoProviderId: "sso-saml-globex",
        dataRetentionDays: 365,
        isIranMarketLocalised: true // Strategic Phase 1 localised
      },
      quota: {
        maxUsers: 250,
        maxBrands: 25,
        maxPrompts: 1000,
        maxObservationsPerMonth: 50000,
        maxCrawlJobsPerDay: 500,
        monthlyTokenLimit: 100000000,
        monthlyCostLimitUsd: 2500,
        usedObservationsThisMonth: 25600,
        usedTokensThisMonth: 14500000,
        usedCrawlJobsToday: 180
      },
      subscription: {
        plan: "enterprise",
        status: "active",
        billingCycle: "yearly",
        startDate: "2026-01-01T00:00:00Z",
        endDate: "2027-01-01T00:00:00Z",
        priceAmount: 12000,
        currency: "USD"
      },
      audit: {
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        createdBy: "super-admin",
        updatedBy: "super-admin",
        version: 1
      }
    };

    this.tenants.set(tenant1.id, tenant1);
    this.tenants.set(tenant2.id, tenant2);

    // 2. Seed Admin Users (Strict separation from regular customers)
    const admin1: AdminUser = {
      id: "admin-user-super",
      email: "super.admin@aeo-platform.internal",
      fullName: "Sarah Connor",
      role: "Super Admin",
      permissions: [
        "tenant:create", "tenant:write", "tenant:read", "tenant:suspend", "tenant:activate", "tenant:archive",
        "admin:write", "admin:read", "config:write", "config:read", "ai:manage", "ai:read", "audit:read",
        "billing:write", "billing:read", "prompt:manage", "crawler:manage", "system:monitor"
      ],
      isActive: true,
      audit: {
        createdAt: "2025-12-01T00:00:00Z",
        updatedAt: "2025-12-01T00:00:00Z",
        createdBy: "bootstrap",
        updatedBy: "bootstrap",
        version: 1
      }
    };

    const admin2: AdminUser = {
      id: "admin-user-support",
      email: "support.agent@aeo-platform.internal",
      fullName: "John Doe",
      role: "Support",
      permissions: ["tenant:read", "admin:read", "prompt:manage", "config:read"],
      isActive: true,
      audit: {
        createdAt: "2026-01-05T08:00:00Z",
        updatedAt: "2026-01-05T08:00:00Z",
        createdBy: "super-admin",
        updatedBy: "super-admin",
        version: 1
      }
    };

    this.adminUsers.set(admin1.id, admin1);
    this.adminUsers.set(admin2.id, admin2);

    // 3. Seed Feature Flags
    const flag1: FeatureFlag = {
      id: "flag-aeo-geo-iran",
      key: "phase-1-fa-optimized",
      name: "Persian Language Optimization",
      description: "Enables special crawling & localized prompt parsing for Persian LLM challenges",
      isEnabledGlobally: false,
      tenantOverrides: {
        "tenant-globex-uuid": true
      },
      audit: {
        createdAt: "2026-01-10T00:00:00Z",
        updatedAt: "2026-01-10T00:00:00Z",
        createdBy: "super-admin",
        updatedBy: "super-admin",
        version: 1
      }
    };

    const flag2: FeatureFlag = {
      id: "flag-auto-rec",
      key: "auto-recommendations-v4",
      name: "Auto-Recommendation Generator",
      description: "Generates high-precision recommendations using multi-stage analysis",
      isEnabledGlobally: true,
      tenantOverrides: {},
      audit: {
        createdAt: "2026-01-12T00:00:00Z",
        updatedAt: "2026-01-12T00:00:00Z",
        createdBy: "super-admin",
        updatedBy: "super-admin",
        version: 1
      }
    };

    this.featureFlags.set(flag1.key, flag1);
    this.featureFlags.set(flag2.key, flag2);

    // 4. Seed AI Providers
    const provider1: AIProviderConfiguration = {
      id: "ai-provider-openai",
      providerName: "OpenAI",
      endpointUrl: "https://api.openai.com/v1",
      apiKeyMasked: "sk-proj-...A1b2",
      isActive: true,
      models: [
        { modelId: "gpt-4o", name: "GPT-4o", inputTokenCostPerK: 0.005, outputTokenCostPerK: 0.015, latencyAvgMs: 820, isAvailable: true },
        { modelId: "gpt-4-turbo", name: "GPT-4 Turbo", inputTokenCostPerK: 0.01, outputTokenCostPerK: 0.03, latencyAvgMs: 1450, isAvailable: true }
      ],
      audit: {
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        createdBy: "system",
        updatedBy: "system",
        version: 1
      }
    };

    const provider2: AIProviderConfiguration = {
      id: "ai-provider-anthropic",
      providerName: "Anthropic",
      endpointUrl: "https://api.anthropic.com/v1",
      apiKeyMasked: "sk-ant-...XyZ9",
      isActive: true,
      models: [
        { modelId: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", inputTokenCostPerK: 0.003, outputTokenCostPerK: 0.015, latencyAvgMs: 980, isAvailable: true }
      ],
      audit: {
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        createdBy: "system",
        updatedBy: "system",
        version: 1
      }
    };

    this.aiProviders.set(provider1.id, provider1);
    this.aiProviders.set(provider2.id, provider2);
  }
}
