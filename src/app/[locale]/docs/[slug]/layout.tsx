import type { Metadata } from "next";
import type React from "react";
import { siteConfig } from "@/config/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const language = locale === "fa" ? "fa" : "en";
  const title = language === "fa" ? `مستندات ${slug} | سئورچبل` : `${slug} Documentation | Seorchable`;
  const description = language === "fa" ? `راهنمای ${slug} در مستندات رسمی سئورچبل.` : `Official Seorchable documentation for ${slug}.`;
  const path = `/docs/${slug}`;
  return { title, description, metadataBase: new URL(siteConfig.url), alternates: { canonical: `${siteConfig.url}/${language}${path}`, languages: { en: `${siteConfig.url}/en${path}`, fa: `${siteConfig.url}/fa${path}` } }, openGraph: { title, description, url: `${siteConfig.url}/${language}${path}`, siteName: siteConfig.name, type: "article" } };
}

export default function DocsSlugLayout({ children }: { children: React.ReactNode }) { return children; }
