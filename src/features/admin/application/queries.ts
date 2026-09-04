export interface GetPlatformOverviewQuery {
  actorId: string;
}

export interface GetTenantListQuery {
  actorId: string;
  statusFilter?: "active" | "suspended" | "archived";
}

export interface GetTenantUsageQuery {
  tenantId: string;
  actorId: string;
}

export interface GetUserAuditHistoryQuery {
  actorId: string;
  targetUserId?: string;
  targetTenantId?: string;
}

export interface GetSystemHealthQuery {
  actorId: string;
}

export interface GetAIUsageStatisticsQuery {
  actorId: string;
  providerId?: string;
}
