import type { Metadata } from "next"
import type React from "react"
import { localizedMetadata } from "@/lib/seo-metadata"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return localizedMetadata(locale, {
    en: { title: "SEO and AI Search Resources", description: "Technical guides, API documentation and practical resources for AI search visibility." },
    fa: { title: "منابع سئو و جست‌وجوی هوشمند", description: "راهنماهای فنی، مستندات API و منابع کاربردی برای دیده‌شدن در جست‌وجوی هوشمند." },
  }, "resources")
}

export default function PublicRouteLayout({ children }: { children: React.ReactNode }) {
  return children
}
