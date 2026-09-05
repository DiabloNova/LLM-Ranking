import { createDrizzle } from "@/core/database/drizzle";
import { inngest } from "./client";
import { TenantContextManager } from "../../core/database/tenant-context";
import { RecommendationEngineService } from "../../features/recommendations/services/recommendation-engine-service";
import { AIVisibilityMonitoringService } from "../../features/monitoring/services/ai-visibility-monitoring-service";

export const helloWorld = inngest.createFunction(
  { id: "hello-world", triggers: [{ event: "test/hello.world" }] },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { event, body: "Hello, World!" };
  },
);

export const scheduledMonitoring = inngest.createFunction(
  { id: "scheduled-ai-visibility-monitoring", triggers: [{ cron: "0 * * * *" }] },
  async ({ step }) => {
    await step.run("execute-ai-visibility-monitoring", async () => {
      console.log("Starting scheduled AI Visibility Monitoring job...");
      const service = new AIVisibilityMonitoringService();
      await service.runScheduledMonitoring();
      return { status: "success", timestamp: new Date().toISOString() };
    });
    return { message: "Scheduled AI Visibility monitoring completed" };
  },
);

export const automatedRecommendationsDiagnosis = inngest.createFunction(
  { id: "automated-recommendations-diagnosis", triggers: [{ cron: "0 2 * * *" }] },
  async ({ step }) => {
    await step.run("execute-recommendations-diagnosis", async () => {
      console.log("Starting Automated Recommendations Diagnosis job...");
      const service = new RecommendationEngineService();

      // Uses the core connection manager rather than relying on global.pgClient.
      const client = TenantContextManager.getDbClient();
      if (!client) {
        throw new Error("automated-recommendations-diagnosis: database client unavailable");
      }
      const db = createDrizzle(client);
      const res = await db.execute('SELECT id FROM organizations');

      for (const row of res.rows) {
        await service.runDiagnosisForTenant(row.id as string);
      }

      return { status: "success", timestamp: new Date().toISOString() };
    });
    return { message: "Automated Recommendations diagnosis completed" };
  },
);
