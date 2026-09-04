/**
 * Phase 7C.5 — Enterprise Admin Infrastructure & Persistence Integration Tests
 */

import { UnitOfWork } from "../../../../src/features/admin/infrastructure/persistence/uow";
import { PostgresTenantRepository, PostgresClient, OptimisticLockingError } from "../../../../src/features/admin/infrastructure/persistence/postgres";
import { Tenant } from "../../../../src/features/admin/domain/types";
import { coreEventBus } from "../../../../src/core/events";

export async function testInfrastructure() {
  console.log("▶ Running Administrative Infrastructure Integration Tests...");

  const pg = PostgresClient.getInstance();
  const uow = new UnitOfWork(pg);
  const tenantRepo = new PostgresTenantRepository(pg, uow);

  // Reset the static store
  PostgresTenantRepository.seed([]);

  // 1. Test Base Persistence (Save and Find)
  const tenant: Tenant = {
    id: "tenant-conner-uuid",
    name: "Conner Defense",
    slug: "conner-def",
    status: "active",
    configuration: {
      allowedIPRanges: ["127.0.0.1/32"],
      mfaRequired: true,
      ssoRequired: false,
      dataRetentionDays: 180,
      isIranMarketLocalised: false
    },
    quota: {
      maxUsers: 10,
      maxBrands: 3,
      maxPrompts: 30,
      maxObservationsPerMonth: 2000,
      maxCrawlJobsPerDay: 20,
      monthlyTokenLimit: 2000000,
      monthlyCostLimitUsd: 200,
      usedObservationsThisMonth: 0,
      usedTokensThisMonth: 0,
      usedCrawlJobsToday: 0
    },
    subscription: {
      plan: "growth",
      status: "active",
      billingCycle: "monthly",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      priceAmount: 149,
      currency: "USD"
    },
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "integration-test",
      updatedBy: "integration-test",
      version: 1
    }
  };

  // Save entity
  await tenantRepo.save(tenant);

  const found = await tenantRepo.findById(tenant.id);
  if (!found || found.name !== "Conner Defense") {
    throw new Error(`Integration Test Failed: Repository save or find did not persist entity correctly.`);
  }

  // 2. Test Optimistic Concurrency Locking
  const copy1 = { ...found, audit: { ...found.audit } };
  const copy2 = { ...found, audit: { ...found.audit } };

  // Modify copy 1 and save
  copy1.name = "Conner Security Group";
  await tenantRepo.save(copy1); // Version increments to 2

  // Modify copy 2 (with outdated version 1) and attempt to save
  copy2.name = "Conner Advanced Robotics";
  try {
    await tenantRepo.save(copy2);
    throw new Error(`Integration Test Failed: Outdated version should have thrown OptimisticLockingError.`);
  } catch (error: unknown) {
    if (!(error instanceof OptimisticLockingError)) {
      throw error;
    }
    // Optimistic locking successfully blocked dirty update!
  }

  // 3. Test Soft Delete Strategy
  await tenantRepo.delete(tenant.id);
  const fetchedDeleted = await tenantRepo.findById(tenant.id);
  if (fetchedDeleted !== null) {
    throw new Error(`Integration Test Failed: Soft deleted tenant should not be fetched by default findById.`);
  }

  // Verify it exists in db maps but with deletedAt set
  const rawDbRecord = PostgresTenantRepository.getRawStore().get(tenant.id);
  if (!rawDbRecord || !rawDbRecord.audit.deletedAt) {
    throw new Error(`Integration Test Failed: Soft-delete did not set audit.deletedAt timestamp.`);
  }

  // 4. Test Transaction Rollback Scenario (Using Unit of Work)
  PostgresTenantRepository.seed([]);
  let eventFired = false;

  const testHandler = {
    handle: async () => {
      eventFired = true;
    },
    supports: (type: string) => type === "test.transaction.event"
  };
  coreEventBus.subscribe("test.transaction.event", testHandler);

  try {
    await uow.runInTransaction(async (tx) => {
      // 1. Perform database mutation
      const txTenant: Tenant = {
        ...tenant,
        id: "tx-test-tenant",
        name: "TX Sandbox Corp",
        audit: { ...tenant.audit, version: 1 }
      };
      await tenantRepo.save(txTenant);

      // 2. Register deferred event
      const testEvent = {
        metadata: {
          eventId: "evt-test-tx",
          organizationId: "SYSTEM",
          actorId: "integration-test",
          timestamp: new Date().toISOString(),
          correlationId: "trace-123",
          causationId: "trace-123",
          version: 1
        },
        eventType: "test.transaction.event",
        aggregateId: "tx-test-tenant",
        payload: {}
      };
      tx.registerDeferredEvent(testEvent);

      // 3. Force rollback by throwing exception
      throw new Error("Simulated Transaction Failure");
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg !== "Simulated Transaction Failure") {
      throw error;
    }
  }

  // Verify database state is untouched (rolled back)
  const txTenantCheck = PostgresTenantRepository.getRawStore().get("tx-test-tenant");
  if (txTenantCheck !== undefined) {
    throw new Error(`Integration Test Failed: Transacted changes were not rolled back upon exception.`);
  }

  // Verify deferred event was NOT published (discarded on rollback)
  if (eventFired) {
    throw new Error(`Integration Test Failed: Deferred event should not be published during a rolled-back transaction.`);
  }

  // 5. Test Successful Commit and Event Deferred Publication
  await uow.runInTransaction(async (tx) => {
    const txTenant: Tenant = {
      ...tenant,
      id: "tx-commit-tenant",
      name: "TX Committed Corp",
      audit: { ...tenant.audit, version: 1 }
    };
    await tenantRepo.save(txTenant);

    const testEvent = {
      metadata: {
        eventId: "evt-test-commit",
        organizationId: "SYSTEM",
        actorId: "integration-test",
        timestamp: new Date().toISOString(),
        correlationId: "trace-456",
        causationId: "trace-456",
        version: 1
      },
      eventType: "test.transaction.event",
      aggregateId: "tx-commit-tenant",
      payload: {}
    };
    tx.registerDeferredEvent(testEvent);
  });

  // Verify database contains committed tenant
  const txCommitCheck = PostgresTenantRepository.getRawStore().get("tx-commit-tenant");
  if (!txCommitCheck || txCommitCheck.name !== "TX Committed Corp") {
    throw new Error(`Integration Test Failed: Tenant was not committed to database successfully.`);
  }

  // Verify deferred event WAS successfully published post-commit
  if (!eventFired) {
    throw new Error(`Integration Test Failed: Deferred event was not published upon successful transaction commit.`);
  }

  coreEventBus.unsubscribe("test.transaction.event", testHandler);

  console.log("✅ Administrative Infrastructure Integration Tests Passed Successfully!");
}
export { PostgresTenantRepository };
