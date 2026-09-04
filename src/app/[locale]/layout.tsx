import React from "react";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import { getServerSessionAction } from "@/app/actions/auth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { persianPrimary } from "@/config/fonts";
import { siteConfig } from "@/config/site";
import { JsonLd, organizationSchema, websiteSchema, softwareApplicationSchema } from "@/components/seo/JsonLd";
import FloatingSidebar from "@/components/navigation/FloatingSidebar";
import GlobalNavigationControls from "@/components/navigation/GlobalNavigationControls";
import "../globals.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isFa = locale === "fa";
  const title = isFa
    ? "تحلیل دیده‌شدن برند در جست‌وجوی هوشمند | سئورچبل"
    : "Brand Visibility Intelligence for AI Search | Seorchable";
  const description = isFa
    ? "تحلیل SEO، AEO و GEO برای سنجش حضور برند در گوگل، موتورهای پاسخ‌گو و مدل‌های زبانی، با گزارش‌های قابل اقدام برای کسب‌وکارهای ایران."
    : "Measure and improve your brand visibility across traditional search, answer engines and large language models with actionable SEO, AEO and GEO insights.";

  return {
    title: { default: title, template: `%s | ${siteConfig.name}` },
    description,
    keywords: isFa
      ? ["سئو", "بهینه‌سازی موتور جست‌وجو", "AEO", "GEO", "تحلیل برند", "جست‌وجوی هوشمند", "سئورچبل"]
      : ["SEO", "AEO", "GEO", "AI search", "brand visibility", "answer engine optimization", "Seorchable"],
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: `/${locale}`,
      languages: { fa: "/fa", en: "/en" },
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/${locale}`,
      siteName: siteConfig.name,
      locale: isFa ? "fa_IR" : "en_US",
      alternateLocale: isFa ? ["en_US"] : ["fa_IR"],
      type: "website",
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [siteConfig.ogImage] },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  colorScheme: "light dark",
};

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Configures the localized application layout and provider hierarchy.
 *
 * @param params - Resolves to the current route locale.
 * @returns The document layout containing the localized direction, theme provider, authentication provider, and page content.
 */
export default async function RootLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  const initialSession = await getServerSessionAction();

  // Apply the single primary typeface to body and headings
  const fontClasses = persianPrimary.variable;

  return (
    <html
      lang={locale}
      dir={locale === "fa" ? "rtl" : "ltr"}
      className={fontClasses}
      style={{ backgroundColor: "var(--background)" }}
    >
      <body>
        <ThemeProvider initialLanguage={locale as "en" | "fa"}>
          <AuthProvider initialSession={initialSession}>
            <JsonLd data={[organizationSchema(), websiteSchema(locale), softwareApplicationSchema()]} id="site-structured-data" />
            {children}
            <FloatingSidebar />
            <GlobalNavigationControls />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
