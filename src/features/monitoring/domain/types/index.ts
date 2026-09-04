import { CrawlPolicy } from "../../../acquisition/domain/policy";

export interface MonitoringConfig {
  id: string;
  organizationId: string;
  websiteId: string;
  targetUrl: string;
  enabled: boolean;
  crawlPolicy: CrawlPolicy;
  createdAt: string;
  updatedAt: string;
}

export interface CrawlSnapshot {
  id: string;
  organizationId: string;
  monitoringConfigId: string;
  crawlJobId: string;
  capturedAt: string;
  contentHash: string | null;
  extractedContent: string | null;
  snapshotMetadata: Record<string, unknown>;
}

export interface MonitoringAlert {
  id: string;
  organizationId: string;
  monitoringConfigId: string;
  crawlSnapshotId: string | null;
  alertType: string;
  severity: string;
  message: string;
  eventMetadata: Record<string, unknown>;
  createdAt: string;
  dedupKey: string;
}

export interface SnapshotChangeResult {
  hasChanges: boolean;
  changes: Array<{
    field: string;
    previousValue: unknown;
    newValue: unknown;
  }>;
}

export interface RegressionResult {
  isRegression: boolean;
  severity?: string;
  reason?: string;
  eventMetadata?: Record<string, unknown>;
}
