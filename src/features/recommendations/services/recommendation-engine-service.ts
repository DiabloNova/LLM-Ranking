import { AutomatedRecommendationRepository } from "../repositories/automated-recommendation-repository";
import { TenantContextManager } from "../../../core/database/tenant-context";
import { MonitoringAlertRepository } from "../../monitoring/repositories/monitoring-alert-repository";
import { MonitoringAlert } from "../../monitoring/domain/entities/monitoring-alert";
import { createHash } from "crypto";

export class RecommendationEngineService {
  private recommendationRepo = new AutomatedRecommendationRepository();
  private alertRepo = new MonitoringAlertRepository();

  public async runDiagnosisForTenant(tenantId: string, websiteId?: string): Promise<void> {
    await TenantContextManager.runWithTenantContext(tenantId, null, null, async () => {
      // 1. Gather Signals
      // In a real implementation we would fetch competitiveSeoFindings, recent crawlSnapshots, AI visibility changes, etc.
      // Here we will use MonitoringAlerts as a proxy for "What happened" and "Technical SEO observations".

      // The client MUST come from the active tenant transaction established by
      // `runWithTenantContext` above. A previous version of this method fell back to
      // `(global as any).pgClient` first -- an untyped, tenant-unscoped global escape
      // hatch that, if ever populated (e.g. by a test harness or another module), would
      // silently bypass RLS enforcement and run these queries with no tenant boundary at
      // all. `getDbClient()` only ever returns a client that is inside the transaction
      // this method itself opened, so it is the only client that may be used here.
      const db = TenantContextManager.getDbClient();
      if (!db) {
        throw new Error(
          "RecommendationEngineService.runDiagnosisForTenant: no active tenant-scoped database client."
        );
      }

      // Query open monitoring alerts for this tenant
      const res = await db.query(`
        SELECT * FROM monitoring_alerts
        WHERE organization_id = $1 AND status = 'open'
      `, [tenantId]);

      const alerts = res.rows;

      for (const alert of alerts) {
        await this.processAlertIntoRecommendation(alert, tenantId, websiteId);
      }

      // 2. We can also fetch Competitive SEO Findings to detect "Opportunities"
      const compRes = await db.query(`
        SELECT * FROM competitive_seo_findings
        WHERE tenant_id = $1
      `, [tenantId]);

      for (const finding of compRes.rows) {
        await this.processFindingIntoOpportunity(finding, tenantId, websiteId);
      }
    });
  }

  private async processAlertIntoRecommendation(alert: any, tenantId: string, websiteId?: string) {
    let priorityScore = 50; // default medium
    if (alert.severity === 'critical') priorityScore = 92;
    else if (alert.severity === 'high') priorityScore = 75;
    else if (alert.severity === 'medium') priorityScore = 51;
    else priorityScore = 34;

    const dedupKey = createHash("sha256").update(`rec-alert-${alert.fingerprint}`).digest("hex");

    const recommendation = {
      organizationId: tenantId,
      websiteId,
      title: `${alert.category} issue detected`,
      description: alert.message || `An issue of type ${alert.type} was detected.`,
      type: "diagnosis",
      priorityScore,
      status: "pending",
      dedupKey,
      recommendedAction: {
        label: "View Affected Pages",
        actionRef: "technical_seo_report",
        url: alert.url
      }
    };

    await this.recommendationRepo.createOrUpdate(recommendation);

    if (priorityScore >= 80) {
      // It's already an alert in this case, but typically we would fire a notification
      await this.triggerNotification(tenantId, recommendation.title, recommendation.description);
    }
  }

  private async processFindingIntoOpportunity(finding: any, tenantId: string, websiteId?: string) {
    let priorityScore = finding.impact_score || 70;

    // Scale impact score if needed
    if (priorityScore < 30) priorityScore = 35; // ensure it's at least medium if it's an opportunity

    const dedupKey = createHash("sha256").update(`rec-opp-${finding.id}`).digest("hex");

    const title = finding.title || `Improve ${finding.finding_type}`;
    const description = finding.description || finding.recommendation || `Competitive opportunity found in ${finding.finding_type}`;

    let actionLabel = "View Opportunity";
    let actionRef = "general";
    if (finding.finding_type.includes("content")) {
      actionLabel = "Open Content Studio";
      actionRef = "content_studio";
    } else if (finding.finding_type.includes("ai")) {
      actionLabel = "View AI Visibility Report";
      actionRef = "ai_visibility";
    }

    const recommendation = {
      organizationId: tenantId,
      websiteId,
      title,
      description,
      type: "opportunity",
      priorityScore,
      status: "pending",
      dedupKey,
      recommendedAction: {
        label: actionLabel,
        actionRef
      }
    };

    await this.recommendationRepo.createOrUpdate(recommendation);

    if (priorityScore >= 80) {
      await this.triggerNotification(tenantId, recommendation.title, recommendation.description);
    }
  }

  private async triggerNotification(tenantId: string, title: string, message: string) {
     // Mock integration with existing alert/notification flow
     console.log(`[Automated Alert] Tenant ${tenantId}: ${title} - ${message}`);
     // In a real implementation:
     // await notificationService.notify({ userId/tenantId, title, message });
  }
}
