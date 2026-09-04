import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { TenantContextManager } from "../../../core/database/tenant-context";
import { monitoringConfigs } from "../../../../database/schema";
import { MonitoringConfig } from "../domain/entities/monitoring-config";

export class MonitoringConfigRepository {
  public async findById(id: string): Promise<MonitoringConfig | null> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const ctx = TenantContextManager.getContext();
    const db = drizzle(ctx?.dbClient || (global as any).pgClient);

    const rows = await db
      .select()
      .from(monitoringConfigs)
      .where(and(
        eq(monitoringConfigs.id, id),
        eq(monitoringConfigs.organizationId, tenantId)
      ))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      tenantId: row.organizationId,
      websiteId: row.websiteId,
      enabled: row.enabled,
      schedule: row.schedule,
      crawlUrl: row.crawlUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }
}
