import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { runAudit } from "@/lib/inngest/functions/run-audit";
import { evaluatePrompts } from "@/lib/inngest/functions/ai-visibility";
import {
  helloWorld,
  scheduledMonitoring,
  automatedRecommendationsDiagnosis,
} from "@/lib/inngest/functions";

/**
 * Every Inngest function must be listed here: this route is the only place the app hands
 * its function set to Inngest. Previously only `runAudit` was registered, so the two cron
 * functions (`scheduled-ai-visibility-monitoring`, `automated-recommendations-diagnosis`)
 * and the `evaluate-prompts` event function were defined but never executed.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    runAudit,
    evaluatePrompts,
    helloWorld,
    scheduledMonitoring,
    automatedRecommendationsDiagnosis,
  ],
});
