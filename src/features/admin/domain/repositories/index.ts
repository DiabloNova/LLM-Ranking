/**
 * Phase 7C.5 — Enterprise Admin Repository Interfaces
 * Persistence-agnostic repository abstractions following Domain-Driven Design principles.
 */

import { Tenant, AdminUser, FeatureFlag, AuditRecord, AIProviderConfiguration } from "../types";

export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete?(id: string): Promise<void>;
}

export interface ITenantRepository extends IBaseRepository<Tenant> {
  findBySlug(slug: string): Promise<Tenant | null>;
  findAll(status?: "active" | "suspended" | "archived"): Promise<Tenant[]>;
}

export interface IAdminUserRepository extends IBaseRepository<AdminUser> {
  findByEmail(email: string): Promise<AdminUser | null>;
  findAll(): Promise<AdminUser[]>;
}

export interface IFeatureFlagRepository extends IBaseRepository<FeatureFlag> {
  findByKey(key: string): Promise<FeatureFlag | null>;
  findAll(): Promise<FeatureFlag[]>;
}

export interface IAuditRecordRepository extends IBaseRepository<AuditRecord> {
  findByActorId(actorId: string): Promise<AuditRecord[]>;
  findByResourceId(resourceType: string, resourceId: string): Promise<AuditRecord[]>;
  findAll(): Promise<AuditRecord[]>;
}

export interface IAIProviderConfigurationRepository extends IBaseRepository<AIProviderConfiguration> {
  findByProviderName(name: string): Promise<AIProviderConfiguration | null>;
  findAllActive(): Promise<AIProviderConfiguration[]>;
  findAll(): Promise<AIProviderConfiguration[]>;
}
