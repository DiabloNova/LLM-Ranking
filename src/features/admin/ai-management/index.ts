/**
 * Phase 7C.5 — Enterprise AI Operations Console
 * Regulates OpenAI, Anthropic, Gemini, and Local Model availability, failover triggers, and registry.
 */

import { AdminMockDatabase } from "../infrastructure/mock-db";
import { AIProviderConfiguration, AIModelConfiguration } from "../domain/types";

export interface AIProviderStatusReport {
  providerId: string;
  providerName: string;
  endpointUrl: string;
  isActive: boolean;
  overallHealth: "healthy" | "degraded" | "unreachable";
  latencyMs: number;
  models: {
    modelId: string;
    name: string;
    isAvailable: boolean;
    costPerMillionTokens: number;
  }[];
}

export class AIOperationsConsole {
  private db: AdminMockDatabase;

  constructor(db?: AdminMockDatabase) {
    this.db = db || AdminMockDatabase.getInstance();
  }

  /**
   * Retrieves the current AI Provider registry with live operational metrics
   */
  public getProviderRegistry(): AIProviderStatusReport[] {
    const providers = Array.from(this.db.aiProviders.values());

    return providers.map((p: AIProviderConfiguration) => {
      let overallHealth: "healthy" | "degraded" | "unreachable" = "healthy";
      let totalLatency = 0;

      if (!p.isActive) {
        overallHealth = "unreachable";
      } else {
        const activeModels = p.models.filter(m => m.isAvailable);
        if (activeModels.length === 0) {
          overallHealth = "degraded";
        }
        totalLatency = p.models.reduce((sum, m) => sum + m.latencyAvgMs, 0);
      }

      const avgLatency = p.models.length > 0 ? Math.round(totalLatency / p.models.length) : 0;

      return {
        providerId: p.id,
        providerName: p.providerName,
        endpointUrl: p.endpointUrl,
        isActive: p.isActive,
        overallHealth,
        latencyMs: avgLatency,
        models: p.models.map((m: AIModelConfiguration) => ({
          modelId: m.modelId,
          name: m.name,
          isAvailable: m.isAvailable && p.isActive,
          costPerMillionTokens: (m.inputTokenCostPerK + m.outputTokenCostPerK) * 500
        }))
      };
    });
  }

  /**
   * Trigger manual failover of a provider to its designated backup failover target
   */
  public triggerFailover(providerId: string): { success: boolean; activeProviderId: string; message: string } {
    const provider = this.db.aiProviders.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found.`);
    }

    if (!provider.failoverProviderId) {
      return {
        success: false,
        activeProviderId: providerId,
        message: `Provider ${provider.providerName} has no registered failover backup.`
      };
    }

    const backup = this.db.aiProviders.get(provider.failoverProviderId);
    if (!backup) {
      return {
        success: false,
        activeProviderId: providerId,
        message: `Registered failover target ID ${provider.failoverProviderId} was not found in the registry.`
      };
    }

    // Set source provider inactive and verify backup provider is active
    provider.isActive = false;
    backup.isActive = true;

    provider.audit.updatedAt = new Date().toISOString();
    backup.audit.updatedAt = new Date().toISOString();

    return {
      success: true,
      activeProviderId: backup.id,
      message: `Successfully failed over from ${provider.providerName} to ${backup.providerName}.`
    };
  }
}
