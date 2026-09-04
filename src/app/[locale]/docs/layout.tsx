import type { Metadata } from "next"
import type React from "react"
import { localizedMetadata } from "@/lib/seo-metadata"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return localizedMetadata(locale, {
    en: { title: "Seorchable Documentation", description: "Product, API and architecture documentation for building better AI search visibility." },
    fa: { title: "مستندات سئورچبل", description: "مستندات محصول، API و معماری برای ساخت دیده‌شدن بهتر در جست‌وجوی هوشمند." },
  }, "docs")
}

export default function PublicRouteLayout({ children }: { children: React.ReactNode }) {
  return children
}
