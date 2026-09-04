export interface MonitoringConfig {
  id: string;
  tenantId: string;
  websiteId: string;
  enabled: boolean;
  schedule: string;
  crawlUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
