import type { Metadata } from "next";
import type React from "react";
import { siteConfig } from "@/config/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const language = locale === "fa" ? "fa" : "en";
  const title = language === "fa" ? `خدمات ${slug} سئورچبل` : `${slug} Services | Seorchable`;
  const description = language === "fa" ? `جزئیات سرویس ${slug} برای تحلیل و بهینه‌سازی دیده‌شدن برند.` : `Explore Seorchable's ${slug} service for measurable brand visibility across search and AI answers.`;
  const path = `/services/${slug}`;
  return {
    title,
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: `${siteConfig.url}/${language}${path}`, languages: { en: `${siteConfig.url}/en${path}`, fa: `${siteConfig.url}/fa${path}` } },
    openGraph: { title, description, url: `${siteConfig.url}/${language}${path}`, siteName: siteConfig.name, type: "website", images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [siteConfig.ogImage] },
  };
}

export default function ServiceLayout({ children }: { children: React.ReactNode }) { return children; }
