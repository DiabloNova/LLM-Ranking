import { TenantContextManager } from "../../../src/core/database/tenant-context";
import { PostgresClient } from "../../../src/features/admin/infrastructure/persistence/postgres";

export async function runBehavioralTenantIsolationTests() {
  console.log("▶ Running Behavioral Tenant Isolation Tests...");

  const pgClient = PostgresClient.getInstance();
  const pool = pgClient.getPool();

  const tenantA = "11111111-1111-1111-1111-111111111111";
  const tenantB = "22222222-2222-2222-2222-222222222222";

  // Scenario 1: Tenant A can insert & read own record under tenant context, but Tenant B cannot read Tenant A's record
  await TenantContextManager.runWithTenantContext(tenantA, "user-a", "req-1", async () => {
    // Insert a website record under Tenant A
    const activeClient = TenantContextManager.getDbClient();
    if (!activeClient) {
      throw new Error("TenantIsolationTest Error: No active DB client in Tenant A context");
    }

    // Insert Organization A first to satisfy foreign key constraint if needed
    await activeClient.query(
      `INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
      [tenantA, "Tenant Alpha", "tenant-alpha"]
    );

    // Insert Website for Tenant A
    await activeClient.query(
      `INSERT INTO websites (id, organization_id, domain, normalized_url)
       VALUES (gen_random_uuid(), $1, $2, $3)`,
      [tenantA, "tenant-a.com", "https://tenant-a.com"]
    );

    // Tenant A queries websites
    const resA = await activeClient.query(`SELECT domain FROM websites WHERE organization_id = $1`, [tenantA]);
    if (resA.rows.length === 0 || resA.rows[0].domain !== "tenant-a.com") {
      throw new Error("TenantIsolationTest Failed: Tenant A could not read its own inserted record");
    }
  });

  // Scenario 2: Tenant B attempts to read websites under Tenant B context
  await TenantContextManager.runWithTenantContext(tenantB, "user-b", "req-2", async () => {
    const activeClient = TenantContextManager.getDbClient();
    if (!activeClient) {
      throw new Error("TenantIsolationTest Error: No active DB client in Tenant B context");
    }

    // Insert Organization B
    await activeClient.query(
      `INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
      [tenantB, "Tenant Beta", "tenant-beta"]
    );

    // Query websites under Tenant B's context - Row-Level Security (RLS) MUST exclude Tenant A's website
    const resB = await activeClient.query(`SELECT * FROM websites WHERE domain = 'tenant-a.com'`);
    if (resB.rows.length > 0) {
      throw new Error("TenantIsolationTest SECURITY VIOLATION: Tenant B was able to read Tenant A's website!");
    }
  });

  // Scenario 3: Verify set_config('app.current_tenant_id') stays transaction-local and clears after transaction ends
  const leaseClient = await pool.connect();
  try {
    await leaseClient.query("BEGIN");
    await leaseClient.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantA]);

    const checkActive = await leaseClient.query("SELECT current_setting('app.current_tenant_id', true) as tid");
    if (checkActive.rows[0].tid !== tenantA) {
      throw new Error("TenantIsolationTest Failed: set_config did not set app.current_tenant_id inside transaction");
    }

    await leaseClient.query("ROLLBACK");

    // Outside transaction on same pooled connection, app.current_tenant_id MUST be empty
    const checkCleared = await leaseClient.query("SELECT current_setting('app.current_tenant_id', true) as tid");
    if (checkCleared.rows[0].tid && checkCleared.rows[0].tid !== "") {
      throw new Error("TenantIsolationTest SECURITY VIOLATION: app.current_tenant_id leaked out of transaction on pooled connection!");
    }
  } finally {
    leaseClient.release();
  }

  console.log("✅ Behavioral Tenant Isolation Tests Passed Successfully!");
}

if (require.main === module) {
  runBehavioralTenantIsolationTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Behavioral Tenant Isolation Tests Failed:", err);
      process.exit(1);
    });
}
