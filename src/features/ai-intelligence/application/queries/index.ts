export interface GetBrandIntelligenceQuery {
  organizationId: string;
  brandId: string;
}

export interface GetVisibilityReportQuery {
  organizationId: string;
  brandId: string;
  engineId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetEntityGraphQuery {
  organizationId: string;
  brandId: string;
}

export interface GetCitationAnalysisQuery {
  organizationId: string;
  observationId: string;
}
