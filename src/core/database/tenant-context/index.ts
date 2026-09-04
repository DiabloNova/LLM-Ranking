import { AsyncLocalStorage } from "node:async_hooks";

/**
 * The minimal surface `TenantContextManager` actually needs from a leased database
 * client. Deliberately narrower than `pg`'s `PoolClient` (rather than importing that
 * type directly) because `PostgresClient.connectClient()` returns a client whose
 * `.query` method is wrapped via `Object.create` with a narrower, tenant-scope-checking
 * signature -- typing this as the literal `PoolClient` would either require an unsafe
 * cast at the wrapping site or silently widen back to `any`. Any real `pg.PoolClient`
 * (or the wrapped variant) structurally satisfies this interface.
 */
export interface TenantDbClient {
  query(sql: string, params?: unknown[]): Promise<{ rows: any[] }>;
  release?: (err?: Error | boolean) => void;
}

export interface TenantContext {
  readonly tenantId: string | null;
  readonly userId: string | null;
  readonly requestId: string | null;
  readonly executionMode: "tenant" | "system";
  readonly dbClient?: TenantDbClient;
  readonly transactionDepth?: number;
}

export class TenantContextViolationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantContextViolationException";
  }
}

export const TENANT_SCOPED_TABLES = Object.freeze([
  "brands",
  "entities",
  "entity_relationships",
  "prompts",
  "ai_observations",
  "brand_mentions",
  "citations",
  "visibility_scores",
  "recommendations",
  "tenant_quotas",
  "tenant_subscriptions",
  "document_embeddings",
  "kg_entities",
  "kg_relationships",
  "premium_audits",
  "competitive_analyses",
  "crawl_jobs",
  "crawl_results",
  "crawl_cache",
  "ai_visibility_audits",
  "audit_prompts",
  "prompt_definitions",
  "prompt_schedules",
  "prompt_executions",
  "position_observations",
  "citation_sources",
  "citation_occurrences",
  "brand_associations",
  "recommendation_observations",
  "aeo_analyses",
  "faq_opportunities",
  "kg_alignments",
  "monitoring_configs",
  "crawl_snapshots",
  "monitoring_alerts"
]);

/**
 * Checks if a given SQL query targets any of the tenant-scoped tables.
 */
export function isQueryTenantScoped(sql: string): boolean {
  if (!sql) return false;
  const normalized = sql.toLowerCase();
  for (const table of TENANT_SCOPED_TABLES) {
    const regex = new RegExp(`\\b${table}\\b`, "i");
    if (regex.test(normalized)) {
      return true;
    }
  }
  return false;
}

export class TenantContextManager {
  private static storage = new AsyncLocalStorage<TenantContext>();

  /**
   * Retrieves the current active TenantContext.
   */
  public static getContext(): TenantContext | null {
    return this.storage.getStore() || null;
  }

  /**
   * Returns the current active tenant ID, throwing an exception if not in tenant mode or if missing.
   */
  public static getRequiredTenantId(): string {
    const ctx = this.getContext();
    if (!ctx) {
      throw new TenantContextViolationException(
        "Tenant Context Violation: No active tenant context found for tenant-scoped query."
      );
    }
    if (ctx.executionMode !== "tenant") {
      throw new TenantContextViolationException(
        `Tenant Context Violation: Cannot query tenant-scoped table under ${ctx.executionMode} execution mode.`
      );
    }
    if (!ctx.tenantId) {
      throw new TenantContextViolationException(
        "Tenant Context Violation: Tenant ID is null or undefined in active context."
      );
    }
    return ctx.tenantId;
  }

  /**
   * Checks if we are currently running in System Context.
   */
  public static isSystemMode(): boolean {
    const ctx = this.getContext();
    return ctx !== null && ctx.executionMode === "system";
  }

  /**
   * Run a block of code under an explicit System Context.
   * Never default to system mode; it must be explicitly created.
   *
   * A system context is used for cross-tenant administrative operations (login,
   * registration, workspace-membership checks, role checks) that intentionally query
   * tables outside the per-tenant RLS boundary (`users`, `organizations`,
   * `organization_members`). It MUST still hand callers a real, transacted database
   * client via `getDbClient()` -- previously this method only pushed context metadata
   * onto AsyncLocalStorage without ever leasing a connection, so every caller that then
   * called `getDbClient()` received `null` and had to throw "Failed to get DB client in
   * system context". That silently broke every login, registration, password-reset,
   * workspace-membership and role check in the application. Fail closed, not silent.
   */
  public static async runWithSystemContext<T>(
    userId: string | null,
    requestId: string | null,
    work: () => Promise<T>
  ): Promise<T> {
    const parentCtx = this.getContext();

    // Reuse an already-open system transaction in the current async scope instead of
    // leasing a second connection (avoids pool exhaustion on nested system calls).
    if (parentCtx && parentCtx.dbClient && parentCtx.executionMode === "system") {
      const nestedCtx: TenantContext = Object.freeze({
        ...parentCtx,
        transactionDepth: (parentCtx.transactionDepth || 1) + 1,
      });
      return this.storage.run(nestedCtx, work);
    }

    let leasedClient: TenantDbClient | null = null;

    // FAIL CLOSED. Without a real leased client, callers cannot execute any query at
    // all, so a missing connection must abort loudly here rather than surface as a
    // confusing downstream "Failed to get DB client" error at the call site.
    try {
      // Dynamically import PostgresClient to avoid circular dependencies.
      const { PostgresClient } = await import("../../../features/admin/infrastructure/persistence/postgres");
      const pgClient = PostgresClient.getInstance();
      leasedClient = await pgClient.connectClient();
    } catch (err) {
      console.error(
        "[TenantContextManager] Could not lease a database client for system context. Aborting.",
        err instanceof Error ? err.message : err
      );
      throw err;
    }

    if (!leasedClient) {
      throw new TenantContextViolationException(
        "Tenant Context Violation: no database client available for system context."
      );
    }

    try {
      await leasedClient.query("BEGIN");

      const transactedCtx: TenantContext = Object.freeze({
        tenantId: null,
        userId,
        requestId,
        executionMode: "system",
        dbClient: leasedClient,
        transactionDepth: 1,
      });

      const result = await this.storage.run(transactedCtx, work);

      await leasedClient.query("COMMIT");
      return result;
    } catch (err) {
      try {
        await leasedClient.query("ROLLBACK");
      } catch (rollbackErr) {
        console.error("[TenantContextManager] ROLLBACK error (system context):", rollbackErr);
      }
      throw err;
    } finally {
      if (typeof leasedClient.release === "function") {
        leasedClient.release();
      }
    }
  }

  /**
   * Execute tenant-scoped database work within a secure PostgreSQL transaction.
   * Guarantees:
   * BEGIN
   * SET LOCAL app.current_tenant_id = <tenantId>
   * Execute queries
   * COMMIT / ROLLBACK
   */
  public static async runWithTenantContext<T>(
    tenantId: string,
    userId: string | null,
    requestId: string | null,
    work: () => Promise<T>,
    options?: { requireNewSavepoint?: boolean }
  ): Promise<T> {
    if (!tenantId) {
      throw new TenantContextViolationException(
        "Tenant Context Violation: Cannot establish tenant context with empty tenant ID."
      );
    }

    const parentCtx = this.getContext();

    // Check if there is already an active transaction in the current async scope
    if (parentCtx && parentCtx.dbClient && parentCtx.tenantId === tenantId) {
      // Re-use transaction (prefer transaction reuse over nested savepoints by default)
      const depth = (parentCtx.transactionDepth || 1) + 1;
      const nestedCtx = Object.freeze({
        ...parentCtx,
        transactionDepth: depth
      });

      if (options?.requireNewSavepoint) {
        // If independent rollback is explicitly required, use a PostgreSQL SAVEPOINT
        const savepointName =
  `sp_${depth}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const client = parentCtx.dbClient;
        await client.query(`SAVEPOINT ${savepointName}`);
        try {
          const res = await this.storage.run(nestedCtx, work);
          await client.query(`RELEASE SAVEPOINT ${savepointName}`);
          return res;
        } catch (err) {
          await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
          throw err;
        }
      } else {
        // Otherwise, simply run the work inside the reused transaction
        return this.storage.run(nestedCtx, work);
      }
    }

    let leasedClient: TenantDbClient | null = null;

    // FAIL CLOSED. A tenant-scoped transaction without a real client cannot enforce RLS
    // via set_config('app.current_tenant_id', ...), so proceeding with a null client
    // would silently execute tenant work outside its isolation boundary.
    //
    // The previous implementation logged "creating fallback mock client" but never
    // assigned one, so it silently continued with a null client. That comment was wrong
    // and the behaviour was unsafe. Connection failures now propagate.
    try {
      // Dynamically import PostgresClient to avoid circular dependencies
      const { PostgresClient } = await import("../../../features/admin/infrastructure/persistence/postgres");
      const pgClient = PostgresClient.getInstance();
      leasedClient = await pgClient.connectClient();
    } catch (err) {
      console.error(
        "[TenantContextManager] Could not lease a database client for tenant context. Aborting.",
        err instanceof Error ? err.message : err
      );
      throw err;
    }

    if (!leasedClient) {
      throw new TenantContextViolationException(
        "Tenant Context Violation: no database client available; tenant isolation cannot be enforced."
      );
    }

    // Execute the transaction lifecycle
    try {
      if (leasedClient) {
        await leasedClient.query("BEGIN");
        await leasedClient.query(
          "SELECT set_config('app.current_tenant_id', $1, true)",
          [tenantId]
        );
      }

      const transactedCtx: TenantContext = Object.freeze({
        tenantId,
        userId,
        requestId,
        executionMode: "tenant",
        dbClient: leasedClient,
        transactionDepth: 1
      });

      const result = await this.storage.run(transactedCtx, work);

      if (leasedClient) {
        await leasedClient.query("COMMIT");
      }
      return result;
    } catch (err) {
      if (leasedClient) {
        try {
          await leasedClient.query("ROLLBACK");
        } catch (rollbackErr) {
          console.error("[TenantContextManager] ROLLBACK error:", rollbackErr);
        }
      }
      throw err;
    } finally {
      if (leasedClient && typeof leasedClient.release === "function") {
        leasedClient.release();
      }
    }
  }

  /**
   * Retrieves the current database client if we are inside a tenant transaction context.
   */
  public static getDbClient(): TenantDbClient | null {
    const ctx = this.getContext();
    if (ctx && ctx.dbClient) {
      return ctx.dbClient;
    }
    return null;
  }
}
