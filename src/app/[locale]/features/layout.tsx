import type { Metadata } from "next"
import type React from "react"
import { localizedMetadata } from "@/lib/seo-metadata"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return localizedMetadata(locale, {
    en: { title: "AI Search Visibility Features", description: "Explore SEO, AEO, GEO, citation intelligence and brand visibility workflows." },
    fa: { title: "قابلیت‌های دیده‌شدن در جست‌وجوی هوشمند", description: "قابلیت‌های سئو، AEO، GEO، تحلیل استناد و پایش دیده‌شدن برند را بررسی کنید." },
  }, "features")
}

export default function PublicRouteLayout({ children }: { children: React.ReactNode }) {
  return children
}
