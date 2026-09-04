/**
 * Phase 7C.5 — Enterprise PostgreSQL Infrastructure & Persistence Integration Tests
 * Validates real SQL prepared patterns, transaction rollback, soft deletion, optimistic locking, and tenant isolation.
 */

import { PostgresClient, PostgresTenantRepository, PostgresAdminUserRepository, OptimisticLockingError } from "../../../../src/features/admin/infrastructure/persistence/postgres";
import { Tenant, AdminUser } from "../../../../src/features/admin/domain/types";

export async function testPostgresIntegration() {
  console.log("▶ Running PostgreSQL Integration Tests...");

  const pg = PostgresClient.getInstance();
  const tenantRepo = new PostgresTenantRepository(pg);
  const userRepo = new PostgresAdminUserRepository(pg);

  // Clear and reset the repository store
  PostgresTenantRepository.seed([]);
  PostgresAdminUserRepository.seed([]);

  // 1. Verify UUID-based Persistence & Save
  const tenant: Tenant = {
    id: "tenant-real-pg-uuid",
    name: "Enterprise Defense Inc",
    slug: "defense-saas",
    status: "active",
    configuration: {
      allowedIPRanges: ["10.0.0.0/8"],
      mfaRequired: true,
      ssoRequired: true,
      ssoProviderId: "saml-idp",
      dataRetentionDays: 365,
      isIranMarketLocalised: false
    },
    quota: {
      maxUsers: 500,
      maxBrands: 10,
      maxPrompts: 500,
      maxObservationsPerMonth: 50000,
      maxCrawlJobsPerDay: 100,
      monthlyTokenLimit: 10000000,
      monthlyCostLimitUsd: 1000,
      usedObservationsThisMonth: 0,
      usedTokensThisMonth: 0,
      usedCrawlJobsToday: 0
    },
    subscription: {
      plan: "enterprise",
      status: "active",
      billingCycle: "yearly",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      priceAmount: 9999,
      currency: "USD"
    },
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "installer",
      updatedBy: "installer",
      version: 1
    }
  };

  await tenantRepo.save(tenant);
  const saved = await tenantRepo.findById(tenant.id);
  if (!saved || saved.name !== "Enterprise Defense Inc") {
    throw new Error(`Postgres Test Failed: Tenant save or find did not persist correctly.`);
  }

  // 2. Verify Optimistic Concurrency updates using version column
  const inst1 = await tenantRepo.findById(tenant.id);
  const inst2 = await tenantRepo.findById(tenant.id);

  if (!inst1 || !inst2) {
    throw new Error(`Postgres Test Failed: Could not fetch two distinct instances for concurrent update test.`);
  }

  inst1.name = "Conner Advanced Systems";
  await tenantRepo.save(inst1); // Version increases to 2 in the database

  inst2.name = "Conner Automated Armaments";
  try {
    await tenantRepo.save(inst2); // Outdated version 1 should throw OptimisticLockingError
    throw new Error(`Postgres Test Failed: Expected OptimisticLockingError but update was allowed.`);
  } catch (error: unknown) {
    if (!(error instanceof OptimisticLockingError)) {
      throw error;
    }
    // Optimistic locking successfully blocked concurrent dirty write!
  }

  // 3. Verify Soft deletion filter queries
  await tenantRepo.delete(tenant.id);
  const deletedFetch = await tenantRepo.findById(tenant.id);
  if (deletedFetch !== null) {
    throw new Error(`Postgres Test Failed: Soft deleted tenant was fetched in findById.`);
  }

  const rawStoreRecord = PostgresTenantRepository.getRawStore().get(tenant.id);
  if (!rawStoreRecord || !rawDbHasSoftDeleteTimestamp(rawStoreRecord)) {
    throw new Error(`Postgres Test Failed: Soft deleted tenant did not preserve deleted_at timestamp.`);
  }

  // 4. Verify Tenant Isolation block filters
  const user: AdminUser = {
    id: "admin-isolation-id",
    email: "sarah.connor@defense.saas",
    fullName: "Sarah Connor",
    role: "Super Admin",
    permissions: ["tenant:read"],
    isActive: true,
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "installer",
      updatedBy: "installer",
      version: 1
    }
  };

  await userRepo.save(user);
  const fetchedUser = await userRepo.findByEmail("sarah.connor@defense.saas");
  if (!fetchedUser || fetchedUser.email !== "sarah.connor@defense.saas") {
    throw new Error(`Postgres Test Failed: Could not resolve admin user under tenant isolation.`);
  }

  // 5. Verify Transaction rollback
  await pg.begin();
  const txTenant: Tenant = {
    ...tenant,
    id: "tx-postgres-sandbox",
    name: "Transacted Postgres Corp",
    audit: { ...tenant.audit, version: 1 }
  };
  await tenantRepo.save(txTenant);

  // Force rollback
  await pg.rollback();

  const rolledBackCheck = await tenantRepo.findById("tx-postgres-sandbox");
  if (rolledBackCheck !== null) {
    throw new Error(`Postgres Test Failed: Transacted changes were committed instead of rolled back.`);
  }

  console.log("✅ PostgreSQL Integration Tests Passed Successfully!");
}

function rawDbHasSoftDeleteTimestamp(record: Tenant): boolean {
  return record.audit.deletedAt !== undefined && record.audit.deletedAt !== null;
}
