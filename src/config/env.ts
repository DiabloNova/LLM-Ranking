// Application environment configurations
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://api.brandintelligence.ai",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
} as const;

export type Env = typeof env;
