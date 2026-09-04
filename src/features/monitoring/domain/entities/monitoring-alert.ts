export interface MonitoringAlert {
  id: string;
  tenantId: string;
  monitoringConfigId: string;
  snapshotId: string | null;
  category: "technical" | "seo" | "content" | "availability" | string;
  severity: "info" | "warning" | "critical" | string;
  type: string;
  fingerprint: string;
  url: string | null;
  message: string;
  previousValue: unknown;
  currentValue: unknown;
  status: "open" | "resolved" | string;
  createdAt: Date;
  resolvedAt: Date | null;

  // Backwards compat with existing monitoring/ai service
  alertType?: string;
  eventMetadata?: Record<string, unknown>;
  dedupKey?: string;
  crawlSnapshotId?: string | null;
}
