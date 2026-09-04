import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { TenantContextManager } from "../../../core/database/tenant-context";
import { crawlSnapshots } from "../../../../database/schema";
import { CrawlSnapshot, SnapshotPage } from "../domain/entities/crawl-snapshot";

export class CrawlSnapshotRepository {
  public async create(snapshot: CrawlSnapshot): Promise<CrawlSnapshot> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const ctx = TenantContextManager.getContext();
    const db = drizzle(ctx?.dbClient || (global as any).pgClient);

    const rows = await db
      .insert(crawlSnapshots)
      .values({
        id: snapshot.id,
        organizationId: tenantId,
        monitoringConfigId: snapshot.monitoringConfigId,
        websiteId: snapshot.websiteId,
        capturedAt: snapshot.capturedAt,
        pages: snapshot.pages,
        totalPages: snapshot.totalPages,
        indexablePages: snapshot.indexablePages,
        nonIndexablePages: snapshot.nonIndexablePages,
        error4xxCount: snapshot.error4xxCount,
        error5xxCount: snapshot.error5xxCount,
        robotsTxtAvailable: snapshot.robotsTxtAvailable,
        sitemapAvailable: snapshot.sitemapAvailable
      })
      .returning();

    const row = rows[0];
    return {
      id: row.id,
      tenantId: row.organizationId,
      monitoringConfigId: row.monitoringConfigId,
      websiteId: row.websiteId,
      capturedAt: row.capturedAt,
      pages: row.pages as SnapshotPage[],
      totalPages: row.totalPages,
      indexablePages: row.indexablePages,
      nonIndexablePages: row.nonIndexablePages,
      error4xxCount: row.error4xxCount,
      error5xxCount: row.error5xxCount,
      robotsTxtAvailable: row.robotsTxtAvailable,
      sitemapAvailable: row.sitemapAvailable
    };
  }

  public async findLatestSuccessful(
    monitoringConfigId: string
  ): Promise<CrawlSnapshot | null> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const ctx = TenantContextManager.getContext();
    const db = drizzle(ctx?.dbClient || (global as any).pgClient);

    const rows = await db
      .select()
      .from(crawlSnapshots)
      .where(and(
        eq(crawlSnapshots.monitoringConfigId, monitoringConfigId),
        eq(crawlSnapshots.organizationId, tenantId)
      ))
      .orderBy(desc(crawlSnapshots.capturedAt))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      tenantId: row.organizationId,
      monitoringConfigId: row.monitoringConfigId,
      websiteId: row.websiteId,
      capturedAt: row.capturedAt,
      pages: row.pages as SnapshotPage[],
      totalPages: row.totalPages,
      indexablePages: row.indexablePages,
      nonIndexablePages: row.nonIndexablePages,
      error4xxCount: row.error4xxCount,
      error5xxCount: row.error5xxCount,
      robotsTxtAvailable: row.robotsTxtAvailable,
      sitemapAvailable: row.sitemapAvailable
    };
  }
}
