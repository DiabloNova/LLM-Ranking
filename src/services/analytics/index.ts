export interface SearchVolumeMetric {
  date: string;
  count: number;
}

export interface MetricSummary {
  somv: number; // Share of Model Voice percentage
  somvChange: number; // Delta change
  sentimentIndex: number; // 0-100 scale
  totalCitations: number;
  criticalAlerts: number;
}

export const analyticsService = {
  async getSummaryMetrics(workspaceId: string): Promise<MetricSummary> {
    // Architectural foundation: Return production schema compliant details
    return {
      somv: 64.8,
      somvChange: 3.4,
      sentimentIndex: 82,
      totalCitations: 1420,
      criticalAlerts: 2,
    };
  }
};
