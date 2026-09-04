/**
 * Phase 7C.5 — Enterprise Admin Domain Layer Tests
 */

import { Tenant, AdminUser, FeatureFlag } from "../../../src/features/admin/domain/types";
import { TenantAggregate, AdminUserAggregate, FeatureFlagAggregate } from "../../../src/features/admin/domain/entities";

export function testDomain() {
  console.log("▶ Running Admin Domain Layer Tests...");

  // 1. Test TenantAggregate
  const tenant: Tenant = {
    id: "test-tenant-1",
    name: "Aero Corp",
    slug: "aero",
    status: "suspended",
    configuration: {
      allowedIPRanges: ["0.0.0.0/0"],
      mfaRequired: true,
      ssoRequired: false,
      dataRetentionDays: 30,
      isIranMarketLocalised: false
    },
    quota: {
      maxUsers: 5,
      maxBrands: 1,
      maxPrompts: 10,
      maxObservationsPerMonth: 100,
      maxCrawlJobsPerDay: 5,
      monthlyTokenLimit: 10000,
      monthlyCostLimitUsd: 10,
      usedObservationsThisMonth: 0,
      usedTokensThisMonth: 0,
      usedCrawlJobsToday: 0
    },
    subscription: {
      plan: "free",
      status: "active",
      billingCycle: "monthly",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      priceAmount: 0,
      currency: "USD"
    },
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
      updatedBy: "system",
      version: 1
    }
  };

  const tenantAggregate = new TenantAggregate(tenant);

  // Test Activate
  tenantAggregate.activate();
  if (tenant.status !== "active") {
    throw new Error(`Domain Test Failed: Tenant status should be active, got ${tenant.status}`);
  }
  if (tenant.audit.version !== 2) {
    throw new Error(`Domain Test Failed: Tenant version should be 2, got ${tenant.audit.version}`);
  }

  // Test Usage Tracking
  tenantAggregate.trackUsage(1500, 45, 2);
  if (tenant.quota.usedTokensThisMonth !== 1500) {
    throw new Error(`Domain Test Failed: Used tokens should be 1500, got ${tenant.quota.usedTokensThisMonth}`);
  }
  if (tenant.quota.usedObservationsThisMonth !== 45) {
    throw new Error(`Domain Test Failed: Used observations should be 45, got ${tenant.quota.usedObservationsThisMonth}`);
  }

  // Test Over Quota Invariant
  if (tenantAggregate.isOverQuota()) {
    throw new Error(`Domain Test Failed: Tenant should not be over quota yet.`);
  }

  tenantAggregate.trackUsage(0, 80, 0); // Exceed maxObservationsPerMonth (100)
  if (!tenantAggregate.isOverQuota()) {
    throw new Error(`Domain Test Failed: Tenant should be flagged as over quota.`);
  }

  // 2. Test AdminUserAggregate
  const admin: AdminUser = {
    id: "test-admin-1",
    email: "test.admin@platform.internal",
    fullName: "John Connor",
    role: "Support",
    permissions: ["tenant:read"],
    isActive: true,
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
      updatedBy: "system",
      version: 1
    }
  };

  const adminAggregate = new AdminUserAggregate(admin);
  adminAggregate.changeRole("Platform Admin", ["tenant:write", "ai:manage"]);
  if (admin.role !== "Platform Admin") {
    throw new Error(`Domain Test Failed: Role should be Platform Admin`);
  }
  if (!admin.permissions.includes("ai:manage")) {
    throw new Error(`Domain Test Failed: New permissions list should contain ai:manage`);
  }

  adminAggregate.linkSSO("oidc", "external-user-123");
  if (!admin.ssoIdentities || admin.ssoIdentities[0].externalId !== "external-user-123") {
    throw new Error(`Domain Test Failed: SSO Identity external-user-123 should be linked`);
  }

  // 3. Test FeatureFlagAggregate
  const flag: FeatureFlag = {
    id: "test-flag-1",
    key: "advanced-geo-analytics",
    name: "Advanced GEO Engine",
    description: "Generates semantic benchmarking parameters",
    isEnabledGlobally: false,
    tenantOverrides: {},
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
      updatedBy: "system",
      version: 1
    }
  };

  const flagAggregate = new FeatureFlagAggregate(flag);
  if (flagAggregate.isEnabledForTenant("tenant-any")) {
    throw new Error(`Domain Test Failed: Flag should be disabled for tenant-any as it is disabled globally`);
  }

  flagAggregate.setTenantOverride("tenant-any", true);
  if (!flagAggregate.isEnabledForTenant("tenant-any")) {
    throw new Error(`Domain Test Failed: Flag should be enabled for tenant-any due to tenant override`);
  }

  flagAggregate.toggleGlobally(true);
  if (!flagAggregate.isEnabledForTenant("tenant-other")) {
    throw new Error(`Domain Test Failed: Flag should be enabled globally for other tenants`);
  }

  console.log("✅ Admin Domain Layer Tests Passed Successfully!");
}
