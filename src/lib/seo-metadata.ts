import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

type SeoCopy = { en: { title: string; description: string }; fa: { title: string; description: string } };

/** Shared metadata factory for localized public route layouts. */
export function localizedMetadata(locale: string, copy: SeoCopy, routePath = ""): Metadata {
  const language = locale === "fa" ? "fa" : "en";
  const selected = copy[language];
  const normalizedPath = routePath ? `/${routePath.replace(/^\/+|\/+$/g, "")}` : "";
  const url = `${siteConfig.url}/${language}${normalizedPath}`;

  return {
    title: selected.title,
    description: selected.description,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: url,
      languages: { en: `${siteConfig.url}/en${normalizedPath}`, fa: `${siteConfig.url}/fa${normalizedPath}` },
    },
    openGraph: {
      title: selected.title,
      description: selected.description,
      url,
      siteName: siteConfig.name,
      locale: language === "fa" ? "fa_IR" : "en_US",
      type: "website",
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: selected.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: selected.title,
      description: selected.description,
      images: [siteConfig.ogImage],
    },
  };
}
