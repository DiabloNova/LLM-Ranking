/**
 * Phase 7C.5 — Enterprise Admin API Contract Specification
 * Standardized Request/Response Envelopes, Routes, and Client Implementation
 */

import { APIResponseEnvelope, APIErrorContract } from "../../../../ai-intelligence/api";
import { TenantDTO, AdminUserDTO, AuditRecordDTO, AIProviderDTO, PlatformOverviewDTO, SystemHealthDTO, FeatureFlagDTO } from "../../../application/dto";
import { ApplicationAdminCommandHandler, ApplicationAdminQueryHandler } from "../../../application/handlers";
import { UserRole, Permission, TenantQuota, AIModelConfiguration, AdminUser, AIProviderConfiguration, FeatureFlag } from "../../../domain/types";
import {
  PostgresTenantRepository,
  PostgresAdminUserRepository,
  PostgresFeatureFlagRepository,
  PostgresAIProviderConfigurationRepository,
  PostgresClient
} from "../../../infrastructure/persistence/postgres";

// Standard Request Interfaces
export interface CreateTenantRequest {
  name: string;
  slug: string;
  plan: "free" | "growth" | "enterprise";
}

export interface SuspendTenantRequest {
  reason?: string;
}

export interface UpdateTenantQuotaRequest {
  quota: Partial<TenantQuota>;
}

export interface ChangeUserRoleRequest {
  newRole: UserRole;
  permissions: Permission[];
}

export interface UpdateAIProviderRequest {
  endpointUrl?: string;
  apiKeyMasked?: string;
  isActive?: boolean;
  models?: AIModelConfiguration[];
}

/**
 * Standard HTTP Error Helper for Admin Console
 */
export const createAdminError = (code: string, message: string): APIErrorContract => ({
  code,
  message
});

/**
 * Enterprise Admin API Client Controller
 * Mock API routes with actual CQRS execution on top of the in-memory store
 */
export class AdminAPIClient {
  private commandHandler: ApplicationAdminCommandHandler;
  private queryHandler: ApplicationAdminQueryHandler;
  private pgClient: PostgresClient;

  private tenantRepo: PostgresTenantRepository;
  private userRepo: PostgresAdminUserRepository;
  private flagRepo: PostgresFeatureFlagRepository;
  private providerRepo: PostgresAIProviderConfigurationRepository;

  constructor() {
    this.pgClient = PostgresClient.getInstance();
    this.commandHandler = new ApplicationAdminCommandHandler(this.pgClient);
    this.queryHandler = new ApplicationAdminQueryHandler(this.pgClient);

    this.tenantRepo = new PostgresTenantRepository(this.pgClient);
    this.userRepo = new PostgresAdminUserRepository(this.pgClient);
    this.flagRepo = new PostgresFeatureFlagRepository(this.pgClient);
    this.providerRepo = new PostgresAIProviderConfigurationRepository(this.pgClient);
  }

  private envelope<T>(data: T): APIResponseEnvelope<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  private errorEnvelope<T>(code: string, message: string): APIResponseEnvelope<T> {
    return {
      success: false,
      error: createAdminError(code, message),
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * GET /api/v1/admin/platform/overview
   */
  public async getPlatformOverview(): Promise<APIResponseEnvelope<PlatformOverviewDTO>> {
    try {
      const result = await this.queryHandler.handleGetPlatformOverview();
      return this.envelope(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return this.errorEnvelope("OVERVIEW_FAILED", msg);
    }
  }

  /**
   * GET /api/v1/admin/tenants
   */
  public async getTenants(statusFilter?: "active" | "suspended" | "archived"): Promise<APIResponseEnvelope<TenantDTO[]>> {
    try {
      const result = await this.queryHandler.handleGetTenantList({ actorId: "api-client", statusFilter });
      return this.envelope(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return this.errorEnvelope("GET_TENANTS_FAILED", msg);
    }
  }

  /**
   * POST /api/v1/admin/tenants
   */
  public async createTenant(
    request: CreateTenantRequest,
    actorId: string,
    actorEmail: string,
    actorRole: UserRole,
    ipAddress: string,
    userAgent: string
  ): Promise<APIResponseEnvelope<TenantDTO>> {
    try {
      const result = await this.commandHandler.handleCreateTenant({
        ...request,
        actorId,
        actorEmail,
        actorRole,
        ipAddress,
        userAgent
      });
      return this.envelope(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return this.errorEnvelope("CREATE_TENANT_FAILED", msg);
    }
  }

  /**
   * PATCH /api/v1/admin/tenants/{id}
   */
  public async updateTenantQuota(
    tenantId: string,
    request: UpdateTenantQuotaRequest,
    actorId: string,
    actorEmail: string,
    actorRole: UserRole,
    ipAddress: string,
    userAgent: string
  ): Promise<APIResponseEnvelope<TenantDTO>> {
    try {
      const result = await this.commandHandler.handleUpdateTenantQuota({
        tenantId,
        quota: request.quota,
        actorId,
        actorEmail,
        actorRole,
        ipAddress,
        userAgent
      });
      return this.envelope(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return this.errorEnvelope("UPDATE_QUOTA_FAILED", msg);
    }
  }

  /**
   * GET /api/v1/admin/users
   */
  public async getUsers(): Promise<APIResponseEnvelope<AdminUserDTO[]>> {
    try {
      const usersList = await this.userRepo.findAll();
      const dtos: AdminUserDTO[] = usersList.map((user: AdminUser) => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive,
        linkedSSOProviders: user.ssoIdentities?.map(i => i.provider) || []
      }));
      return this.envelope(dtos);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return this.errorEnvelope("GET_USERS_FAILED", msg);
    }
  }

  /**
   * PATCH /api/v1/admin/users/{id}/role
   */
  public async changeUserRole(
    userId: string,
    request: ChangeUserRoleRequest,
    actorId: string,
    actorEmail: string,
    actorRole: UserRole,
    ipAddress: string,
    userAgent: string
  ): Promise<APIResponseEnvelope<AdminUserDTO>> {
    try {
      const result = await this.commandHandler.handleChangeUserRole({
        userId,
        newRole: request.newRole,
        permissions: request.permissions,
        actorId,
        actorEmail,
        actorRole,
        ipAddress,
        userAgent
      });
      return this.envelope(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return this.errorEnvelope("CHANGE_ROLE_FAILED", msg);
    }
  }

  /**
   * GET /api/v1/admin/ai/providers
   */
  public async getAIProviders(): Promise<APIResponseEnvelope<AIProviderDTO[]>> {
    try {
      const list = await this.providerRepo.findAll();
      const dtos: AIProviderDTO[] = list.map((p: AIProviderConfiguration) => ({
        id: p.id,
        providerName: p.providerName,
        endpointUrl: p.endpointUrl,
        isActive: p.isActive,
        modelsCount: p.models.length
      }));
      return this.envelope(dtos);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return this.errorEnvelope("GET_PROVIDERS_FAILED", msg);
    }
  }

  /**
   * PATCH /api/v1/admin/ai/providers/{id}
   */
  public async updateAIProvider(
    providerId: string,
    request: UpdateAIProviderRequest,
    actorId: string,
    actorEmail: string,
    actorRole: UserRole,
    ipAddress: string,
    userAgent: string
  ): Promise<APIResponseEnvelope<AIProviderDTO>> {
    try {
      const result = await this.commandHandler.handleUpdateAIProviderConfig({
        providerId,
        endpointUrl: request.endpointUrl,
        apiKeyMasked: request.apiKeyMasked,
        isActive: request.isActive,
        models: request.models,
        actorId,
        actorEmail,
        actorRole,
        ipAddress,
        userAgent
      });
      return this.envelope(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return this.errorEnvelope("UPDATE_PROVIDER_FAILED", msg);
    }
  }

  /**
   * GET /api/v1/admin/audit-logs
   */
  public async getAuditLogs(targetUserId?: string, targetTenantId?: string): Promise<APIResponseEnvelope<AuditRecordDTO[]>> {
    try {
      const result = await this.queryHandler.handleGetUserAuditHistory({ actorId: "api-client", targetUserId, targetTenantId });
      return this.envelope(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return this.errorEnvelope("GET_AUDIT_LOGS_FAILED", msg);
    }
  }

  /**
   * GET /api/v1/admin/system/health
   */
  public async getSystemHealth(): Promise<APIResponseEnvelope<SystemHealthDTO>> {
    try {
      const result = await this.queryHandler.handleGetSystemHealth();
      return this.envelope(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return this.errorEnvelope("GET_SYSTEM_HEALTH_FAILED", msg);
    }
  }

  /**
   * GET /api/v1/admin/feature-flags
   */
  public async getFeatureFlags(): Promise<APIResponseEnvelope<FeatureFlagDTO[]>> {
    try {
      const flags = await this.flagRepo.findAll();
      const dtos: FeatureFlagDTO[] = flags.map((f: FeatureFlag) => ({
        id: f.id,
        key: f.key,
        name: f.name,
        description: f.description,
        isEnabledGlobally: f.isEnabledGlobally,
        tenantOverridesCount: Object.keys(f.tenantOverrides).length
      }));
      return this.envelope(dtos);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return this.errorEnvelope("GET_FLAGS_FAILED", msg);
    }
  }
}
