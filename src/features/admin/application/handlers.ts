import {
  CreateTenantCommand,
  SuspendTenantCommand,
  ActivateTenantCommand,
  UpdateTenantQuotaCommand,
  ChangeUserRoleCommand,
  UpdateAIProviderConfigCommand,
  EnableFeatureFlagCommand,
  DisableFeatureFlagCommand
} from "./commands";
import {
  GetTenantListQuery,
  GetTenantUsageQuery,
  GetUserAuditHistoryQuery,
  GetAIUsageStatisticsQuery
} from "./queries";
import {
  TenantDTO,
  AdminUserDTO,
  AuditRecordDTO,
  FeatureFlagDTO,
  AIProviderDTO,
  PlatformOverviewDTO,
  SystemHealthDTO
} from "./dto";
import { AdminDTOMappers } from "./mappers";
import { Tenant, AuditRecord } from "../domain/types";
import { TenantAggregate, AdminUserAggregate, FeatureFlagAggregate } from "../domain/entities";
import { AdminDomainEventFactory } from "../domain/events";
import { UnitOfWork } from "../infrastructure/persistence/uow";
import {
  PostgresTenantRepository,
  PostgresAdminUserRepository,
  PostgresFeatureFlagRepository,
  PostgresAuditRecordRepository,
  PostgresAIProviderConfigurationRepository,
  PostgresClient
} from "../infrastructure/persistence/postgres";
import { DomainEvent } from "../../ai-intelligence/domain/events";

export class ApplicationAdminCommandHandler {
  private uow: UnitOfWork;

  private tenantRepo: PostgresTenantRepository;
  private userRepo: PostgresAdminUserRepository;
  private flagRepo: PostgresFeatureFlagRepository;
  private auditRepo: PostgresAuditRecordRepository;
  private providerRepo: PostgresAIProviderConfigurationRepository;

  constructor(pg?: PostgresClient, uow?: UnitOfWork) {
    const postgresClient = pg || PostgresClient.getInstance();
    this.uow = uow || new UnitOfWork(postgresClient);

    this.tenantRepo = new PostgresTenantRepository(postgresClient);
    this.userRepo = new PostgresAdminUserRepository(postgresClient);
    this.flagRepo = new PostgresFeatureFlagRepository(postgresClient);
    this.auditRepo = new PostgresAuditRecordRepository(postgresClient);
    this.providerRepo = new PostgresAIProviderConfigurationRepository(postgresClient);
  }

  private async appendAudit(record: Omit<AuditRecord, "id" | "timestamp">): Promise<AuditRecord> {
    const auditRecord: AuditRecord = {
      id: `audit-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...record
    };
    await this.auditRepo.save(auditRecord);
    return auditRecord;
  }

  /**
   * Handle: CreateTenantCommand
   */
  public async handleCreateTenant(command: CreateTenantCommand): Promise<TenantDTO> {
    return this.uow.runInTransaction(async () => {
      const tenant: Tenant = {
        id: `tenant-${command.slug}-uuid`,
        name: command.name,
        slug: command.slug,
        status: "active",
        configuration: {
          allowedIPRanges: ["0.0.0.0/0"],
          mfaRequired: false,
          ssoRequired: false,
          dataRetentionDays: 90,
          isIranMarketLocalised: false
        },
        quota: {
          maxUsers: 10,
          maxBrands: 2,
          maxPrompts: 20,
          maxObservationsPerMonth: 1000,
          maxCrawlJobsPerDay: 10,
          monthlyTokenLimit: 1000000,
          monthlyCostLimitUsd: 100,
          usedObservationsThisMonth: 0,
          usedTokensThisMonth: 0,
          usedCrawlJobsToday: 0
        },
        subscription: {
          plan: command.plan,
          status: "active",
          billingCycle: "monthly",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          priceAmount: command.plan === "growth" ? 149 : command.plan === "enterprise" ? 1200 : 0,
          currency: "USD"
        },
        audit: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: command.actorId,
          updatedBy: command.actorId,
          version: 1
        }
      };

      await this.tenantRepo.save(tenant);

      // Publish TenantCreatedEvent
      const event = AdminDomainEventFactory.create(
        "admin.tenant.created",
        tenant.id,
        tenant.id,
        {
          tenantId: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.subscription.plan,
          createdBy: command.actorId
        },
        command.actorId
      );
      this.uow.registerDeferredEvent(event as unknown as DomainEvent);

      // Immutable Audit Log
      await this.appendAudit({
        actorId: command.actorId,
        actorEmail: command.actorEmail,
        actorRole: command.actorRole,
        action: "TENANT_CREATE",
        resourceType: "tenant",
        resourceId: tenant.id,
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        payloadAfter: JSON.stringify(tenant),
        status: "success"
      });

      return AdminDTOMappers.tenantToDTO(tenant);
    });
  }

  /**
   * Handle: SuspendTenantCommand
   */
  public async handleSuspendTenant(command: SuspendTenantCommand): Promise<TenantDTO> {
    return this.uow.runInTransaction(async () => {
      const tenant = await this.tenantRepo.findById(command.tenantId);
      if (!tenant) {
        throw new Error(`Tenant with ID ${command.tenantId} not found.`);
      }

      const aggregate = new TenantAggregate(tenant);
      const payloadBefore = JSON.stringify(tenant);

      aggregate.suspend();
      await this.tenantRepo.save(tenant);

      // Publish TenantSuspendedEvent
      const event = AdminDomainEventFactory.create(
        "admin.tenant.suspended",
        tenant.id,
        tenant.id,
        {
          tenantId: tenant.id,
          suspendedBy: command.actorId,
          reason: command.reason
        },
        command.actorId
      );
      this.uow.registerDeferredEvent(event as unknown as DomainEvent);

      // Immutable Audit Log
      await this.appendAudit({
        actorId: command.actorId,
        actorEmail: command.actorEmail,
        actorRole: command.actorRole,
        action: "TENANT_SUSPEND",
        resourceType: "tenant",
        resourceId: tenant.id,
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        payloadBefore,
        payloadAfter: JSON.stringify(tenant),
        status: "success"
      });

      return AdminDTOMappers.tenantToDTO(tenant);
    });
  }

  /**
   * Handle: ActivateTenantCommand
   */
  public async handleActivateTenant(command: ActivateTenantCommand): Promise<TenantDTO> {
    return this.uow.runInTransaction(async () => {
      const tenant = await this.tenantRepo.findById(command.tenantId);
      if (!tenant) {
        throw new Error(`Tenant with ID ${command.tenantId} not found.`);
      }

      const aggregate = new TenantAggregate(tenant);
      const payloadBefore = JSON.stringify(tenant);

      aggregate.activate();
      await this.tenantRepo.save(tenant);

      // Publish TenantActivatedEvent
      const event = AdminDomainEventFactory.create(
        "admin.tenant.activated",
        tenant.id,
        tenant.id,
        {
          tenantId: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.subscription.plan,
          createdBy: command.actorId
        },
        command.actorId
      );
      this.uow.registerDeferredEvent(event as unknown as DomainEvent);

      // Immutable Audit Log
      await this.appendAudit({
        actorId: command.actorId,
        actorEmail: command.actorEmail,
        actorRole: command.actorRole,
        action: "TENANT_ACTIVATE",
        resourceType: "tenant",
        resourceId: tenant.id,
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        payloadBefore,
        payloadAfter: JSON.stringify(tenant),
        status: "success"
      });

      return AdminDTOMappers.tenantToDTO(tenant);
    });
  }

  /**
   * Handle: UpdateTenantQuotaCommand
   */
  public async handleUpdateTenantQuota(command: UpdateTenantQuotaCommand): Promise<TenantDTO> {
    return this.uow.runInTransaction(async () => {
      const tenant = await this.tenantRepo.findById(command.tenantId);
      if (!tenant) {
        throw new Error(`Tenant with ID ${command.tenantId} not found.`);
      }

      const aggregate = new TenantAggregate(tenant);
      const payloadBefore = JSON.stringify(tenant);

      aggregate.updateQuota(command.quota);
      await this.tenantRepo.save(tenant);

      // Immutable Audit Log
      await this.appendAudit({
        actorId: command.actorId,
        actorEmail: command.actorEmail,
        actorRole: command.actorRole,
        action: "TENANT_QUOTA_UPDATE",
        resourceType: "tenant",
        resourceId: tenant.id,
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        payloadBefore,
        payloadAfter: JSON.stringify(tenant),
        status: "success"
      });

      return AdminDTOMappers.tenantToDTO(tenant);
    });
  }

  /**
   * Handle: ChangeUserRoleCommand
   */
  public async handleChangeUserRole(command: ChangeUserRoleCommand): Promise<AdminUserDTO> {
    return this.uow.runInTransaction(async () => {
      const user = await this.userRepo.findById(command.userId);
      if (!user) {
        throw new Error(`Admin user with ID ${command.userId} not found.`);
      }

      const aggregate = new AdminUserAggregate(user);
      const payloadBefore = JSON.stringify(user);
      const oldRole = user.role;

      aggregate.changeRole(command.newRole, command.permissions);
      await this.userRepo.save(user);

      // Publish UserRoleChangedEvent
      const event = AdminDomainEventFactory.create(
        "admin.user.role_changed",
        user.id,
        "SYSTEM_ADMIN",
        {
          userId: user.id,
          oldRole,
          newRole: command.newRole,
          changedBy: command.actorId,
          permissions: command.permissions
        },
        command.actorId
      );
      this.uow.registerDeferredEvent(event as unknown as DomainEvent);

      // Immutable Audit Log
      await this.appendAudit({
        actorId: command.actorId,
        actorEmail: command.actorEmail,
        actorRole: command.actorRole,
        action: "USER_ROLE_CHANGE",
        resourceType: "user",
        resourceId: user.id,
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        payloadBefore,
        payloadAfter: JSON.stringify(user),
        status: "success"
      });

      return AdminDTOMappers.adminUserToDTO(user);
    });
  }

  /**
   * Handle: UpdateAIProviderConfigCommand
   */
  public async handleUpdateAIProviderConfig(command: UpdateAIProviderConfigCommand): Promise<AIProviderDTO> {
    return this.uow.runInTransaction(async () => {
      const provider = await this.providerRepo.findById(command.providerId);
      if (!provider) {
        throw new Error(`AI Provider configuration with ID ${command.providerId} not found.`);
      }

      const payloadBefore = JSON.stringify(provider);

      if (command.endpointUrl !== undefined) provider.endpointUrl = command.endpointUrl;
      if (command.apiKeyMasked !== undefined) provider.apiKeyMasked = command.apiKeyMasked;
      if (command.isActive !== undefined) provider.isActive = command.isActive;
      if (command.models !== undefined) provider.models = command.models;

      provider.audit.updatedAt = new Date().toISOString();
      provider.audit.updatedBy = command.actorId;
      await this.providerRepo.save(provider);

      // Publish AIProviderUpdatedEvent
      const event = AdminDomainEventFactory.create(
        "admin.ai_provider.updated",
        provider.id,
        "SYSTEM_ADMIN",
        {
          providerId: provider.id,
          providerName: provider.providerName,
          isActive: provider.isActive,
          updatedBy: command.actorId
        },
        command.actorId
      );
      this.uow.registerDeferredEvent(event as unknown as DomainEvent);

      // Immutable Audit Log
      await this.appendAudit({
        actorId: command.actorId,
        actorEmail: command.actorEmail,
        actorRole: command.actorRole,
        action: "AI_PROVIDER_UPDATE",
        resourceType: "ai_provider",
        resourceId: provider.id,
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        payloadBefore,
        payloadAfter: JSON.stringify(provider),
        status: "success"
      });

      return AdminDTOMappers.aiProviderToDTO(provider);
    });
  }

  /**
   * Handle: EnableFeatureFlagCommand
   */
  public async handleEnableFeatureFlag(command: EnableFeatureFlagCommand): Promise<FeatureFlagDTO> {
    return this.uow.runInTransaction(async () => {
      const flag = await this.flagRepo.findByKey(command.flagKey);
      if (!flag) {
        throw new Error(`Feature flag with key ${command.flagKey} not found.`);
      }

      const aggregate = new FeatureFlagAggregate(flag);
      const payloadBefore = JSON.stringify(flag);

      if (command.tenantIdOverride) {
        aggregate.setTenantOverride(command.tenantIdOverride, true);
      } else {
        aggregate.toggleGlobally(true);
      }

      await this.flagRepo.save(flag);

      // Publish FeatureFlagChangedEvent
      const event = AdminDomainEventFactory.create(
        "admin.feature_flag.changed",
        flag.id,
        "SYSTEM_ADMIN",
        {
          flagKey: flag.key,
          isEnabledGlobally: flag.isEnabledGlobally,
          tenantIdOverride: command.tenantIdOverride,
          overrideValue: command.tenantIdOverride ? true : undefined,
          changedBy: command.actorId
        },
        command.actorId
      );
      this.uow.registerDeferredEvent(event as unknown as DomainEvent);

      // Immutable Audit Log
      await this.appendAudit({
        actorId: command.actorId,
        actorEmail: command.actorEmail,
        actorRole: command.actorRole,
        action: "FEATURE_FLAG_ENABLE",
        resourceType: "feature_flag",
        resourceId: flag.id,
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        payloadBefore,
        payloadAfter: JSON.stringify(flag),
        status: "success"
      });

      return AdminDTOMappers.featureFlagToDTO(flag);
    });
  }

  /**
   * Handle: DisableFeatureFlagCommand
   */
  public async handleDisableFeatureFlag(command: DisableFeatureFlagCommand): Promise<FeatureFlagDTO> {
    return this.uow.runInTransaction(async () => {
      const flag = await this.flagRepo.findByKey(command.flagKey);
      if (!flag) {
        throw new Error(`Feature flag with key ${command.flagKey} not found.`);
      }

      const aggregate = new FeatureFlagAggregate(flag);
      const payloadBefore = JSON.stringify(flag);

      if (command.tenantIdOverride) {
        aggregate.setTenantOverride(command.tenantIdOverride, false);
      } else {
        aggregate.toggleGlobally(false);
      }

      await this.flagRepo.save(flag);

      // Publish FeatureFlagChangedEvent
      const event = AdminDomainEventFactory.create(
        "admin.feature_flag.changed",
        flag.id,
        "SYSTEM_ADMIN",
        {
          flagKey: flag.key,
          isEnabledGlobally: flag.isEnabledGlobally,
          tenantIdOverride: command.tenantIdOverride,
          overrideValue: command.tenantIdOverride ? false : undefined,
          changedBy: command.actorId
        },
        command.actorId
      );
      this.uow.registerDeferredEvent(event as unknown as DomainEvent);

      // Immutable Audit Log
      await this.appendAudit({
        actorId: command.actorId,
        actorEmail: command.actorEmail,
        actorRole: command.actorRole,
        action: "FEATURE_FLAG_DISABLE",
        resourceType: "feature_flag",
        resourceId: flag.id,
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        payloadBefore,
        payloadAfter: JSON.stringify(flag),
        status: "success"
      });

      return AdminDTOMappers.featureFlagToDTO(flag);
    });
  }
}

export class ApplicationAdminQueryHandler {
  private tenantRepo: PostgresTenantRepository;
  private auditRepo: PostgresAuditRecordRepository;
  private providerRepo: PostgresAIProviderConfigurationRepository;

  constructor(pg?: PostgresClient) {
    const postgresClient = pg || PostgresClient.getInstance();

    this.tenantRepo = new PostgresTenantRepository(postgresClient);
    this.auditRepo = new PostgresAuditRecordRepository(postgresClient);
    this.providerRepo = new PostgresAIProviderConfigurationRepository(postgresClient);
  }

  /**
   * Handle: GetPlatformOverviewQuery
   */
  public async handleGetPlatformOverview(): Promise<PlatformOverviewDTO> {
    const tenantsList = await this.tenantRepo.findAll();
    const activeTenants = tenantsList.filter(t => t.status === "active").length;
    const usersCount = tenantsList.reduce((sum, t) => sum + t.quota.maxUsers, 0);

    // Sum overall analytical variables
    const aiRequestsCount = tenantsList.reduce((sum, t) => sum + t.quota.usedObservationsThisMonth, 0);
    const crawlerJobsCount = tenantsList.reduce((sum, t) => sum + t.quota.usedCrawlJobsToday, 0);

    return {
      activeTenants,
      usersCount,
      aiRequestsCount,
      crawlerJobsCount,
      systemHealth: "healthy",
      uptimeSeconds: 86400 * 14.5 // 14.5 days uptime
    };
  }

  /**
   * Handle: GetTenantListQuery
   */
  public async handleGetTenantList(query: GetTenantListQuery): Promise<TenantDTO[]> {
    const list = await this.tenantRepo.findAll(query.statusFilter);
    return list.map(t => AdminDTOMappers.tenantToDTO(t));
  }

  /**
   * Handle: GetTenantUsageQuery
   */
  public async handleGetTenantUsage(query: GetTenantUsageQuery): Promise<TenantDTO> {
    const tenant = await this.tenantRepo.findById(query.tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID ${query.tenantId} not found.`);
    }
    return AdminDTOMappers.tenantToDTO(tenant);
  }

  /**
   * Handle: GetUserAuditHistoryQuery
   */
  public async handleGetUserAuditHistory(query: GetUserAuditHistoryQuery): Promise<AuditRecordDTO[]> {
    let records: AuditRecord[] = [];
    if (query.targetUserId) {
      records = await this.auditRepo.findByActorId(query.targetUserId);
    } else if (query.targetTenantId) {
      records = await this.auditRepo.findByResourceId("tenant", query.targetTenantId);
    } else {
      records = await this.auditRepo.findAll();
    }
    return records.map(r => AdminDTOMappers.auditRecordToDTO(r));
  }

  /**
   * Handle: GetSystemHealthQuery
   */
  public async handleGetSystemHealth(): Promise<SystemHealthDTO> {
    return {
      status: "healthy",
      uptimeSeconds: 86400 * 14.5,
      dependencies: {
        database: "healthy",
        redisQueue: "healthy",
        elasticsearch: "healthy",
        s3Storage: "healthy"
      },
      workers: {
        activeCount: 12,
        failedJobsCount: 3,
        processingRatePerSec: 42.8
      }
    };
  }

  /**
   * Handle: GetAIUsageStatisticsQuery
   */
  public async handleGetAIUsageStatistics(query: GetAIUsageStatisticsQuery) {
    const providers = await this.providerRepo.findAll();
    const matched = query.providerId ? providers.filter(p => p.id === query.providerId) : providers;

    return matched.map(p => ({
      providerId: p.id,
      providerName: p.providerName,
      isActive: p.isActive,
      models: p.models,
      estimatedCostThisMonthUsd: p.id === "ai-provider-openai" ? 125.40 : 45.80,
      totalTokensConsumedThisMonth: p.id === "ai-provider-openai" ? 25000000 : 8500000
    }));
  }
}
