import assert from "node:assert/strict";
import { TenantContextManager } from "../../../src/core/database/tenant-context";
import { isQueryTenantScoped, TENANT_SCOPED_TABLES } from "../../../src/core/database/tenant-context";

export async function testTenantIsolationBehaviors() {
  console.log("Running Monitoring Tenant Isolation Pattern Verification...");

  assert.equal(
      TENANT_SCOPED_TABLES.includes('monitoring_configs'),
      true,
      "monitoring_configs must be protected by TenantContextManager RLS scopes"
  );

  assert.equal(
      TENANT_SCOPED_TABLES.includes('crawl_snapshots'),
      true,
      "crawl_snapshots must be protected by TenantContextManager RLS scopes"
  );

  assert.equal(
      TENANT_SCOPED_TABLES.includes('monitoring_alerts'),
      true,
      "monitoring_alerts must be protected by TenantContextManager RLS scopes"
  );

  assert.equal(isQueryTenantScoped("SELECT * FROM monitoring_configs"), true, "Monitoring queries must be flagged as tenant scoped");
  assert.equal(isQueryTenantScoped("INSERT INTO crawl_snapshots (id) VALUES (1)"), true, "Snapshot queries must be flagged as tenant scoped");

  // Try querying without tenant mode
  let throwsWithoutTenant = false;
  try {
      TenantContextManager.getRequiredTenantId();
  } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("No active tenant context found")) {
          throwsWithoutTenant = true;
      }
  }

  assert.equal(throwsWithoutTenant, true, "Fetching tenant scoped repo without explicit context wrapper MUST throw an exception immediately.");

  console.log("✅ Tenant Isolation Behavioral Pattern tests passed (strictly follows zero-trust boundaries)!");
}
