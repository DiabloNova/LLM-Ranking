import assert from "node:assert/strict";
import { AIVisibilityMonitoringService } from "../../../src/features/monitoring/services/ai-visibility-monitoring-service";
import { TenantContextManager } from "../../../src/core/database/tenant-context";

export async function runAIVisibilityMonitoringTests() {
  console.log("Starting AI Visibility Monitoring Tests...");

  const mockTenantId = "tenant-1";
  const mockPromptId = "prompt-1";

  const monitoringService = new AIVisibilityMonitoringService();
  const promptIntelligenceService = monitoringService["promptIntelligenceService"];
  const observationService = monitoringService["observationService"];
  const alertRepository = monitoringService["alertRepository"];

  const { db } = require("../../../src/features/ai-intelligence/repositories/index");
  db.prompts.set(mockPromptId, {
     id: mockPromptId,
     organizationId: mockTenantId,
     brandId: "brand-1",
     text: "Mock query",
     category: "general",
     intent: "informational",
     language: "en",
     priority: "high",
     audit: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: "user", updatedBy: "user", version: 1 }
  });
  db.promptDefinitions.set(mockPromptId, {
     id: mockPromptId,
     organizationId: mockTenantId,
     brandId: "brand-1",
     name: "Mock prompt",
     promptTemplate: "Mock template",
     category: "general",
     intent: "informational",
     locale: "en",
     isActive: true,
     variables: [],
     competitors: [],
     tags: [],
     audit: { createdAt: new Date(), updatedAt: new Date(), createdBy: "user", updatedBy: "user", version: 1 }
  });

  let activeTenantContext: string | null = null;
  const mockRunContext = async <T>(tenantId: string, _uid: any, _req: any, work: () => Promise<T>) => {
      activeTenantContext = tenantId;
      try {
          return await work();
      } finally {
          activeTenantContext = null;
      }
  };

  TenantContextManager.runWithTenantContext = mockRunContext as any;
  TenantContextManager.getRequiredTenantId = () => mockTenantId;

  await TenantContextManager.runWithTenantContext(mockTenantId, "user-1", null, async () => {
    // 1. monitoring schedule creation
    const createdSchedule = await promptIntelligenceService.schedulePrompt(
      mockTenantId,
      mockPromptId,
      "0 0 * * *",
      "UTC",
      "user-1"
    );
    assert.ok(createdSchedule.id, "Schedule should be created");

    // Pre-seed some mock data for observations and executions
    const mockExecution = {
      id: "exec-1",
      organizationId: mockTenantId,
      promptId: mockPromptId,
      promptVersion: 1,
      resolvedPromptText: "Mock prompt",
      variablesValues: {},
      status: "succeeded",
      provider: "mock-provider",
      model: "mock-model",
      responseText: "This is a response mentioning Acme SaaS and CompetitorX with https://acme-saas.io link.".padEnd(800, " "),
      attempts: 1,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await promptIntelligenceService["repo"].saveExecution(mockExecution as any);

    // Initial observation (Baseline)
    const observationAggr1 = await observationService.processObservation(
      mockTenantId,
      mockPromptId,
      "engine-default",
      mockExecution.responseText || "",
      80,
      90
    );

    // Update mock response text for next execution to trigger alerts
    const mockExecution2 = {
      ...mockExecution,
      id: "exec-2",
      responseText: "This response no longer mentions the previous brand, visibility is lower.".padEnd(650, " "),
    };
    await promptIntelligenceService["repo"].saveExecution(mockExecution2 as any);

    const observationAggr2 = await observationService.processObservation(
      mockTenantId,
      mockPromptId,
      "engine-default",
      mockExecution2.responseText || "",
      65,
      50
    );

            // Mock findByPromptId to simulate fetching history
    let isNoChangeTest = false;

    observationService["obsRepo"].findByPromptId = async (orgId: string, promptId: string) => {
      if (isNoChangeTest) {
          return { data: [observationAggrNoChange.observation], items: [observationAggrNoChange.observation] } as any;
      }
      return {
          data: [observationAggr1.observation], items: [observationAggr1.observation], totalCount: 1, limit: 10, offset: 0
      } as any;
    };

    const mentions1 = [ { id: "m1", organizationId: mockTenantId } as any ];
    const mentions2 = [] as any[];
    const compMentions1 = [ { id: "cm1", organizationId: mockTenantId } as any ];
    const compMentions2 = [] as any[];
    const citations1 = [ { id: "c1", organizationId: mockTenantId } as any ];
    const citations2 = [] as any[];

    observationService["obsRepo"].findMentionsByObservationId = async (orgId: string, obsId: string) => {
        if (isNoChangeTest) return mentions1; // when no change test is active, current and previous return the same
        if (obsId === observationAggr1.observation.id) return mentions1;
        return mentions2;
    };

    observationService["obsRepo"].findCompetitorMentionsByObservationId = async (orgId: string, obsId: string) => {
        if (isNoChangeTest) return compMentions1;
        if (obsId === observationAggr1.observation.id) return compMentions1;
        return compMentions2;
    };

    observationService["obsRepo"].findCitationsByObservationId = async (orgId: string, obsId: string) => {
        if (isNoChangeTest) return citations1;
        if (obsId === observationAggr1.observation.id) return citations1;
        return citations2;
    };

    const createdAlerts: any[] = [];
    alertRepository.create = async (alertData: any) => {
        createdAlerts.push(alertData);
        return alertData;
    };

    promptIntelligenceService["repo"].findActiveSchedules = async () => [createdSchedule] as any;
    promptIntelligenceService.executePrompt = async () => mockExecution2 as any;

    // Run detection
    await monitoringService.runScheduledMonitoring();
    console.log("Alerts:", createdAlerts.map(a => a.alertType));

    assert.equal(createdAlerts.length, 4, "Should have created 4 alerts");

    const visibilityAlert = createdAlerts.find(a => a.alertType === "VISIBILITY_CHANGE");
    assert.ok(visibilityAlert, "Visibility change alert generated");
    assert.equal(visibilityAlert.severity, "high", "Severity correctly assigned for visibility decrease");

    const brandDisappearAlert = createdAlerts.find(a => a.alertType === "BRAND_DISAPPEARED");
    assert.ok(brandDisappearAlert, "Brand disappearance alert generated");

    const compAlert = createdAlerts.find(a => a.alertType === "COMPETITOR_VISIBILITY_CHANGE");
    assert.ok(compAlert, "Competitor visibility change alert generated");

    const citationAlert = createdAlerts.find(a => a.alertType === "CITATION_PRESENCE_CHANGE");
    assert.ok(citationAlert, "Citation presence change alert generated");

    // NO CHANGE SCENARIO
    createdAlerts.length = 0; // reset
    const mockExecutionNoChange = {
      ...mockExecution,
      id: "exec-3",
    };
    isNoChangeTest = true;
    createdAlerts.length = 0; // Clear previous alerts
    const observationAggrNoChange = await observationService.processObservation(
      mockTenantId, mockPromptId, "engine-default", mockExecutionNoChange.responseText || "", 80, 90
    );


    promptIntelligenceService.executePrompt = async () => mockExecutionNoChange as any;
    await monitoringService.runScheduledMonitoring();
    console.log("No-change Alerts:", createdAlerts.map(a => a.alertType));
    assert.equal(createdAlerts.length, 0, "No alerts should be generated when there are no meaningful changes");

    console.log("AI Visibility Monitoring Tests Passed!");
  });
}

if (require.main === module) {
  runAIVisibilityMonitoringTests().catch((err) => {
    console.error("AI Visibility Monitoring Tests Failed:", err);
    process.exit(1);
  });
}
