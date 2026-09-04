/**
 * Phase 7C.5 — Enterprise Admin Domain Event Specifications
 */

import { UserRole, Permission } from "../types";

export interface AdminEventMetadata {
  eventId: string;
  organizationId: string; // Set to "SYSTEM_ADMIN" or specific tenant ID
  actorId: string;
  timestamp: string;
  correlationId: string;
  causationId: string;
  version: number;
}

export interface AdminDomainEvent<TPayload = unknown> {
  metadata: AdminEventMetadata;
  eventType: string;
  aggregateId: string;
  payload: TPayload;
}

// 1. TenantCreatedEvent
export interface TenantCreatedPayload {
  tenantId: string;
  name: string;
  slug: string;
  plan: string;
  createdBy: string;
}
export type TenantCreatedEvent = AdminDomainEvent<TenantCreatedPayload>;

// 1b. AdminUserCreatedEvent
export interface AdminUserCreatedPayload {
  userId: string;
  email: string;
  role: UserRole;
  createdBy: string;
}
export type AdminUserCreatedEvent = AdminDomainEvent<AdminUserCreatedPayload>;

// 2. TenantSuspendedEvent
export interface TenantSuspendedPayload {
  tenantId: string;
  suspendedBy: string;
  reason?: string;
}
export type TenantSuspendedEvent = AdminDomainEvent<TenantSuspendedPayload>;

// 3. UserRoleChangedEvent
export interface UserRoleChangedPayload {
  userId: string;
  oldRole: UserRole;
  newRole: UserRole;
  changedBy: string;
  permissions: Permission[];
}
export type UserRoleChangedEvent = AdminDomainEvent<UserRoleChangedPayload>;

// 4. FeatureFlagChangedEvent
export interface FeatureFlagChangedPayload {
  flagKey: string;
  isEnabledGlobally: boolean;
  tenantIdOverride?: string;
  overrideValue?: boolean;
  changedBy: string;
}
export type FeatureFlagChangedEvent = AdminDomainEvent<FeatureFlagChangedPayload>;

// 5. AIProviderUpdatedEvent
export interface AIProviderUpdatedPayload {
  providerId: string;
  providerName: string;
  isActive: boolean;
  updatedBy: string;
}
export type AIProviderUpdatedEvent = AdminDomainEvent<AIProviderUpdatedPayload>;

// 5b. AIProviderConfiguredEvent
export interface AIProviderConfiguredPayload {
  providerId: string;
  providerName: string;
  endpointUrl: string;
  configuredBy: string;
}
export type AIProviderConfiguredEvent = AdminDomainEvent<AIProviderConfiguredPayload>;

// 6. SecurityPolicyViolationEvent
export interface SecurityPolicyViolationPayload {
  violationId: string;
  eventType: string;
  severity: "low" | "medium" | "high" | "critical";
  actorId?: string;
  ipAddress: string;
  details: string;
}
export type SecurityPolicyViolationEvent = AdminDomainEvent<SecurityPolicyViolationPayload>;

/**
 * Admin Event Factory with proper tracing and correlation support
 */
export const AdminDomainEventFactory = {
  create<T>(
    eventType: string,
    aggregateId: string,
    organizationId: string, // tenant boundary context
    payload: T,
    actorId = "system_admin",
    correlationId?: string,
    causationId?: string,
    version = 1
  ): AdminDomainEvent<T> {
    const traceId = `trace-admin-${Math.random().toString(36).substr(2, 9)}`;
    return {
      metadata: {
        eventId: `evt-admin-${Math.random().toString(36).substr(2, 9)}`,
        organizationId,
        actorId,
        timestamp: new Date().toISOString(),
        correlationId: correlationId || traceId,
        causationId: causationId || traceId,
        version
      },
      eventType,
      aggregateId,
      payload
    };
  }
};
