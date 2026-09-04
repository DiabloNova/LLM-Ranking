/**
 * Phase 7C.5 — Enterprise Admin CQRS Application Layer Tests
 */

import { AdminMockDatabase } from "../../../src/features/admin/infrastructure/mock-db";
import { ApplicationAdminCommandHandler, ApplicationAdminQueryHandler } from "../../../src/features/admin/application/handlers";
import {
  PostgresTenantRepository,
  PostgresAdminUserRepository,
  PostgresFeatureFlagRepository,
  PostgresAIProviderConfigurationRepository,
  PostgresAuditRecordRepository
} from "../../../src/features/admin/infrastructure/persistence/postgres";

export async function testCQRS() {
  console.log("▶ Running Admin CQRS Application Layer Tests...");

  const db = AdminMockDatabase.getInstance();
  db.clear(); // Reset database to clean seed state

  // Seed the real PostgreSQL repositories from the seed DB!
  PostgresTenantRepository.seed(Array.from(db.tenants.values()));
  PostgresAdminUserRepository.seed(Array.from(db.adminUsers.values()));
  PostgresFeatureFlagRepository.seed(Array.from(db.featureFlags.values()));
  PostgresAIProviderConfigurationRepository.seed(Array.from(db.aiProviders.values()));
  PostgresAuditRecordRepository.seed(db.auditRecords);

  const commandHandler = new ApplicationAdminCommandHandler();
  const queryHandler = new ApplicationAdminQueryHandler();

  // 1. Test CreateTenantCommand
  const createDto = await commandHandler.handleCreateTenant({
    name: "Cyberdyne Systems",
    slug: "cyberdyne",
    plan: "enterprise",
    actorId: "admin-user-super",
    actorEmail: "super.admin@aeo-platform.internal",
    actorRole: "Super Admin",
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0"
  });

  if (createDto.name !== "Cyberdyne Systems" || createDto.slug !== "cyberdyne") {
    throw new Error(`CQRS Test Failed: Created tenant name should be Cyberdyne Systems`);
  }
  if (createDto.plan !== "enterprise") {
    throw new Error(`CQRS Test Failed: Created plan should be enterprise`);
  }

  // 2. Test SuspendTenantCommand
  const suspendDto = await commandHandler.handleSuspendTenant({
    tenantId: createDto.id,
    reason: "Late billing payment",
    actorId: "admin-user-super",
    actorEmail: "super.admin@aeo-platform.internal",
    actorRole: "Super Admin",
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0"
  });

  if (suspendDto.status !== "suspended") {
    throw new Error(`CQRS Test Failed: Status should be suspended`);
  }

  // 3. Verify Audits were appended immutably
  const audits = await queryHandler.handleGetUserAuditHistory({
    actorId: "admin-user-super",
    targetTenantId: createDto.id
  });

  if (audits.length !== 2) {
    throw new Error(`CQRS Test Failed: There should be exactly 2 audit records for this tenant, got ${audits.length}`);
  }

  const createAudit = audits.find(a => a.action === "TENANT_CREATE");
  if (!createAudit || createAudit.status !== "success") {
    throw new Error(`CQRS Test Failed: Tenant creation audit not found or unsuccessful`);
  }

  const suspendAudit = audits.find(a => a.action === "TENANT_SUSPEND");
  if (!suspendAudit || suspendAudit.status !== "success") {
    throw new Error(`CQRS Test Failed: Tenant suspension audit not found or unsuccessful`);
  }

  // 4. Test UpdateTenantQuotaCommand
  const quotaDto = await commandHandler.handleUpdateTenantQuota({
    tenantId: createDto.id,
    quota: { maxUsers: 999 },
    actorId: "admin-user-super",
    actorEmail: "super.admin@aeo-platform.internal",
    actorRole: "Super Admin",
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0"
  });

  if (quotaDto.maxUsers !== 999) {
    throw new Error(`CQRS Test Failed: Max users quota should be updated to 999`);
  }

  // 5. Test ChangeUserRoleCommand
  const userDto = await commandHandler.handleChangeUserRole({
    userId: "admin-user-support",
    newRole: "Operations",
    permissions: ["config:write", "ai:manage"],
    actorId: "admin-user-super",
    actorEmail: "super.admin@aeo-platform.internal",
    actorRole: "Super Admin",
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0"
  });

  if (userDto.role !== "Operations") {
    throw new Error(`CQRS Test Failed: Role should be changed to Operations`);
  }

  // 6. Test EnableFeatureFlagCommand
  const flagDto = await commandHandler.handleEnableFeatureFlag({
    flagKey: "phase-1-fa-optimized",
    tenantIdOverride: "tenant-acme-uuid",
    actorId: "admin-user-super",
    actorEmail: "super.admin@aeo-platform.internal",
    actorRole: "Super Admin",
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0"
  });

  if (flagDto.tenantOverridesCount !== 2) { // Seed had 1, we added 1
    throw new Error(`CQRS Test Failed: Tenant overrides should be 2, got ${flagDto.tenantOverridesCount}`);
  }

  console.log("✅ Admin CQRS Application Layer Tests Passed Successfully!");
}
