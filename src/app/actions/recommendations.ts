"use server";

import { revalidatePath } from "next/cache";
import { getServerSessionAction } from "./auth";
import { AutomatedRecommendationRepository } from "../../features/recommendations/repositories/automated-recommendation-repository";
import { TenantContextManager } from "../../core/database/tenant-context";
import { AutomatedRecommendation } from "../../features/recommendations/domain/entities/automated-recommendation";

const repo = new AutomatedRecommendationRepository();

export async function getRecommendationsAction(): Promise<AutomatedRecommendation[]> {
  const session = await getServerSessionAction();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const tenantId = session.user.workspaceId;

  let recommendations: AutomatedRecommendation[] = [];

  await TenantContextManager.runWithTenantContext(tenantId, session.user.id, null, async () => {
    recommendations = await repo.findAllPending();
  });

  return recommendations;
}

export async function applyRecommendationAction(id: string): Promise<void> {
  const session = await getServerSessionAction();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const tenantId = session.user.workspaceId;

  await TenantContextManager.runWithTenantContext(tenantId, session.user.id, null, async () => {
    await repo.updateStatus(id, "applied");
  });

  revalidatePath("/", "layout");
}

export async function dismissRecommendationAction(id: string): Promise<void> {
  const session = await getServerSessionAction();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const tenantId = session.user.workspaceId;

  await TenantContextManager.runWithTenantContext(tenantId, session.user.id, null, async () => {
    await repo.updateStatus(id, "dismissed");
  });

  revalidatePath("/", "layout");
}
