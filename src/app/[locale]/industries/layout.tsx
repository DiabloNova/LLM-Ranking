import type { Metadata } from "next"
import type React from "react"
import { localizedMetadata } from "@/lib/seo-metadata"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return localizedMetadata(locale, {
    en: { title: "AI Search Intelligence by Industry", description: "See how organizations in different industries can measure visibility across AI search." },
    fa: { title: "تحلیل جست‌وجوی هوشمند برای صنایع", description: "ببینید سازمان‌ها در صنایع مختلف چگونه دیده‌شدن خود را در جست‌وجوی هوشمند اندازه می‌گیرند." },
  }, "industries")
}

export default function PublicRouteLayout({ children }: { children: React.ReactNode }) {
  return children
}
