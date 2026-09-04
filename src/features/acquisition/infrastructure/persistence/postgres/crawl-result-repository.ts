import type { PoolClient, QueryResultRow } from "pg";
import type { CrawlResult } from "../../../domain/contracts";
import { TenantContextManager } from "../../../../../core/database/tenant-context";

interface ResultRow extends QueryResultRow {
  id: string;
  tenant_id: string;
  job_id: string;
  result: CrawlResult;
  created_at: Date;
}

function client(): PoolClient {
  const value = TenantContextManager.getDbClient() as PoolClient | null;
  if (!value) {
    throw new Error("Crawl result persistence requires an active transaction");
  }
  return value;
}

export class CrawlResultRepository {
  public async put(jobId: string, result: CrawlResult): Promise<string> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const response = await client().query<ResultRow>(
      `INSERT INTO crawl_results (tenant_id, job_id, result)
       VALUES ($1, $2, $3)
       RETURNING id, tenant_id, job_id, result, created_at`,
      [tenantId, jobId, JSON.stringify(result)]
    );
    return response.rows[0].id;
  }

  public async getByJobId(jobId: string): Promise<CrawlResult | null> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const response = await client().query<ResultRow>(
      `SELECT id, tenant_id, job_id, result, created_at
       FROM crawl_results
       WHERE tenant_id = $1 AND job_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [tenantId, jobId]
    );
    return response.rows[0]?.result ?? null;
  }
}
