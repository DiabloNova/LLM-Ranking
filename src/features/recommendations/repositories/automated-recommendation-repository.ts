import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { TenantContextManager } from "../../../core/database/tenant-context";
import { automatedRecommendations } from "../../../../database/schema";
import { AutomatedRecommendation } from "../domain/entities/automated-recommendation";

export class AutomatedRecommendationRepository {
  public async createOrUpdate(rec: Omit<AutomatedRecommendation, "id" | "createdAt" | "updatedAt">): Promise<void> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const ctx = TenantContextManager.getContext();
    const db = drizzle(ctx?.dbClient || (global as any).pgClient);

    const existing = await db
      .select()
      .from(automatedRecommendations)
      .where(and(
        eq(automatedRecommendations.organizationId, tenantId),
        eq(automatedRecommendations.dedupKey, rec.dedupKey),
        eq(automatedRecommendations.status, "pending")
      ))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(automatedRecommendations)
        .set({
          title: rec.title,
          description: rec.description,
          priorityScore: rec.priorityScore,
          recommendedAction: rec.recommendedAction,
          updatedAt: new Date()
        })
        .where(eq(automatedRecommendations.id, existing[0].id));
    } else {
      await db
        .insert(automatedRecommendations)
        .values({
          organizationId: tenantId,
          websiteId: rec.websiteId || null,
          title: rec.title,
          description: rec.description,
          type: rec.type,
          priorityScore: rec.priorityScore,
          status: rec.status,
          recommendedAction: rec.recommendedAction,
          dedupKey: rec.dedupKey
        });
    }
  }

  public async findAllPending(): Promise<AutomatedRecommendation[]> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const ctx = TenantContextManager.getContext();
    const db = drizzle(ctx?.dbClient || (global as any).pgClient);

    const rows = await db
      .select()
      .from(automatedRecommendations)
      .where(and(
        eq(automatedRecommendations.organizationId, tenantId),
        eq(automatedRecommendations.status, "pending")
      ))
      .orderBy(desc(automatedRecommendations.priorityScore), desc(automatedRecommendations.createdAt));

    return rows.map(row => ({
      id: row.id,
      organizationId: row.organizationId,
      websiteId: row.websiteId || undefined,
      title: row.title,
      description: row.description,
      type: row.type,
      priorityScore: row.priorityScore,
      status: row.status,
      recommendedAction: row.recommendedAction,
      dedupKey: row.dedupKey,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  }

  public async updateStatus(id: string, status: "applied" | "dismissed"): Promise<void> {
    const tenantId = TenantContextManager.getRequiredTenantId();
    const ctx = TenantContextManager.getContext();
    const db = drizzle(ctx?.dbClient || (global as any).pgClient);

    await db
      .update(automatedRecommendations)
      .set({ status, updatedAt: new Date() })
      .where(and(
        eq(automatedRecommendations.id, id),
        eq(automatedRecommendations.organizationId, tenantId)
      ));
  }
}
