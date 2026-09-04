import { inngest } from "../client";
import { TenantContextManager } from "../../../core/database/tenant-context";
import { prompts, visibilityScores, aiEngines } from "../../../../database/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

type EvaluatePromptsData = {
  organizationId: string;
  userId: string | null;
};

export const evaluatePrompts = inngest.createFunction(
  { id: "evaluate-prompts", triggers: [{ event: "seorchable/evaluate.prompts" }] },
  async ({ event, step }: { event: { data: unknown }; step: { run: (name: string, cb: () => Promise<unknown>) => Promise<unknown> } }) => {
    const data = event.data as unknown as EvaluatePromptsData;
    const { organizationId, userId } = data;

    if (!organizationId) {
      return { success: false, error: "Missing organizationId in event data" };
    }

    try {
      // Step 1: Fetch active prompts for the tenant
      const activePrompts = await step.run("fetch-active-prompts", async () => {
        return await TenantContextManager.runWithTenantContext(organizationId, userId, null, async () => {
          const db = drizzle(TenantContextManager.getDbClient());
          return await db.select().from(prompts).where(eq(prompts.isActive, true));
        });
      });

      if (!activePrompts || (activePrompts as Array<unknown>).length === 0) {
        return { success: true, message: "No active prompts found to evaluate" };
      }

      // Step 2: Fetch an active AI Engine for evaluation
      const engine = await step.run("fetch-active-engine", async () => {
        return await TenantContextManager.runWithTenantContext(organizationId, userId, null, async () => {
          const db = drizzle(TenantContextManager.getDbClient());
          const engines = await db.select().from(aiEngines).where(eq(aiEngines.isActive, true)).limit(1);
          return engines[0] || null;
        });
      });

      if (!engine) {
        return { success: false, error: "No active AI engine available" };
      }

      // Step 3: Simulate Evaluation
      const evaluations = (await step.run("simulate-evaluation", async () => {
        return (activePrompts as Array<{ id: string; brandId: string }>).map((prompt) => {
          // Simulating sentiment analysis, mention detection, etc.
          const overallScore = Math.floor(Math.random() * 100);
          const presenceRate = Math.random();
          const avgPosition = Math.random() * 10 + 1;
          const netSentiment = Math.random() * 100;

          return {
            promptId: prompt.id,
            brandId: prompt.brandId,
            overallScore,
            presenceRate,
            avgPosition,
            netSentiment,
          };
        });
      })) as Array<{ promptId: string; brandId: string; overallScore: number; presenceRate: number; avgPosition: number; netSentiment: number }>;

      // Step 4: Save Visibility Results
      await step.run("save-visibility-results", async () => {
        await TenantContextManager.runWithTenantContext(organizationId, userId, null, async () => {
          const db = drizzle(TenantContextManager.getDbClient());
          const recordsToInsert = evaluations.map((evalData) => ({
            organizationId,
            brandId: evalData.brandId,
            engineId: (engine as { id: string }).id,
            overallScore: evalData.overallScore,
            presenceRate: evalData.presenceRate,
            avgPosition: evalData.avgPosition,
            netSentiment: evalData.netSentiment,
            recordedAt: new Date(),
          }));

          if (recordsToInsert.length > 0) {
            await db.insert(visibilityScores).values(recordsToInsert);
          }
        });
      });

      return {
        success: true,
        message: `Successfully evaluated ${evaluations.length} prompts`,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown evaluation error";
      return { success: false, error: errorMessage };
    }
  }
);
