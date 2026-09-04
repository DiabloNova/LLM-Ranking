import { PostgresClient } from "../../../features/admin/infrastructure/persistence/postgres";
import { ApiKey } from "../domain/types";

export class ApiKeyRepository {
  private pg: PostgresClient;

  constructor() {
    this.pg = PostgresClient.getInstance();
  }

  async create(data: Omit<ApiKey, "id" | "createdAt" | "updatedAt">): Promise<ApiKey> {
    const sql = `
      INSERT INTO api_keys (organization_id, name, prefix, hash, is_active, expires_at, created_by, revoked_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const params = [
      data.organizationId,
      data.name,
      data.prefix,
      data.hash,
      data.isActive,
      data.expiresAt,
      data.createdBy,
      data.revokedAt
    ];

    // RLS will enforce the insert uses current tenant_id matching $1
    const res = await this.pg.query(sql, params);
    const row = res.rows[0];

    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      prefix: row.prefix,
      hash: row.hash,
      isActive: row.is_active,
      expiresAt: row.expires_at ? new Date(row.expires_at) : null,
      lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
    };
  }

  async findByPrefix(prefix: string): Promise<ApiKey | null> {
    const sql = `SELECT * FROM api_keys WHERE prefix = $1 LIMIT 1;`;
    const res = await this.pg.query(sql, [prefix]);

    if (!res.rows || res.rows.length === 0) return null;
    const row = res.rows[0];

    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      prefix: row.prefix,
      hash: row.hash,
      isActive: row.is_active,
      expiresAt: row.expires_at ? new Date(row.expires_at) : null,
      lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
    };
  }

  async updateLastUsed(id: string): Promise<void> {
    const sql = `UPDATE api_keys SET last_used_at = NOW(), updated_at = NOW() WHERE id = $1;`;
    await this.pg.query(sql, [id]);
  }
}
