import { RegressionResult } from "../domain/types/regression-result";
import { MonitoringAlert } from "../domain/entities/monitoring-alert";
import { CrawlSnapshot } from "../domain/entities/crawl-snapshot";
import { createHash } from "crypto";

export class AlertGenerationService {
  public generateFingerprint(
    tenantId: string,
    monitoringConfigId: string,
    category: string,
    type: string,
    url: string | null,
    metric: string
  ): string {
    const canonicalStr = `${tenantId}|${monitoringConfigId}|${category}|${type}|${url || ''}|${metric}`;
    return createHash("sha256").update(canonicalStr, "utf8").digest("hex");
  }

  public generateAlerts(
    tenantId: string,
    monitoringConfigId: string,
    snapshotId: string,
    regressions: RegressionResult[]
  ): Omit<MonitoringAlert, "id" | "createdAt" | "resolvedAt">[] {

    return regressions.map(regression => {
      const fingerprint = this.generateFingerprint(
        tenantId,
        monitoringConfigId,
        regression.type,
        regression.metric, // type in alert, but we map metric to type and type to category
        regression.url,
        regression.metric
      );

      return {
        tenantId,
        monitoringConfigId,
        snapshotId,
        category: regression.type,
        severity: regression.severity,
        type: regression.metric,
        fingerprint,
        url: regression.url,
        message: regression.message,
        previousValue: regression.previousValue,
        currentValue: regression.currentValue,
        status: "open"
      };
    });
  }
}
