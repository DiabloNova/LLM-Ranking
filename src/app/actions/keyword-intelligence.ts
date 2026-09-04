"use server";

import { requireSession } from "@/services/auth/session";
import { requireWorkspaceMembership } from "@/services/auth/authorization";
import { TenantContextManager } from "@/core/database/tenant-context";
import {
  KeywordRepository,
  PageRepository,
  WebsiteRepository,
  CompetitorRepository,
  CompetitiveSeoFindingRepository,
  EntityRepository,
  TopicRepository,
  PromptIntelligenceRepository,
} from "@/features/ai-intelligence/repositories";
import { KeywordIntelligenceService } from "@/features/ai-intelligence/services/keyword-intelligence-service";

/**
 * Server Action: Analyzes keyword intelligence for the authenticated active tenant context.
 * Performs deterministic keyword discovery, clustering, search intent classification,
 * opportunity scoring, semantic discovery, long-tail variants, and keyword gap analysis.
 */
export async function getKeywordIntelligenceAction() {
  let session;
  try {
    session = await requireSession();
    if (!session.user) throw new Error("Unauthorized");
    await requireWorkspaceMembership(session.user.id, session.user.workspaceId);
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unauthorized",
    };
  }

  const tenantId = session.user.workspaceId;
  const userId = session.user.id;

  try {
    const requestId = `req-keyword-intel-${Date.now()}`;

    return await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      requestId,
      async () => {
        const keywordRepo = new KeywordRepository();
        const pageRepo = new PageRepository();
        const websiteRepo = new WebsiteRepository();
        const competitorRepo = new CompetitorRepository();
        const findingRepo = new CompetitiveSeoFindingRepository();
        const entityRepo = new EntityRepository();
        const topicRepo = new TopicRepository();
        const promptRepo = new PromptIntelligenceRepository();

        const service = new KeywordIntelligenceService(
          keywordRepo,
          pageRepo,
          websiteRepo,
          competitorRepo,
          findingRepo,
          entityRepo,
          topicRepo,
          promptRepo,
        );

        const result = await service.analyzeKeywords(tenantId);

        return {
          success: true,
          result,
        };
      },
    );
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Internal Server Error",
    };
  }
}
