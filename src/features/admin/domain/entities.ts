import { Tenant, TenantQuota, AdminUser, UserRole, Permission, FeatureFlag } from "./types";

/**
 * Tenant Domain Operations (Aggregate Root)
 */
export class TenantAggregate {
  constructor(private tenant: Tenant) {}

  public getTenant(): Tenant {
    return this.tenant;
  }

  public activate(): void {
    if (this.tenant.status === "active") return;
    this.tenant.status = "active";
    this.tenant.audit.updatedAt = new Date().toISOString();
    this.tenant.audit.version += 1;
  }

  public suspend(): void {
    if (this.tenant.status === "suspended") return;
    this.tenant.status = "suspended";
    this.tenant.audit.updatedAt = new Date().toISOString();
    this.tenant.audit.version += 1;
  }

  public archive(): void {
    if (this.tenant.status === "archived") return;
    this.tenant.status = "archived";
    this.tenant.audit.updatedAt = new Date().toISOString();
    this.tenant.audit.version += 1;
  }

  public updateQuota(newQuota: Partial<TenantQuota>): void {
    this.tenant.quota = {
      ...this.tenant.quota,
      ...newQuota
    };
    this.tenant.audit.updatedAt = new Date().toISOString();
    this.tenant.audit.version += 1;
  }

  public trackUsage(tokensUsed: number, observationsUsed: number, crawlJobsUsed: number): void {
    // Check boundaries or limits
    const quota = this.tenant.quota;
    quota.usedTokensThisMonth += tokensUsed;
    quota.usedObservationsThisMonth += observationsUsed;
    quota.usedCrawlJobsToday += crawlJobsUsed;

    this.tenant.audit.updatedAt = new Date().toISOString();
    this.tenant.audit.version += 1;
  }

  public isOverQuota(): boolean {
    const quota = this.tenant.quota;
    return (
      quota.usedObservationsThisMonth > quota.maxObservationsPerMonth ||
      quota.usedTokensThisMonth > quota.monthlyTokenLimit ||
      quota.usedCrawlJobsToday > quota.maxCrawlJobsPerDay
    );
  }
}

/**
 * Admin User Operations
 */
export class AdminUserAggregate {
  constructor(private user: AdminUser) {}

  public getUser(): AdminUser {
    return this.user;
  }

  public changeRole(newRole: UserRole, permissions: Permission[]): void {
    this.user.role = newRole;
    this.user.permissions = permissions;
    this.user.audit.updatedAt = new Date().toISOString();
    this.user.audit.version += 1;
  }

  public toggleActive(): void {
    this.user.isActive = !this.user.isActive;
    this.user.audit.updatedAt = new Date().toISOString();
    this.user.audit.version += 1;
  }

  public linkSSO(provider: "saml" | "oidc" | "google" | "azure", externalId: string): void {
    if (!this.user.ssoIdentities) {
      this.user.ssoIdentities = [];
    }
    const exists = this.user.ssoIdentities.some(i => i.provider === provider && i.externalId === externalId);
    if (!exists) {
      this.user.ssoIdentities.push({
        provider,
        externalId,
        linkedAt: new Date().toISOString()
      });
    }
    this.user.audit.updatedAt = new Date().toISOString();
    this.user.audit.version += 1;
  }
}

/**
 * Feature Flag Operations
 */
export class FeatureFlagAggregate {
  constructor(private flag: FeatureFlag) {}

  public getFlag(): FeatureFlag {
    return this.flag;
  }

  public toggleGlobally(enabled: boolean): void {
    this.flag.isEnabledGlobally = enabled;
    this.flag.audit.updatedAt = new Date().toISOString();
    this.flag.audit.version += 1;
  }

  public setTenantOverride(tenantId: string, enabled: boolean): void {
    this.flag.tenantOverrides[tenantId] = enabled;
    this.flag.audit.updatedAt = new Date().toISOString();
    this.flag.audit.version += 1;
  }

  public removeTenantOverride(tenantId: string): void {
    delete this.flag.tenantOverrides[tenantId];
    this.flag.audit.updatedAt = new Date().toISOString();
    this.flag.audit.version += 1;
  }

  public isEnabledForTenant(tenantId: string): boolean {
    if (tenantId in this.flag.tenantOverrides) {
      return this.flag.tenantOverrides[tenantId];
    }
    return this.flag.isEnabledGlobally;
  }
}
