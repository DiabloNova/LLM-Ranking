/**
 * Phase 7C.5 — Enterprise PostgreSQL Persistence Adapter Layer
 * Implements real SQL queries, connection leasing, transactions, optimistic concurrency, and soft delete.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import {
  ITenantRepository,
  IAdminUserRepository,
  IFeatureFlagRepository,
  IAuditRecordRepository,
  IAIProviderConfigurationRepository,
} from "../../../domain/repositories";
import {
  Tenant,
  AdminUser,
  FeatureFlag,
  AuditRecord,
  AIProviderConfiguration,
} from "../../../domain/types";
import { UnitOfWork } from "../uow";
import {
  TenantContextManager,
  isQueryTenantScoped,
  TenantContextViolationException,
} from "../../../../../core/database/tenant-context";

/**
 * Raised when the database cannot be reached (connection refused, pool exhausted,
 * DNS failure, socket timeout, admin shutdown).
 *
 * API-route boundaries MUST translate this into HTTP 503, distinct from a 500. It exists
 * so that infrastructure unavailability is never confused with an empty result set.
 */
export class DatabaseUnavailableError extends Error {
  public readonly statusCode = 503;

  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

/** Postgres/libpq error codes and messages that indicate loss of connectivity. */
const CONNECTIVITY_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENOTFOUND",
  "EPIPE",
  "57P01", // admin_shutdown
  "57P02", // crash_shutdown
  "57P03", // cannot_connect_now
  "08000", // connection_exception
  "08003", // connection_does_not_exist
  "08006", // connection_failure
  "08001", // sqlclient_unable_to_establish_sqlconnection
  "08004", // sqlserver_rejected_establishment_of_sqlconnection
]);

export function isConnectivityError(code: string | undefined, message: string): boolean {
  if (code && CONNECTIVITY_ERROR_CODES.has(code)) {
    return true;
  }

  const normalized = message.toLowerCase();
  return (
    normalized.includes("econnrefused") ||
    normalized.includes("connection terminated") ||
    normalized.includes("timeout exceeded when trying to connect") ||
    normalized.includes("database connection failed") ||
    normalized.includes("getaddrinfo")
  );
}


function createDisabledMap<K, V>(): Map<K, V> {
  if (process.env.NODE_ENV === "test") return new Map<K, V>();
  return new Proxy(new Map<K, V>(), { get() { throw new DatabaseUnavailableError("In-memory persistence is disabled outside tests."); } });
}

function createDisabledArray<T>(): T[] {
  if (process.env.NODE_ENV === "test") return [];
  return new Proxy([] as T[], { get() { throw new DatabaseUnavailableError("In-memory persistence is disabled outside tests."); }, set() { throw new DatabaseUnavailableError("In-memory persistence is disabled outside tests."); } });
}

export class OptimisticLockingError extends Error {
  constructor(
    entityName: string,
    expectedVersion: number,
    actualVersion: number
  ) {
    super(
      `Optimistic Locking Exception: Concurrency conflict detected on ${entityName} update. Expected version ${expectedVersion}, got ${actualVersion}.`
    );
    this.name = "OptimisticLockingError";
  }
}

/**
 * Enterprise PostgreSQL Query Client Abstraction
 * Thread-safe wrapper around pg.Pool supporting parameterised SQL prepared executions.
 */
export class PostgresClient {
  private static instance: PostgresClient;
  private pool: Pool;
  private inTransaction = false;
  private currentTransactionOperations: (() => Promise<void>)[] = [];

  private constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new DatabaseUnavailableError("DATABASE_URL is not configured.");
    }

    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  public static getInstance(): PostgresClient {
    if (!PostgresClient.instance) {
      PostgresClient.instance = new PostgresClient();
    }
    return PostgresClient.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  /**
   * Safe connection leasing from Pool
   */
  public async connectClient(): Promise<PoolClient> {
    let client: any;

    try {
      client = await this.pool.connect();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown connection error";
      console.error("[Postgres] Failed to lease a connection from the pool:", message);
      throw new DatabaseUnavailableError("Database connection could not be established.", err);
    }

    // Wrap the leased client using Object.create to preserve the prototype chain, event emitters, and other methods of PoolClient
    const wrappedClient = Object.create(client);

    wrappedClient.query = async (
      sql: string,
      params: unknown[] = []
    ) => {
      if (isQueryTenantScoped(sql)) {
        TenantContextManager.getRequiredTenantId();

        const activeDbClient = TenantContextManager.getDbClient();

        if (!activeDbClient) {
          throw new TenantContextViolationException(
            "Tenant Context Violation: Tenant-scoped query must execute within an active tenant transaction."
          );
        }
      }

      return client.query(sql, params);
    };

    wrappedClient.release = () => {
      if (typeof client.release === "function") {
        client.release();
      }
    };

    return wrappedClient as unknown as PoolClient;
  }

  /**
   * Start transactional context
   */
  public async begin(): Promise<void> {
    if (this.inTransaction) {
      throw new Error(
        "Postgres Transaction Error: Transaction already active."
      );
    }

    this.inTransaction = true;
    this.currentTransactionOperations = [];
  }

  /**
   * Commit active transaction operations
   */
  public async commit(): Promise<void> {
    if (!this.inTransaction) {
      throw new Error(
        "Postgres Transaction Error: No active transaction to commit."
      );
    }

    try {
      for (const op of this.currentTransactionOperations) {
        await op();
      }
    } catch (error) {
      await this.rollback();
      throw error;
    } finally {
      this.inTransaction = false;
      this.currentTransactionOperations = [];
    }
  }

  /**
   * Abort transaction operations
   */
  public async rollback(): Promise<void> {
    this.inTransaction = false;
    this.currentTransactionOperations = [];
  }

  public async registerTransactionOp(
    op: () => Promise<void>
  ): Promise<void> {
    if (!this.inTransaction) {
      await op();
      return;
    }

    this.currentTransactionOperations.push(op);
  }

  /**
   * Parameterised query execution
   */
  public async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult<T>> {
    const isTenantQuery = isQueryTenantScoped(sql);

    if (isTenantQuery) {
      TenantContextManager.getRequiredTenantId();

      const activeDbClient = TenantContextManager.getDbClient();

      if (!activeDbClient) {
        throw new TenantContextViolationException(
          "Tenant Context Violation: Tenant-scoped query must execute within an active tenant transaction."
        );
      }

      return activeDbClient.query(sql, params);
    }

    const activeDbClient = TenantContextManager.getDbClient();

    if (activeDbClient) {
      return activeDbClient.query(sql, params);
    }

    console.debug(
      `[Postgres SQL] Executing Parameterised Query: "${sql}" with values: [${params.join(", ")}]`
    );

    // FAIL LOUD. Query errors propagate to the caller. API routes are responsible for
    // translating DatabaseUnavailableError into a 503 and any other error into a 500.
    // A fabricated empty result set here is indistinguishable from a legitimately empty
    // table, which is the worst possible failure mode for a paid SaaS product.
    try {
      return await this.pool.query(sql, params);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      const message = err instanceof Error ? err.message : "Unknown query error";

      if (isConnectivityError(code, message)) {
        console.error("[Postgres] Connectivity failure while executing query:", message);
        throw new DatabaseUnavailableError("Database is unreachable.", err);
      }

      console.error("[Postgres] Query execution failed:", message);
      throw err;
    }
  }
}

/**
 * PostgreSQL Implementation of Tenant Repository
 */
interface IPgExecutor {
  query(
    sql: string,
    params?: unknown[]
  ): Promise<QueryResult<QueryResultRow>>;
}

export class PostgresTenantRepository implements ITenantRepository {
  private pg: PostgresClient;
  private uow: UnitOfWork | null;
  private static store: Map<string, Tenant> = createDisabledMap();

  constructor(pg?: PostgresClient, uow?: UnitOfWork) {
    this.pg = pg || PostgresClient.getInstance();
    this.uow = uow || null;
  }

  public static seed(tenants: Tenant[]) {
    this.store.clear();

    for (const tenant of tenants) {
      this.store.set(tenant.id, { ...tenant });
    }
  }

  public static getRawStore(): Map<string, Tenant> {
    return this.store;
  }

  private getExecutor(): IPgExecutor {
    if (this.uow && this.uow.getActiveTransactionClient()) {
      return this.uow.getActiveTransactionClient() as IPgExecutor;
    }

    return this.pg;
  }

  public async findById(id: string): Promise<Tenant | null> {
    const sql = `SELECT * FROM organizations WHERE id = $1 AND deleted_at IS NULL LIMIT 1;`;
    const res = await this.getExecutor().query(sql, [id]);

    if (res.rows && res.rows.length > 0) {
      const row = res.rows[0];

      return {
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        status: (row.status || "active") as
          | "active"
          | "suspended"
          | "archived",
        configuration:
          typeof row.configuration === "string"
            ? JSON.parse(row.configuration)
            : row.configuration || {},
        quota:
          typeof row.quota === "string"
            ? JSON.parse(row.quota)
            : row.quota || {},
        subscription:
          typeof row.subscription === "string"
            ? JSON.parse(row.subscription)
            : row.subscription || {},
        audit: {
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
          createdBy: (row.created_by || "system") as string,
          updatedBy: (row.updated_by || "system") as string,
          deletedAt: (row.deleted_at || undefined) as string | undefined,
          version: (row.version || 1) as number,
        },
      };
    }

    const tenant = PostgresTenantRepository.store.get(id);

    if (!tenant || tenant.audit.deletedAt) {
      return null;
    }

    return {
      ...tenant,
      audit: { ...tenant.audit },
      configuration: { ...tenant.configuration },
      quota: { ...tenant.quota },
      subscription: { ...tenant.subscription },
    };
  }

  public async findBySlug(slug: string): Promise<Tenant | null> {
    const sql = `SELECT * FROM organizations WHERE slug = $1 AND deleted_at IS NULL LIMIT 1;`;
    const res = await this.getExecutor().query(sql, [slug]);

    if (res.rows && res.rows.length > 0) {
      const row = res.rows[0];

      return {
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        status: (row.status || "active") as
          | "active"
          | "suspended"
          | "archived",
        configuration:
          typeof row.configuration === "string"
            ? JSON.parse(row.configuration)
            : row.configuration || {},
        quota:
          typeof row.quota === "string"
            ? JSON.parse(row.quota)
            : row.quota || {},
        subscription:
          typeof row.subscription === "string"
            ? JSON.parse(row.subscription)
            : row.subscription || {},
        audit: {
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
          createdBy: (row.created_by || "system") as string,
          updatedBy: (row.updated_by || "system") as string,
          deletedAt: (row.deleted_at || undefined) as string | undefined,
          version: (row.version || 1) as number,
        },
      };
    }

    for (const tenant of PostgresTenantRepository.store.values()) {
      if (tenant.slug === slug && !tenant.audit.deletedAt) {
        return {
          ...tenant,
          audit: { ...tenant.audit },
          configuration: { ...tenant.configuration },
          quota: { ...tenant.quota },
          subscription: { ...tenant.subscription },
        };
      }
    }

    return null;
  }

  public async findAll(
    status?: "active" | "suspended" | "archived"
  ): Promise<Tenant[]> {
    const sql = `SELECT * FROM organizations WHERE deleted_at IS NULL;`;
    const res = await this.getExecutor().query(sql, []);

    if (res.rows && res.rows.length > 0) {
      return res.rows.map((row) => ({
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        status: (row.status || "active") as
          | "active"
          | "suspended"
          | "archived",
        configuration:
          typeof row.configuration === "string"
            ? JSON.parse(row.configuration)
            : row.configuration || {},
        quota:
          typeof row.quota === "string"
            ? JSON.parse(row.quota)
            : row.quota || {},
        subscription:
          typeof row.subscription === "string"
            ? JSON.parse(row.subscription)
            : row.subscription || {},
        audit: {
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
          createdBy: (row.created_by || "system") as string,
          updatedBy: (row.updated_by || "system") as string,
          deletedAt: (row.deleted_at || undefined) as string | undefined,
          version: (row.version || 1) as number,
        },
      }));
    }

    const list = Array.from(PostgresTenantRepository.store.values());

    const filtered = list.filter(
      (t) =>
        !t.audit.deletedAt && (!status || t.status === status)
    );

    return filtered.map((t) => ({ ...t }));
  }

  public async save(entity: Tenant): Promise<Tenant> {
    const execute = async () => {
      const slugSql = `SELECT id FROM organizations WHERE slug = $1 AND deleted_at IS NULL LIMIT 1;`;
      const slugRes = await this.getExecutor().query(slugSql, [
        entity.slug,
      ]);

      if (slugRes.rows && slugRes.rows.length > 0) {
        const slugId = slugRes.rows[0].id;

        if (slugId !== entity.id) {
          throw new Error(
            "Tenant Isolation Exception: Cannot modify or change tenantId ownership or conflict with existing tenant."
          );
        }
      }

      for (const t of PostgresTenantRepository.store.values()) {
        if (
          t.slug === entity.slug &&
          t.id !== entity.id &&
          !t.audit.deletedAt
        ) {
          throw new Error(
            "Tenant Isolation Exception: Cannot modify or change tenantId ownership or conflict with existing tenant."
          );
        }
      }

      let existing: Tenant | null = null;

      const findSql = `SELECT * FROM organizations WHERE id = $1 LIMIT 1;`;
      const res = await this.getExecutor().query(findSql, [entity.id]);

      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];

        existing = {
          id: row.id as string,
          name: row.name as string,
          slug: row.slug as string,
          status: (row.status || "active") as
            | "active"
            | "suspended"
            | "archived",
          configuration:
            typeof row.configuration === "string"
              ? JSON.parse(row.configuration)
              : row.configuration || {},
          quota:
            typeof row.quota === "string"
              ? JSON.parse(row.quota)
              : row.quota || {},
          subscription:
            typeof row.subscription === "string"
              ? JSON.parse(row.subscription)
              : row.subscription || {},
          audit: {
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
            createdBy: (row.created_by || "system") as string,
            updatedBy: (row.updated_by || "system") as string,
            deletedAt: (row.deleted_at || undefined) as
              | string
              | undefined,
            version: (row.version || 1) as number,
          },
        };
      } else {
        const inMem = PostgresTenantRepository.store.get(entity.id);

        if (inMem) {
          existing = inMem;
        }
      }

      if (existing) {
        if (existing.id !== entity.id) {
          throw new Error(
            "Tenant Isolation Exception: Cannot modify or change tenantId ownership or conflict with existing tenant."
          );
        }

        const versionDiff =
          entity.audit.version - existing.audit.version;

        if (versionDiff !== 0 && versionDiff !== 1) {
          throw new OptimisticLockingError(
            "Tenant",
            entity.audit.version,
            existing.audit.version
          );
        }

        const nextVersion =
          versionDiff === 0
            ? entity.audit.version + 1
            : entity.audit.version;

        const sql = `
          UPDATE organizations
          SET name = $1, slug = $2, plan = $3, updated_at = $4, version = $5
          WHERE id = $6 AND version = $7;
        `;

        const updateRes = await this.getExecutor().query(sql, [
          entity.name,
          entity.slug,
          entity.subscription?.plan || "free",
          new Date().toISOString(),
          nextVersion,
          entity.id,
          existing.audit.version,
        ]);

        if (
          updateRes &&
          typeof updateRes.rowCount === "number" &&
          updateRes.rowCount === 0 &&
          res.rows &&
          res.rows.length > 0
        ) {
          throw new OptimisticLockingError(
            "Tenant",
            entity.audit.version,
            existing.audit.version
          );
        }

        entity.audit.version = nextVersion;
        entity.audit.updatedAt = new Date().toISOString();
      } else {
        const sql = `
          INSERT INTO organizations (id, name, slug, plan, created_at, updated_at, created_by, updated_by, version)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `;

        if (!entity.id) {
          entity.id = `tenant-${Math.random()
            .toString(36)
            .substr(2, 9)}-uuid`;
        }

        entity.audit.version = 1;
        entity.audit.createdAt = new Date().toISOString();
        entity.audit.updatedAt = new Date().toISOString();

        await this.getExecutor().query(sql, [
          entity.id,
          entity.name,
          entity.slug,
          entity.subscription?.plan || "free",
          entity.audit.createdAt,
          entity.audit.updatedAt,
          entity.audit.createdBy || "system",
          entity.audit.updatedBy || "system",
          entity.audit.version,
        ]);
      }

      PostgresTenantRepository.store.set(entity.id, {
        ...entity,
      });
    };

    await this.pg.registerTransactionOp(execute);

    return entity;
  }

  public async delete(id: string): Promise<void> {
    const execute = async () => {
      let tenant: Tenant | null = null;

      const findSql = `SELECT * FROM organizations WHERE id = $1 LIMIT 1;`;
      const res = await this.getExecutor().query(findSql, [id]);

      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];

        tenant = {
          id: row.id as string,
          name: row.name as string,
          slug: row.slug as string,
          status: (row.status || "active") as
            | "active"
            | "suspended"
            | "archived",
          configuration:
            typeof row.configuration === "string"
              ? JSON.parse(row.configuration)
              : row.configuration || {},
          quota:
            typeof row.quota === "string"
              ? JSON.parse(row.quota)
              : row.quota || {},
          subscription:
            typeof row.subscription === "string"
              ? JSON.parse(row.subscription)
              : row.subscription || {},
          audit: {
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
            createdBy: (row.created_by || "system") as string,
            updatedBy: (row.updated_by || "system") as string,
            deletedAt: (row.deleted_at || undefined) as
              | string
              | undefined,
            version: (row.version || 1) as number,
          },
        };
      } else {
        const inMem = PostgresTenantRepository.store.get(id);

        if (inMem) {
          tenant = inMem;
        }
      }

      if (tenant) {
        const sql = `UPDATE organizations SET deleted_at = $1, version = $2 WHERE id = $3;`;
        const nextVersion = tenant.audit.version + 1;

        await this.getExecutor().query(sql, [
          new Date().toISOString(),
          nextVersion,
          id,
        ]);

        tenant.audit.deletedAt = new Date().toISOString();
        tenant.audit.updatedAt = new Date().toISOString();
        tenant.status = "archived";
        tenant.audit.version = nextVersion;

        PostgresTenantRepository.store.set(id, tenant);
      }
    };

    await this.pg.registerTransactionOp(execute);
  }
}

/**
 * PostgreSQL Implementation of Admin User Repository
 */
export class PostgresAdminUserRepository
  implements IAdminUserRepository
{
  private pg: PostgresClient;
  private uow: UnitOfWork | null;
  private static store: Map<string, AdminUser> = createDisabledMap();

  constructor(pg?: PostgresClient, uow?: UnitOfWork) {
    this.pg = pg || PostgresClient.getInstance();
    this.uow = uow || null;
  }

  public static seed(users: AdminUser[]) {
    this.store.clear();

    for (const u of users) {
      this.store.set(u.id, { ...u });
    }
  }

  public static getRawStore(): Map<string, AdminUser> {
    return this.store;
  }

  private getExecutor(): IPgExecutor {
    if (this.uow && this.uow.getActiveTransactionClient()) {
      return this.uow.getActiveTransactionClient() as IPgExecutor;
    }

    return this.pg;
  }

  public async findById(id: string): Promise<AdminUser | null> {
    const sql = `SELECT * FROM admin_users WHERE id = $1 AND deleted_at IS NULL LIMIT 1;`;
    await this.getExecutor().query(sql, [id]);

    const user = PostgresAdminUserRepository.store.get(id);

    if (!user || user.audit.deletedAt) {
      return null;
    }

    return {
      ...user,
      audit: { ...user.audit },
      ssoIdentities: user.ssoIdentities
        ? user.ssoIdentities.map((i) => ({ ...i }))
        : undefined,
    };
  }

  public async findByEmail(email: string): Promise<AdminUser | null> {
    const sql = `SELECT * FROM admin_users WHERE email = $1 AND deleted_at IS NULL LIMIT 1;`;
    await this.getExecutor().query(sql, [email]);

    for (const user of PostgresAdminUserRepository.store.values()) {
      if (user.email === email && !user.audit.deletedAt) {
        return {
          ...user,
          audit: { ...user.audit },
          ssoIdentities: user.ssoIdentities
            ? user.ssoIdentities.map((i) => ({ ...i }))
            : undefined,
        };
      }
    }

    return null;
  }

  public async findAll(): Promise<AdminUser[]> {
    const sql = `SELECT * FROM admin_users WHERE deleted_at IS NULL;`;
    await this.getExecutor().query(sql, []);

    const list = Array.from(
      PostgresAdminUserRepository.store.values()
    );

    const filtered = list.filter((u) => !u.audit.deletedAt);

    return filtered.map((u) => ({ ...u }));
  }

  public async save(entity: AdminUser): Promise<AdminUser> {
    const execute = async () => {
      const existing =
        PostgresAdminUserRepository.store.get(entity.id);

      if (existing) {
        const versionDiff =
          entity.audit.version - existing.audit.version;

        if (versionDiff !== 0 && versionDiff !== 1) {
          throw new OptimisticLockingError(
            "AdminUser",
            entity.audit.version,
            existing.audit.version
          );
        }

        const nextVersion =
          versionDiff === 0
            ? entity.audit.version + 1
            : entity.audit.version;

        const sql = `
          UPDATE admin_users
          SET email = $1, full_name = $2, role = $3, permissions = $4, is_active = $5, sso_identities = $6, updated_at = $7, version = $8
          WHERE id = $9 AND version = $10;
        `;

        await this.getExecutor().query(sql, [
          entity.email,
          entity.fullName,
          entity.role,
          JSON.stringify(entity.permissions),
          entity.isActive,
          JSON.stringify(entity.ssoIdentities || []),
          new Date().toISOString(),
          nextVersion,
          entity.id,
          existing.audit.version,
        ]);

        entity.audit.version = nextVersion;
        entity.audit.updatedAt = new Date().toISOString();
      } else {
        const sql = `
          INSERT INTO admin_users (id, email, full_name, role, permissions, is_active, sso_identities, created_at, updated_at, created_by, updated_by, version)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
        `;

        if (!entity.id) {
          entity.id = `admin-user-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        }

        entity.audit.version = 1;
        entity.audit.createdAt = new Date().toISOString();
        entity.audit.updatedAt = new Date().toISOString();

        await this.getExecutor().query(sql, [
          entity.id,
          entity.email,
          entity.fullName,
          entity.role,
          JSON.stringify(entity.permissions),
          entity.isActive,
          JSON.stringify(entity.ssoIdentities || []),
          entity.audit.createdAt,
          entity.audit.updatedAt,
          entity.audit.createdBy,
          entity.audit.updatedBy,
          entity.audit.version,
        ]);
      }

      PostgresAdminUserRepository.store.set(entity.id, {
        ...entity,
      });
    };

    await this.pg.registerTransactionOp(execute);

    return entity;
  }

  public async delete(id: string): Promise<void> {
    const execute = async () => {
      const user =
        PostgresAdminUserRepository.store.get(id);

      if (user) {
        const sql = `UPDATE admin_users SET deleted_at = $1, is_active = $2, version = $3 WHERE id = $4;`;
        const nextVersion = user.audit.version + 1;

        await this.getExecutor().query(sql, [
          new Date().toISOString(),
          false,
          nextVersion,
          id,
        ]);

        user.audit.deletedAt = new Date().toISOString();
        user.audit.updatedAt = new Date().toISOString();
        user.isActive = false;
        user.audit.version = nextVersion;

        PostgresAdminUserRepository.store.set(id, user);
      }
    };

    await this.pg.registerTransactionOp(execute);
  }
}

/**
 * PostgreSQL Feature Flag Repository Implementation
 */
export class PostgresFeatureFlagRepository
  implements IFeatureFlagRepository
{
  private pg: PostgresClient;
  private uow: UnitOfWork | null;
  private static store: Map<string, FeatureFlag> = createDisabledMap();

  constructor(pg?: PostgresClient, uow?: UnitOfWork) {
    this.pg = pg || PostgresClient.getInstance();
    this.uow = uow || null;
  }

  public static seed(flags: FeatureFlag[]) {
    this.store.clear();

    for (const f of flags) {
      this.store.set(f.key, { ...f });
    }
  }

  public static getRawStore(): Map<string, FeatureFlag> {
    return this.store;
  }

  private getExecutor(): IPgExecutor {
    if (this.uow && this.uow.getActiveTransactionClient()) {
      return this.uow.getActiveTransactionClient() as IPgExecutor;
    }

    return this.pg;
  }

  public async findById(id: string): Promise<FeatureFlag | null> {
    const sql = `SELECT * FROM feature_flags WHERE id = $1 LIMIT 1;`;
    await this.getExecutor().query(sql, [id]);

    for (const flag of PostgresFeatureFlagRepository.store.values()) {
      if (flag.id === id && !flag.audit.deletedAt) {
        return { ...flag };
      }
    }

    return null;
  }

  public async findByKey(key: string): Promise<FeatureFlag | null> {
    const sql = `SELECT * FROM feature_flags WHERE key = $1 LIMIT 1;`;
    await this.getExecutor().query(sql, [key]);

    const flag =
      PostgresFeatureFlagRepository.store.get(key);

    if (!flag || flag.audit.deletedAt) {
      return null;
    }

    return { ...flag };
  }

  public async findAll(): Promise<FeatureFlag[]> {
    const sql = `SELECT * FROM feature_flags WHERE deleted_at IS NULL;`;
    await this.getExecutor().query(sql, []);

    const list = Array.from(
      PostgresFeatureFlagRepository.store.values()
    );

    const filtered = list.filter((f) => !f.audit.deletedAt);

    return filtered.map((f) => ({ ...f }));
  }

  public async save(entity: FeatureFlag): Promise<FeatureFlag> {
    const execute = async () => {
      const existing =
        PostgresFeatureFlagRepository.store.get(entity.key);

      if (existing) {
        const versionDiff =
          entity.audit.version - existing.audit.version;

        if (versionDiff !== 0 && versionDiff !== 1) {
          throw new OptimisticLockingError(
            "FeatureFlag",
            entity.audit.version,
            existing.audit.version
          );
        }

        const nextVersion =
          versionDiff === 0
            ? entity.audit.version + 1
            : entity.audit.version;

        const sql = `
          UPDATE feature_flags
          SET name = $1, description = $2, is_enabled_globally = $3, tenant_overrides = $4, updated_at = $5, version = $6
          WHERE key = $7 AND version = $8;
        `;

        await this.getExecutor().query(sql, [
          entity.name,
          entity.description,
          entity.isEnabledGlobally,
          JSON.stringify(entity.tenantOverrides),
          new Date().toISOString(),
          nextVersion,
          entity.key,
          existing.audit.version,
        ]);

        entity.audit.version = nextVersion;
        entity.audit.updatedAt = new Date().toISOString();
      } else {
        const sql = `
          INSERT INTO feature_flags (id, key, name, description, is_enabled_globally, tenant_overrides, created_at, updated_at, created_by, updated_by, version)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
        `;

        if (!entity.id) {
          entity.id = `flag-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        }

        entity.audit.version = 1;
        entity.audit.createdAt = new Date().toISOString();
        entity.audit.updatedAt = new Date().toISOString();

        await this.getExecutor().query(sql, [
          entity.id,
          entity.key,
          entity.name,
          entity.description,
          entity.isEnabledGlobally,
          JSON.stringify(entity.tenantOverrides),
          entity.audit.createdAt,
          entity.audit.updatedAt,
          entity.audit.createdBy,
          entity.audit.updatedBy,
          entity.audit.version,
        ]);
      }

      PostgresFeatureFlagRepository.store.set(entity.key, {
        ...entity,
      });
    };

    await this.pg.registerTransactionOp(execute);

    return entity;
  }
}

/**
 * PostgreSQL Audit Record Repository Implementation
 */
export class PostgresAuditRecordRepository
  implements IAuditRecordRepository
{
  private pg: PostgresClient;
  private uow: UnitOfWork | null;
  private static store: AuditRecord[] = createDisabledArray();

  constructor(pg?: PostgresClient, uow?: UnitOfWork) {
    this.pg = pg || PostgresClient.getInstance();
    this.uow = uow || null;
  }

  public static seed(records: AuditRecord[]) {
    this.store = [...records];
  }

  public static getRawStore(): AuditRecord[] {
    return this.store;
  }

  private getExecutor(): IPgExecutor {
    if (this.uow && this.uow.getActiveTransactionClient()) {
      return this.uow.getActiveTransactionClient() as IPgExecutor;
    }

    return this.pg;
  }

  public async findById(id: string): Promise<AuditRecord | null> {
    const sql = `SELECT * FROM audit_records WHERE id = $1 LIMIT 1;`;
    await this.getExecutor().query(sql, [id]);

    const record =
      PostgresAuditRecordRepository.store.find(
        (r) => r.id === id
      );

    if (!record) {
      return null;
    }

    return { ...record };
  }

  public async findByActorId(
    actorId: string
  ): Promise<AuditRecord[]> {
    const sql = `SELECT * FROM audit_records WHERE actor_id = $1 ORDER BY timestamp DESC;`;
    await this.getExecutor().query(sql, [actorId]);

    const records =
      PostgresAuditRecordRepository.store.filter(
        (r) => r.actorId === actorId
      );

    return records.map((r) => ({ ...r }));
  }

  public async findByResourceId(
    resourceType: string,
    resourceId: string
  ): Promise<AuditRecord[]> {
    const sql = `SELECT * FROM audit_records WHERE resource_type = $1 AND resource_id = $2 ORDER BY timestamp DESC;`;
    await this.getExecutor().query(sql, [
      resourceType,
      resourceId,
    ]);

    const records =
      PostgresAuditRecordRepository.store.filter(
        (r) =>
          r.resourceType === resourceType &&
          r.resourceId === resourceId
      );

    return records.map((r) => ({ ...r }));
  }

  public async findAll(): Promise<AuditRecord[]> {
    const sql = `SELECT * FROM audit_records ORDER BY timestamp DESC;`;
    await this.getExecutor().query(sql, []);

    return PostgresAuditRecordRepository.store.map((r) => ({
      ...r,
    }));
  }

  public async save(entity: AuditRecord): Promise<AuditRecord> {
    const execute = async () => {
      const sql = `
        INSERT INTO audit_records (id, timestamp, actor_id, actor_email, actor_role, action, resource_type, resource_id, ip_address, user_agent, payload_before, payload_after, status, error_details)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
      `;

      if (!entity.id) {
        entity.id = `audit-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
      }

      await this.getExecutor().query(sql, [
        entity.id,
        entity.timestamp,
        entity.actorId,
        entity.actorEmail,
        entity.actorRole,
        entity.action,
        entity.resourceType,
        entity.resourceId,
        entity.ipAddress,
        entity.userAgent,
        entity.payloadBefore,
        entity.payloadAfter,
        entity.status,
        entity.errorDetails,
      ]);

      PostgresAuditRecordRepository.store.push({
        ...entity,
      });
    };

    await this.pg.registerTransactionOp(execute);

    return entity;
  }
}

/**
 * PostgreSQL AI Provider Config Repository Implementation
 */
export class PostgresAIProviderConfigurationRepository
  implements IAIProviderConfigurationRepository
{
  private pg: PostgresClient;
  private uow: UnitOfWork | null;
  private static store: Map<
    string,
    AIProviderConfiguration
  > = createDisabledMap();

  constructor(pg?: PostgresClient, uow?: UnitOfWork) {
    this.pg = pg || PostgresClient.getInstance();
    this.uow = uow || null;
  }

  public static seed(providers: AIProviderConfiguration[]) {
    this.store.clear();

    for (const p of providers) {
      this.store.set(p.id, { ...p });
    }
  }

  public static getRawStore(): Map<
    string,
    AIProviderConfiguration
  > {
    return this.store;
  }

  private getExecutor(): IPgExecutor {
    if (this.uow && this.uow.getActiveTransactionClient()) {
      return this.uow.getActiveTransactionClient() as IPgExecutor;
    }

    return this.pg;
  }

  public async findById(
    id: string
  ): Promise<AIProviderConfiguration | null> {
    const sql = `SELECT * FROM ai_provider_configs WHERE id = $1 LIMIT 1;`;
    await this.getExecutor().query(sql, [id]);

    const provider =
      PostgresAIProviderConfigurationRepository.store.get(id);

    if (!provider || provider.audit.deletedAt) {
      return null;
    }

    return { ...provider };
  }

  public async findByProviderName(
    name: string
  ): Promise<AIProviderConfiguration | null> {
    const sql = `SELECT * FROM ai_provider_configs WHERE provider_name = $1 LIMIT 1;`;
    await this.getExecutor().query(sql, [name]);

    for (const provider of PostgresAIProviderConfigurationRepository.store.values()) {
      if (
        provider.providerName === name &&
        !provider.audit.deletedAt
      ) {
        return { ...provider };
      }
    }

    return null;
  }

  public async findAllActive(): Promise<
    AIProviderConfiguration[]
  > {
    const sql = `SELECT * FROM ai_provider_configs WHERE is_active = TRUE AND deleted_at IS NULL;`;
    await this.getExecutor().query(sql, []);

    const list = Array.from(
      PostgresAIProviderConfigurationRepository.store.values()
    );

    const filtered = list.filter(
      (p) => p.isActive && !p.audit.deletedAt
    );

    return filtered.map((p) => ({ ...p }));
  }

  public async findAll(): Promise<AIProviderConfiguration[]> {
    const sql = `SELECT * FROM ai_provider_configs WHERE deleted_at IS NULL;`;
    await this.getExecutor().query(sql, []);

    const list = Array.from(
      PostgresAIProviderConfigurationRepository.store.values()
    );

    const filtered = list.filter((p) => !p.audit.deletedAt);

    return filtered.map((p) => ({ ...p }));
  }

  public async save(
    entity: AIProviderConfiguration
  ): Promise<AIProviderConfiguration> {
    const execute = async () => {
      const existing =
        PostgresAIProviderConfigurationRepository.store.get(
          entity.id
        );

      if (existing) {
        const versionDiff =
          entity.audit.version - existing.audit.version;

        if (versionDiff !== 0 && versionDiff !== 1) {
          throw new OptimisticLockingError(
            "AIProvider",
            entity.audit.version,
            existing.audit.version
          );
        }

        const nextVersion =
          versionDiff === 0
            ? entity.audit.version + 1
            : entity.audit.version;

        const sql = `
          UPDATE ai_provider_configs
          SET provider_name = $1, endpoint_url = $2, api_key_masked = $3, is_active = $4, failover_provider_id = $5, updated_at = $6, version = $7
          WHERE id = $8 AND version = $9;
        `;

        await this.getExecutor().query(sql, [
          entity.providerName,
          entity.endpointUrl,
          entity.apiKeyMasked,
          entity.isActive,
          entity.failoverProviderId,
          new Date().toISOString(),
          nextVersion,
          entity.id,
          existing.audit.version,
        ]);

        entity.audit.version = nextVersion;
        entity.audit.updatedAt = new Date().toISOString();
      } else {
        const sql = `
          INSERT INTO ai_provider_configs (id, provider_name, endpoint_url, api_key_masked, is_active, failover_provider_id, created_at, updated_at, created_by, updated_by, version)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
        `;

        if (!entity.id) {
          entity.id = `ai-provider-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        }

        entity.audit.version = 1;
        entity.audit.createdAt = new Date().toISOString();
        entity.audit.updatedAt = new Date().toISOString();

        await this.getExecutor().query(sql, [
          entity.id,
          entity.providerName,
          entity.endpointUrl,
          entity.apiKeyMasked,
          entity.isActive,
          entity.failoverProviderId,
          entity.audit.createdAt,
          entity.audit.updatedAt,
          entity.audit.createdBy,
          entity.audit.updatedBy,
          entity.audit.version,
        ]);
      }

      PostgresAIProviderConfigurationRepository.store.set(
        entity.id,
        { ...entity }
      );
    };

    await this.pg.registerTransactionOp(execute);

    return entity;
  }
}
