import { PromptIntelligenceService } from "../../ai-intelligence/services/prompt-intelligence-service";
import { ObservationService } from "../../ai-intelligence/services/observation-service";
import { MonitoringAlertRepository } from "../repositories/monitoring-alert-repository";
import { TenantContextManager } from "../../../core/database/tenant-context";

export class AIVisibilityMonitoringService {
  private promptIntelligenceService: PromptIntelligenceService;
  private observationService: ObservationService;
  private alertRepository: MonitoringAlertRepository;

  constructor() {
    this.promptIntelligenceService = new PromptIntelligenceService();
    this.observationService = new ObservationService();
    this.alertRepository = new MonitoringAlertRepository();
  }

  public async runScheduledMonitoring(): Promise<void> {
    const schedules = await this.promptIntelligenceService["repo"].findActiveSchedules();
    for (const schedule of schedules) {
      if (!schedule.enabled) continue;

      try {
        await TenantContextManager.runWithTenantContext(schedule.organizationId, null, null, async () => {
          const promptDef = await this.promptIntelligenceService["repo"].findDefinitionById(schedule.organizationId, schedule.promptId);
          if (!promptDef) return;

          const execution = await this.promptIntelligenceService.executePrompt(
            schedule.organizationId,
            schedule.promptId,
            {},
            "gpt-4-turbo" // Default model for monitoring, can be customized
          );

          if (execution.status === "succeeded" && execution.responseText) {
             // Basic sentiment/visibility mock evaluation based on response text length.
             const visibilityScore = Math.min(100, execution.responseText.length / 10);
             const sentimentScore = execution.responseText.toLowerCase().includes("best") ? 90 : 50;

             // Find previous observation for this prompt and model to do comparison
             const previousObservations = await this.observationService["obsRepo"].findByPromptId(
               schedule.organizationId,
               schedule.promptId,
               { limit: 2 }
             );

             const observationAggr = await this.observationService.processObservation(
                schedule.organizationId,
                schedule.promptId,
                "engine-default",
                execution.responseText,
                visibilityScore,
                sentimentScore
             );

             // ALERTS DETECTION
             // Find previous observation (excluding the one we just created)
             const previousObservation = previousObservations.data?.find((o: any) => o.id !== observationAggr.observation.id);

             if (previousObservation) {
                 const prevMentions = await this.observationService["obsRepo"].findMentionsByObservationId(schedule.organizationId, previousObservation.id);
                 const currMentions = await this.observationService["obsRepo"].findMentionsByObservationId(schedule.organizationId, observationAggr.observation.id);

                 const prevCompMentions = await this.observationService["obsRepo"].findCompetitorMentionsByObservationId(schedule.organizationId, previousObservation.id);
                 const currCompMentions = await this.observationService["obsRepo"].findCompetitorMentionsByObservationId(schedule.organizationId, observationAggr.observation.id);

                 const prevCitations = await this.observationService["obsRepo"].findCitationsByObservationId(schedule.organizationId, previousObservation.id);
                 const currCitations = await this.observationService["obsRepo"].findCitationsByObservationId(schedule.organizationId, observationAggr.observation.id);

                 const alerts = [];

                 // 1. Brand visibility change (score diff > 10%)
                 const prevScore = previousObservation.visibilityScore;
                 const currScore = observationAggr.observation.visibilityScore;
                 if (Math.abs(currScore - prevScore) > 10) {
                     alerts.push({
                         alertType: "VISIBILITY_CHANGE",
                         severity: currScore < prevScore ? "high" : "low",
                         message: `Brand visibility changed from ${prevScore} to ${currScore}`,
                         eventMetadata: {
                             previousState: prevScore,
                             newState: currScore,
                             provider: execution.provider,
                             model: execution.model,
                             promptId: schedule.promptId
                         },
                         dedupKey: `vis-change-${observationAggr.observation.id}`
                     });
                 }

                 // 2. Brand disappearance
                 console.log("Detecting brand disappearance with prev:", prevMentions?.length, "curr:", currMentions?.length);
                 if (prevMentions && prevMentions.length > 0 && (!currMentions || currMentions.length === 0)) {
                     alerts.push({
                         alertType: "BRAND_DISAPPEARED",
                         severity: "critical",
                         message: "Brand mention disappeared from AI response",
                         eventMetadata: {
                             provider: execution.provider,
                             model: execution.model,
                             promptId: schedule.promptId
                         },
                         dedupKey: `brand-gone-${observationAggr.observation.id}`
                     });
                 }

                 // 3. Competitor visibility change
                 if (prevCompMentions.length !== currCompMentions.length) {
                     alerts.push({
                         alertType: "COMPETITOR_VISIBILITY_CHANGE",
                         severity: currCompMentions.length > prevCompMentions.length ? "medium" : "low",
                         message: `Competitor mentions changed from ${prevCompMentions.length} to ${currCompMentions.length}`,
                         eventMetadata: {
                             previousState: prevCompMentions.length,
                             newState: currCompMentions.length,
                             provider: execution.provider,
                             model: execution.model,
                             promptId: schedule.promptId
                         },
                         dedupKey: `comp-vis-${observationAggr.observation.id}`
                     });
                 }

                 // 4. Citation presence changes
                 if (prevCitations.length !== currCitations.length) {
                     alerts.push({
                         alertType: "CITATION_PRESENCE_CHANGE",
                         severity: "medium",
                         message: `Citations changed from ${prevCitations.length} to ${currCitations.length}`,
                         eventMetadata: {
                             previousState: prevCitations.length,
                             newState: currCitations.length,
                             provider: execution.provider,
                             model: execution.model,
                             promptId: schedule.promptId
                         },
                         dedupKey: `cit-change-${observationAggr.observation.id}`
                     });
                 }

                 // Save alerts
                 for (const alert of alerts) {
                    await this.alertRepository.create({
                        monitoringConfigId: schedule.id, // Using schedule ID as config ID for AI visibility
                        snapshotId: null, // Since this is not a crawl
                        ...alert
                    });
                 }
             }

             schedule.lastExecutionAt = new Date().toISOString();
             await this.promptIntelligenceService["repo"].saveSchedule(schedule);
          }
        });
      } catch (err) {
         console.error(`[AIVisibilityMonitoringService] Failed to execute schedule ${schedule.id}`, err);
         schedule.failureReason = err instanceof Error ? err.message : String(err);
         try {
            await TenantContextManager.runWithTenantContext(schedule.organizationId, null, null, async () => {
               await this.promptIntelligenceService["repo"].saveSchedule(schedule);
            });
         } catch(e) {}
      }
    }
  }
}
