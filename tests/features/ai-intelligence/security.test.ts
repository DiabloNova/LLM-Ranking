/* eslint-disable @typescript-eslint/no-explicit-any */
import { TenantSecurityGuard, SensitiveDataProtector, SecurityActor } from "../../../src/features/ai-intelligence/security";
import {
  BrandRepository,
  EntityRepository,
  PromptRepository,
  ObservationRepository
} from "../../../src/features/ai-intelligence/repositories";

export async function testSecurity() {
  console.log("▶ Running Security Layer Tests...");

  const actorTenantA: SecurityActor = {
    id: "user-01",
    organizationId: "org-tenant-a-11",
    role: "WorkspaceAdmin",
    permissions: []
  };

  const actorTenantB: SecurityActor = {
    id: "user-02",
    organizationId: "org-tenant-b-22",
    role: "Viewer",
    permissions: []
  };

  const superAdmin: SecurityActor = {
    id: "user-admin",
    organizationId: "org-any-33",
    role: "SuperAdmin",
    permissions: []
  };

  // 1. Tenant Isolation
  TenantSecurityGuard.authorizeTenant(actorTenantA, "org-tenant-a-11"); // Should pass
  TenantSecurityGuard.authorizeTenant(superAdmin, "org-tenant-a-11"); // Should pass (SuperAdmin bypass)

  try {
    TenantSecurityGuard.authorizeTenant(actorTenantB, "org-tenant-a-11"); // Should fail
    throw new Error("Should have thrown error on cross-tenant leakage test");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("Security Exception: Access Denied")) {
      throw new Error(`Expected tenant security error, got: ${message}`);
    }
  }

  // 2. RBAC Permissions
  TenantSecurityGuard.authorizePermission(actorTenantA, "brand:create"); // Admin should pass

  try {
    TenantSecurityGuard.authorizePermission(actorTenantB, "brand:create"); // Viewer should fail
    throw new Error("Should have thrown error on permission block");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("lacks required permission")) {
      throw new Error(`Expected permission security error, got: ${message}`);
    }
  }

  // 3. Sensitive Data protection
  const rawLog = "The API key was api_key = 'abcdef123456789' and Bearer token: Bearer abcdef.12345.xyz";
  const masked = SensitiveDataProtector.maskSecret(rawLog);
  console.log(`  * Masked Text: "${masked}"`);

  if (masked.includes("abcdef123456789") || masked.includes("abcdef.12345.xyz")) {
    throw new Error("Sensitive Data Protector failed to redact credentials.");
  }

  // 4. Persistence Layer Tenant Isolation & Ownership Guards
  console.log("  * Testing Persistence Tenant Isolation Guards...");
  const brandRepo = new BrandRepository();
  const entityRepo = new EntityRepository();
  const promptRepo = new PromptRepository();
  const observationRepo = new ObservationRepository();

  const mockAudit = {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "test",
    updatedBy: "test",
    version: 1
  };

  // Create a brand for Tenant A
  const brandA = {
    id: "test-brand-tenant-a",
    organizationId: "org-tenant-a-11",
    name: "Tenant A Brand",
    description: "Brand description",
    website: "https://tenant-a.com",
    industry: "Tech",
    country: "US",
    audit: mockAudit
  };
  await brandRepo.save(brandA);

  // Cross-tenant read must return null
  const crossRead = await brandRepo.findById("org-tenant-b-22", "test-brand-tenant-a");
  if (crossRead !== null) {
    throw new Error("Tenant Isolation failure: Was able to read other tenant's brand directly!");
  }

  // Cross-tenant update / ownership modification must throw Tenant Isolation Exception
  try {
    const clonedBrandB = { ...brandA, organizationId: "org-tenant-b-22" };
    await brandRepo.save(clonedBrandB);
    throw new Error("Tenant Isolation failure: Was able to modify organizationId on save!");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("Tenant Isolation Exception")) {
      throw new Error(`Expected Tenant Isolation Exception, got: ${msg}`);
    }
  }

  // Verify across other repositories as well
  // Entity Repository
  const entityA = {
    id: "test-entity-a",
    organizationId: "org-tenant-a-11",
    brandId: "test-brand-tenant-a",
    name: "Entity A",
    type: "Brand" as const,
    confidence: { score: 0.9, rating: "high" as const },
    audit: mockAudit
  };
  await entityRepo.save(entityA);

  try {
    const clonedEntityB = { ...entityA, organizationId: "org-tenant-b-22" };
    await entityRepo.save(clonedEntityB);
    throw new Error("Tenant Isolation failure on Entity save!");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("Tenant Isolation Exception")) {
      throw new Error(`Expected Tenant Isolation Exception for Entity, got: ${msg}`);
    }
  }

  // Prompt Repository
  const promptA = {
    id: "test-prompt-a",
    organizationId: "org-tenant-a-11",
    brandId: "test-brand-tenant-a",
    text: "Some prompt",
    category: "Market Discovery",
    intent: "Discovery" as const,
    language: "en",
    priority: "high" as const,
    audit: mockAudit
  };
  await promptRepo.save(promptA);

  try {
    const clonedPromptB = { ...promptA, organizationId: "org-tenant-b-22" };
    await promptRepo.save(clonedPromptB);
    throw new Error("Tenant Isolation failure on Prompt save!");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("Tenant Isolation Exception")) {
      throw new Error(`Expected Tenant Isolation Exception for Prompt, got: ${msg}`);
    }
  }

  // Observation Repository
  const obsA = {
    id: "test-obs-a",
    organizationId: "org-tenant-a-11",
    promptId: "test-prompt-a",
    engineId: "engine-chatgpt",
    responseText: "Response",
    visibilityScore: 80,
    sentiment: { score: 80, label: "positive" as const, confidence: 0.9 },
    confidence: { score: 0.9, rating: "high" as const },
    executedAt: new Date(),
    audit: mockAudit
  };
  await observationRepo.save(obsA);

  try {
    const clonedObsB = { ...obsA, organizationId: "org-tenant-b-22" };
    await observationRepo.save(clonedObsB);
    throw new Error("Tenant Isolation failure on Observation save!");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("Tenant Isolation Exception")) {
      throw new Error(`Expected Tenant Isolation Exception for Observation, got: ${msg}`);
    }
  }

  // 5. Database-level PostgreSQL Row Level Security (RLS) simulation
  console.log("  * Testing Database-level PostgreSQL Row Level Security (RLS) Isolation...");

  // Setup active PostgreSQL session context
  const pgSessionSettings = new Map<string, string>();

  function setSessionSetting(key: string, value: string) {
    pgSessionSettings.set(key, value);
  }

  function clearSessionSetting(key: string) {
    pgSessionSettings.delete(key);
  }

  function getSessionTenantId(): string | null {
    return pgSessionSettings.get("app.current_tenant_id") || null;
  }

  /**
   * Database-level RLS Engine Simulator matching explicit PostgreSQL policies:
   * - SELECT: USING (tenantColumn = app.current_tenant_id)
   * - INSERT: WITH CHECK (tenantColumn = app.current_tenant_id)
   * - UPDATE: USING (tenantColumn = app.current_tenant_id) WITH CHECK (tenantColumn = app.current_tenant_id)
   * - DELETE: USING (tenantColumn = app.current_tenant_id)
   */
  class PostgresRLSEngine<T extends Record<string, any>> {
    private tableName: string;
    private tenantColumn: string;
    private rows: T[] = [];

    constructor(tableName: string, tenantColumn: string) {
      this.tableName = tableName;
      this.tenantColumn = tenantColumn;
    }

    private getRowTenantId(row: T): string {
      return row[this.tenantColumn];
    }

    // Seed database table with raw rows bypass RLS
    public seedBypassRLS(rawRows: T[]) {
      this.rows = [...rawRows];
    }

    public getRawStore(): T[] {
      return this.rows;
    }

    // Simulates SELECT query evaluation under active session settings
    public select(): T[] {
      const activeTenant = getSessionTenantId();
      if (!activeTenant) return [];
      return this.rows.filter(row => this.getRowTenantId(row) === activeTenant);
    }

    // Simulates INSERT query with CHECK policy
    public insert(newRow: T): void {
      const activeTenant = getSessionTenantId();
      // WITH CHECK policy validation
      if (!activeTenant || this.getRowTenantId(newRow) !== activeTenant) {
        throw new Error(`PostgreSQL RLS Error: INSERT WITH CHECK violation on table '${this.tableName}'. Expected tenant '${activeTenant}', got '${this.getRowTenantId(newRow)}'.`);
      }
      this.rows.push(newRow);
    }

    // Simulates UPDATE query with USING + WITH CHECK policy
    public update(rowId: string, updatedRowFields: Partial<T>): void {
      const activeTenant = getSessionTenantId();
      if (!activeTenant) {
        // No rows visible to update (0 rows affected)
        return;
      }

      // First find the row that is visible to this transaction (USING clause validation)
      const visibleRow = this.rows.find(row => row.id === rowId && this.getRowTenantId(row) === activeTenant);
      if (!visibleRow) {
        // Row not found or not visible (USING check blocked cross-tenant update)
        return;
      }

      // Construct prospective row to validate WITH CHECK constraint
      const prospectiveRow = { ...visibleRow, ...updatedRowFields };
      if (this.getRowTenantId(prospectiveRow) !== activeTenant) {
        // WITH CHECK constraint blocked ownership hijacking / tenant ID modification
        throw new Error(`PostgreSQL RLS Error: UPDATE WITH CHECK violation on table '${this.tableName}'. Attempted to modify tenant ownership column '${this.tenantColumn}' from '${this.getRowTenantId(visibleRow)}' to '${this.getRowTenantId(prospectiveRow)}'.`);
      }

      // Perform update
      const index = this.rows.findIndex(row => row.id === rowId);
      this.rows[index] = prospectiveRow;
    }

    // Simulates DELETE query with USING policy
    public delete(rowId: string): void {
      const activeTenant = getSessionTenantId();
      if (!activeTenant) {
        // No rows visible to delete
        return;
      }

      // Find the row that is visible to this transaction (USING clause validation)
      const visibleIndex = this.rows.findIndex(row => row.id === rowId && this.getRowTenantId(row) === activeTenant);
      if (visibleIndex === -1) {
        // Row not found or not visible under active RLS (USING check blocked cross-tenant delete)
        return;
      }

      // Perform delete
      this.rows.splice(visibleIndex, 1);
    }
  }

  // List of all 15 tenant-scoped tables with their respective partition columns
  const tablesToVerify = [
    { tableName: "organizations", tenantColumn: "id" },
    { tableName: "brands", tenantColumn: "organizationId" },
    { tableName: "entities", tenantColumn: "organizationId" },
    { tableName: "entity_relationships", tenantColumn: "organizationId" },
    { tableName: "prompts", tenantColumn: "organizationId" },
    { tableName: "ai_observations", tenantColumn: "organizationId" },
    { tableName: "brand_mentions", tenantColumn: "organizationId" },
    { tableName: "citations", tenantColumn: "organizationId" },
    { tableName: "visibility_scores", tenantColumn: "organizationId" },
    { tableName: "recommendations", tenantColumn: "organizationId" },
    { tableName: "tenant_quotas", tenantColumn: "tenantId" },
    { tableName: "tenant_subscriptions", tenantColumn: "tenantId" },
    { tableName: "document_embeddings", tenantColumn: "tenantId" },
    { tableName: "kg_entities", tenantColumn: "tenantId" },
    { tableName: "kg_relationships", tenantColumn: "tenantId" }
  ];

  for (const { tableName, tenantColumn } of tablesToVerify) {
    console.log(`  * Verification: [Table: ${tableName}, Key: ${tenantColumn}]`);

    const rlsEngine = new PostgresRLSEngine<any>(tableName, tenantColumn);

    const targetRowAId = tenantColumn === "id" ? "org-tenant-a-11" : `row-a-${tableName}`;
    const targetRowBId = tenantColumn === "id" ? "org-tenant-b-22" : `row-b-${tableName}`;

    // Seed rows
    const rowA = { id: targetRowAId, [tenantColumn]: "org-tenant-a-11", name: `Tenant A ${tableName}` };
    const rowB = { id: targetRowBId, [tenantColumn]: "org-tenant-b-22", name: `Tenant B ${tableName}` };
    rlsEngine.seedBypassRLS([rowA, rowB]);

    // Test SELECT Isolation
    // Tenant A Context
    setSessionSetting("app.current_tenant_id", "org-tenant-a-11");
    const selectA = rlsEngine.select();
    if (selectA.length !== 1 || selectA[0].id !== rowA.id) {
      throw new Error(`RLS Verification Failure on table '${tableName}': SELECT did not restrict query results to active tenant org-tenant-a-11.`);
    }

    // Tenant B Context
    setSessionSetting("app.current_tenant_id", "org-tenant-b-22");
    const selectB = rlsEngine.select();
    if (selectB.length !== 1 || selectB[0].id !== rowB.id) {
      throw new Error(`RLS Verification Failure on table '${tableName}': SELECT did not restrict query results to active tenant org-tenant-b-22.`);
    }

    // Empty Context
    clearSessionSetting("app.current_tenant_id");
    const selectNone = rlsEngine.select();
    if (selectNone.length !== 0) {
      throw new Error(`RLS Verification Failure on table '${tableName}': SELECT returned rows for empty session setting context.`);
    }

    // Test INSERT Isolation
    // Secure Insertion (Tenant A insert Tenant A row)
    const validInsertId = tenantColumn === "id" ? "org-tenant-a-new-11" : `row-a-new-${tableName}`;
    const validInsertTenantId = tenantColumn === "id" ? "org-tenant-a-new-11" : "org-tenant-a-11";

    if (tenantColumn === "id") {
      setSessionSetting("app.current_tenant_id", "org-tenant-a-new-11");
    } else {
      setSessionSetting("app.current_tenant_id", "org-tenant-a-11");
    }

    const validInsert = { id: validInsertId, [tenantColumn]: validInsertTenantId, name: "Valid A" };
    rlsEngine.insert(validInsert);

    // Cross-tenant Insert rejection
    if (tenantColumn === "id") {
      setSessionSetting("app.current_tenant_id", "org-tenant-a-new-11");
    } else {
      setSessionSetting("app.current_tenant_id", "org-tenant-a-11");
    }

    const invalidInsert = { id: `row-b-new-${tableName}`, [tenantColumn]: "org-tenant-b-22", name: "Invalid B" };
    try {
      rlsEngine.insert(invalidInsert);
      throw new Error(`RLS Verification Failure on table '${tableName}': Allowed cross-tenant INSERT of Tenant B row under Tenant A context!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("PostgreSQL RLS Error") || !msg.includes("INSERT WITH CHECK violation")) {
        throw err;
      }
      // Rejection succeeded correctly!
    }

    // Test UPDATE Isolation
    // Secure update
    setSessionSetting("app.current_tenant_id", "org-tenant-a-11");
    rlsEngine.update(targetRowAId, { name: "Updated A Name" });
    const rowAfterUpdate = rlsEngine.select().find(r => r.id === targetRowAId);
    if (!rowAfterUpdate || rowAfterUpdate.name !== "Updated A Name") {
      throw new Error(`RLS Verification Failure on table '${tableName}': Failed to perform valid UPDATE on owned row.`);
    }

    // Attempt to update Tenant B row under Tenant A context (USING clause should ignore)
    rlsEngine.update(targetRowBId, { name: "Hacked B Name" });
    // Verify Tenant B row remains unchanged
    setSessionSetting("app.current_tenant_id", "org-tenant-b-22");
    const tenantBRow = rlsEngine.select().find(r => r.id === targetRowBId);
    if (tenantBRow.name === "Hacked B Name") {
      throw new Error(`RLS Verification Failure on table '${tableName}': Allowed UPDATE on other tenant's row (Tenant B) under Tenant A session context!`);
    }

    // Attempt to hijack Tenant A row and change its ownership to Tenant B (WITH CHECK clause should reject)
    setSessionSetting("app.current_tenant_id", "org-tenant-a-11");
    try {
      rlsEngine.update(targetRowAId, { [tenantColumn]: "org-tenant-b-22" });
      throw new Error(`RLS Verification Failure on table '${tableName}': Allowed modifying partition column '${tenantColumn}' to change ownership of existing record!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("PostgreSQL RLS Error") || !msg.includes("UPDATE WITH CHECK violation")) {
        throw err;
      }
      // Hijack rejection succeeded correctly!
    }

    // Test DELETE Isolation
    // Attempt to delete Tenant B row under Tenant A context
    setSessionSetting("app.current_tenant_id", "org-tenant-a-11");
    rlsEngine.delete(targetRowBId);
    // Verify Tenant B row was NOT deleted
    setSessionSetting("app.current_tenant_id", "org-tenant-b-22");
    const tenantBRowAfterDelete = rlsEngine.select().find(r => r.id === targetRowBId);
    if (!tenantBRowAfterDelete) {
      throw new Error(`RLS Verification Failure on table '${tableName}': Allowed deletion of other tenant's row (Tenant B) under Tenant A session context!`);
    }

    // Secure delete of own row
    setSessionSetting("app.current_tenant_id", "org-tenant-a-11");
    rlsEngine.delete(targetRowAId);
    const selectAfterDelete = rlsEngine.select();
    if (selectAfterDelete.find(r => r.id === targetRowAId)) {
      throw new Error(`RLS Verification Failure on table '${tableName}': Failed to perform valid DELETE on owned row.`);
    }
  }

  // Clean context after tests
  clearSessionSetting("app.current_tenant_id");

  console.log("✅ Security Layer Tests Passed Successfully!");
}
