/**
 * Phase 7C.5 — Enterprise Admin Operations Suite
 * Comprehensive Test Runner Suite
 */

import { testDomain } from "./domain.test";
import { runBehavioralTenantIsolationTests } from "./tenant-isolation-behavior.test";
import { testCQRS } from "./cqrs.test";
import { testSecurity } from "./security.test";
import { testInfrastructure } from "./infrastructure/persistence.test";
import { testPostgresIntegration } from "./infrastructure/postgres-integration.test";
import { TenantContextManager } from "../../../src/core/database/tenant-context";

async function main() {
  console.log("====================================================");
  console.log("🚀 Starting Enterprise Administrative Context Tests...");
  console.log("====================================================");

  try {
    testDomain();

    // All administrative operations must execute within an explicit System Context
    await TenantContextManager.runWithSystemContext("admin-user-super", "req-admin-01", async () => {
      await testCQRS();
      testSecurity();
      await testInfrastructure();
      await testPostgresIntegration();
    });

    // Behavioural RLS checks run outside the system context: they assert that a *tenant*
    // context cannot read another tenant's rows, so a system-context bypass would void them.
    await runBehavioralTenantIsolationTests();

    // Allow asynchronous event bus execution to complete before final status log
    setTimeout(() => {
      console.log("\n====================================================");
      console.log("🎉 ALL ENTERPRISE ADMINISTRATIVE TESTS PASSED!");
      console.log("====================================================");
    }, 100);

  } catch (error) {
    console.error("\n❌ ADMIN TEST SUITE RUNNER FAILURE:", error);
    process.exit(1);
  }
}

main();
