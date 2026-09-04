import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * Root robots.txt handler.
 *
 * Behaviour:
 * - Non-production deployments are fully disallowed so preview/staging URLs never enter an index.
 * - Production allows general crawlers plus the answer-engine / LLM crawlers this product is built around,
 *   while keeping authenticated surfaces and API routes out of the index.
 *
 * Route: /robots.txt
 */
const DISALLOWED_PATHS = [
  "/api/",
  "/fa/dashboard",
  "/en/dashboard",
  "/fa/settings",
  "/en/settings",
  "/fa/profile",
  "/en/profile",
  "/fa/invoice",
  "/en/invoice",
  "/fa/verify-email",
  "/en/verify-email",
  "/fa/forgot-password",
  "/en/forgot-password",
];

// Answer-engine and LLM crawlers. Explicitly allowed: AEO/GEO visibility is the product thesis.
const ANSWER_ENGINE_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  "Applebot-Extended",
  "CCBot",
  "meta-externalagent",
];

function isProductionSite(): boolean {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV;
  return appEnv === "production";
}

export default function robots(): MetadataRoute.Robots {
  if (!isProductionSite()) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
      ...ANSWER_ENGINE_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOWED_PATHS,
      })),
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
