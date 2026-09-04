import { validateDbPushGuard, sanitizeErrorMessage } from "../../../scripts/database/db-push-guard";

async function runTests() {
  console.log("=========================================================================");
  console.log("STAGE 6 — FAIL-CLOSED DB:PUSH GUARD AUTOMATED TEST SUITE");
  console.log("=========================================================================\n");

  let passed = 0;
  let total = 0;

  function assertTest(testId: number, scenario: string, expectedExit: number, actualExit: number, resultMsg: string, secretCheckPassed: boolean = true) {
    total++;
    const isPass = expectedExit === actualExit && secretCheckPassed;
    if (isPass) passed++;
    const padScenario = scenario.padEnd(40, " ");
    console.log(`Test ${testId.toString().padStart(2, " ")} | ${padScenario} | Expected Exit: ${expectedExit} | Actual Exit: ${actualExit} | Result: ${isPass ? "PASS ✅" : "FAIL ❌"}`);
    if (!isPass) {
      console.error(`   Details: ${resultMsg}`);
    }
  }

  // Mock empty database factory
  const mockEmptyClient = (dbUrl: string) => ({
    connect: async () => {},
    query: async (sql: string) => ({ rows: [{ table_count: 0 }] }),
    end: async () => {},
  });

  // Mock non-empty database factory
  const mockNonEmptyClient = (dbUrl: string) => ({
    connect: async () => {},
    query: async (sql: string) => ({ rows: [{ table_count: 15 }] }),
    end: async () => {},
  });

  // Mock catalog query error factory
  const mockFailingClient = (dbUrl: string) => ({
    connect: async () => {},
    query: async () => {
      throw new Error(`Catalog query failed for connection string postgres://admin:secretPass123@db.internal:5432/mydevdb`);
    },
    end: async () => {},
  });

  // Test 1 — Production Environment
  {
    const res = await validateDbPushGuard({
      env: {
        NODE_ENV: "production",
        ALLOW_DB_PUSH: "true",
        DISPOSABLE_DB: "true",
        DATABASE_URL: "postgres://localhost:5432/devdb",
      },
      clientFactory: mockEmptyClient,
    });
    assertTest(1, "Production Environment", 1, res.allowed ? 0 : 1, res.reason);
  }

  // Test 2 — Production-like DATABASE_URL
  {
    const res = await validateDbPushGuard({
      env: {
        NODE_ENV: "development",
        ALLOW_DB_PUSH: "true",
        DISPOSABLE_DB: "true",
        DATABASE_URL: "postgres://user:pass@ep-cool-db-123456.us-east-2.aws.neon.tech/neondb",
      },
      clientFactory: mockEmptyClient,
    });
    assertTest(2, "Production-like DATABASE_URL", 1, res.allowed ? 0 : 1, res.reason);
  }

  // Test 3 — Non-empty Database
  {
    const res = await validateDbPushGuard({
      env: {
        NODE_ENV: "development",
        ALLOW_DB_PUSH: "true",
        DISPOSABLE_DB: "true",
        DATABASE_URL: "postgres://localhost:5432/devdb",
      },
      clientFactory: mockNonEmptyClient,
    });
    assertTest(3, "Non-empty Database", 1, res.allowed ? 0 : 1, res.reason);
  }

  // Test 4 — Missing Authorization (ALLOW_DB_PUSH)
  {
    const res = await validateDbPushGuard({
      env: {
        NODE_ENV: "development",
        DISPOSABLE_DB: "true",
        DATABASE_URL: "postgres://localhost:5432/devdb",
      },
      clientFactory: mockEmptyClient,
    });
    assertTest(4, "Missing ALLOW_DB_PUSH", 1, res.allowed ? 0 : 1, res.reason);
  }

  // Test 5 — Explicitly Disabled Authorization (ALLOW_DB_PUSH=false)
  {
    const res = await validateDbPushGuard({
      env: {
        NODE_ENV: "development",
        ALLOW_DB_PUSH: "false",
        DISPOSABLE_DB: "true",
        DATABASE_URL: "postgres://localhost:5432/devdb",
      },
      clientFactory: mockEmptyClient,
    });
    assertTest(5, "ALLOW_DB_PUSH=false", 1, res.allowed ? 0 : 1, res.reason);
  }

  // Test 6 — Wrong Environment (NODE_ENV=staging)
  {
    const res = await validateDbPushGuard({
      env: {
        NODE_ENV: "staging",
        ALLOW_DB_PUSH: "true",
        DISPOSABLE_DB: "true",
        DATABASE_URL: "postgres://localhost:5432/devdb",
      },
      clientFactory: mockEmptyClient,
    });
    assertTest(6, "Unsupported environment (staging)", 1, res.allowed ? 0 : 1, res.reason);
  }

  // Test 7 — Development + Empty + Disposable + Explicit Authorization
  {
    const res = await validateDbPushGuard({
      env: {
        NODE_ENV: "development",
        ALLOW_DB_PUSH: "true",
        DISPOSABLE_DB: "true",
        DATABASE_URL: "postgres://localhost:5432/devdb",
      },
      clientFactory: mockEmptyClient,
    });
    assertTest(7, "Dev + Empty + Disposable + Authorized", 0, res.allowed ? 0 : 1, res.reason);
  }

  // Test 8 — Test Environment + Empty + Disposable + Explicit Authorization
  {
    const res = await validateDbPushGuard({
      env: {
        NODE_ENV: "test",
        ALLOW_DB_PUSH: "true",
        DISPOSABLE_DB: "true",
        DATABASE_URL: "postgres://localhost:5432/devdb",
      },
      clientFactory: mockEmptyClient,
    });
    assertTest(8, "Test + Empty + Disposable + Authorized", 0, res.allowed ? 0 : 1, res.reason);
  }

  // Test 9 — Cannot Establish Emptiness (Catalog Failure)
  {
    const res = await validateDbPushGuard({
      env: {
        NODE_ENV: "development",
        ALLOW_DB_PUSH: "true",
        DISPOSABLE_DB: "true",
        DATABASE_URL: "postgres://admin:secretPass123@db.internal:5432/mydevdb",
      },
      clientFactory: mockFailingClient,
    });
    assertTest(9, "Empty check unavailable (failing catalog)", 1, res.allowed ? 0 : 1, res.reason);
  }

  // Test 10 — Secret Leakage Prevention Check
  {
    const sensitiveDbUrl = "postgres://adminUser:superSecretPassword987@prod-db.internal:5432/production_db?ssl=true";
    const res = await validateDbPushGuard({
      env: {
        NODE_ENV: "development",
        ALLOW_DB_PUSH: "true",
        DISPOSABLE_DB: "true",
        DATABASE_URL: sensitiveDbUrl,
      },
      clientFactory: mockFailingClient,
    });

    const hasSecretPass = res.reason.includes("superSecretPassword987");
    const hasAdminUser = res.reason.includes("adminUser");
    const hasDbUrl = res.reason.includes(sensitiveDbUrl);

    const secretCheckPassed = !hasSecretPass && !hasAdminUser && !hasDbUrl;
    assertTest(
      10,
      "Secret Leakage Prevention",
      0, // Expected 0 leaks
      secretCheckPassed ? 0 : 1,
      secretCheckPassed ? "No secrets leaked in error reason." : `LEAK DETECTED: ${res.reason}`,
      secretCheckPassed
    );
  }

  console.log("\n=========================================================================");
  console.log(`SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log("=========================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner encountered error:", err);
  process.exit(1);
});
