import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { servicesData } from "@/data/services";
import { DOCS_INDEX } from "@/lib/docsIndex";

/**
 * Root sitemap handler.
 *
 * Enumerates every publicly indexable route for both supported locales and emits
 * hreflang alternates for each entry so `fa` and `en` are linked as language variants.
 *
 * Authenticated surfaces (dashboard, settings, profile, invoice) and transactional
 * pages (login, register, verify-email, forgot-password) are intentionally excluded.
 *
 * Route: /sitemap.xml
 */
const LOCALES = ["fa", "en"] as const;
type Locale = (typeof LOCALES)[number];

interface RouteDefinition {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}

const STATIC_ROUTES: RouteDefinition[] = [
  { path: "", changeFrequency: "daily", priority: 1.0 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
  { path: "/features", changeFrequency: "weekly", priority: 0.9 },
  { path: "/solutions", changeFrequency: "weekly", priority: 0.9 },
  { path: "/solutions/aeo", changeFrequency: "weekly", priority: 0.8 },
  { path: "/solutions/geo", changeFrequency: "weekly", priority: 0.8 },
  { path: "/solutions/protection", changeFrequency: "weekly", priority: 0.8 },
  { path: "/solutions/radar", changeFrequency: "weekly", priority: 0.8 },
  { path: "/industries", changeFrequency: "monthly", priority: 0.7 },
  { path: "/resources", changeFrequency: "weekly", priority: 0.7 },
  { path: "/blog", changeFrequency: "daily", priority: 0.8 },
  { path: "/docs", changeFrequency: "weekly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
];

function absoluteUrl(locale: Locale, path: string): string {
  return `${siteConfig.url}/${locale}${path}`;
}

function languageAlternates(path: string): Record<string, string> {
  return LOCALES.reduce<Record<string, string>>((acc, locale) => {
    acc[locale] = absoluteUrl(locale, path);
    return acc;
  }, {});
}

function buildEntries(routes: RouteDefinition[], lastModified: Date): MetadataRoute.Sitemap {
  return routes.flatMap((route) =>
    LOCALES.map((locale) => ({
      url: absoluteUrl(locale, route.path),
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: languageAlternates(route.path),
      },
    }))
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const serviceRoutes: RouteDefinition[] = Object.keys(servicesData).map((slug) => ({
    path: `/services/${slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const docsRoutes: RouteDefinition[] = DOCS_INDEX.map((doc) => ({
    path: `/docs/${doc.slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return buildEntries([...STATIC_ROUTES, ...serviceRoutes, ...docsRoutes], lastModified);
}
