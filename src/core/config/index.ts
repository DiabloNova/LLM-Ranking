/**
 * Phase 7C.5 — Enterprise Environment-Based Configuration Infrastructure
 */

export interface SystemEnvironmentConfig {
  nodeEnv: "development" | "production" | "test";
  databaseUrl: string;
  isIranMarketLocalised: boolean;
  ssoEnabled: boolean;
  mfaRequired: boolean;
  aiDefaultMaxTokens: number;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: SystemEnvironmentConfig;

  private constructor() {
    this.config = {
      nodeEnv: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
      databaseUrl: process.env.DATABASE_URL || "postgresql://localhost:5432/aeo_saas",
      isIranMarketLocalised: process.env.NEXT_PUBLIC_IRAN_MARKET_LOCALISED === "true" || true, // Defaults to localized Phase 1 strategic flag
      ssoEnabled: process.env.ADMIN_SSO_ENABLED === "true" || false,
      mfaRequired: process.env.ADMIN_MFA_REQUIRED === "true" || true,
      aiDefaultMaxTokens: parseInt(process.env.AI_DEFAULT_MAX_TOKENS || "4000", 10)
    };
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public get<K extends keyof SystemEnvironmentConfig>(key: K): SystemEnvironmentConfig[K] {
    return this.config[key];
  }

  public getFullConfig(): SystemEnvironmentConfig {
    return { ...this.config };
  }
}

export const coreConfig = ConfigManager.getInstance();
