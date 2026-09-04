"use server";

import { secureServerActionNoInput } from "@/lib/safe-action";
import { TenantContextManager } from "@/core/database/tenant-context";
import { drizzle } from "drizzle-orm/node-postgres";
import { audits } from "../../../database/schema/audits";
import { eq } from "drizzle-orm";

export const getDashboardStatsAction = secureServerActionNoInput(
  async (ctx) => {
    return await TenantContextManager.runWithTenantContext(
      ctx.workspaceId!,
      ctx.userId,
      "dashboard-stats",
      async () => {
        const client = TenantContextManager.getDbClient();
        if (!client) {
          throw new Error("Failed to get DB client in tenant context");
        }
        const db = drizzle(client);

        const allAudits = await db
          .select()
          .from(audits)
          .where(eq(audits.workspaceId, ctx.workspaceId!));

        const totalAudits = allAudits.length;
        const completedAudits = allAudits.filter(a => a.status === "completed");

        let averageOverallHealthScore = "N/A" as number | "N/A";
        let technicalHealth = "N/A" as number | "N/A";
        let contentHealth = "N/A" as number | "N/A";

        let sumOverallScore = 0;
        let sumTechnicalScore = 0;
        let sumContentScore = 0;
        let countOverallScore = 0;
        let countTechnicalScore = 0;
        let countContentScore = 0;

        completedAudits.forEach(a => {
          let insights: Record<string, unknown> = {};
          if (a.aiInsights) {
             if (typeof a.aiInsights === 'string') {
               try {
                 insights = JSON.parse(a.aiInsights);
               } catch (e) {
                 insights = {};
               }
             } else if (typeof a.aiInsights === 'object' && !Array.isArray(a.aiInsights) && a.aiInsights !== null) {
               insights = a.aiInsights as Record<string, unknown>;
             }
          }

          if (typeof insights.overallHealthScore === 'number') {
            sumOverallScore += insights.overallHealthScore;
            countOverallScore++;
          }
          if (typeof insights.technicalHealthScore === 'number') {
            sumTechnicalScore += insights.technicalHealthScore;
            countTechnicalScore++;
          }
          if (typeof insights.contentHealthScore === 'number') {
            sumContentScore += insights.contentHealthScore;
            countContentScore++;
          }
        });

        if (countOverallScore > 0) {
          averageOverallHealthScore = Math.round(sumOverallScore / countOverallScore);
        }
        if (countTechnicalScore > 0) {
          technicalHealth = Math.round(sumTechnicalScore / countTechnicalScore);
        }
        if (countContentScore > 0) {
          contentHealth = Math.round(sumContentScore / countContentScore);
        }

        return {
          totalAudits,
          completedAudits: completedAudits.length,
          seoHealth: averageOverallHealthScore,
          aiVisibility: "N/A" as const,
          brandAuthority: "N/A" as const,
          citationVisibility: "N/A" as const,
          technicalHealth,
          contentHealth,
          competitivePosition: "N/A" as const,
        };
      }
    );
  }
);
