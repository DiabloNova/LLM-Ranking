import type { Metadata } from "next"
import type React from "react"
import { localizedMetadata } from "@/lib/seo-metadata"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return localizedMetadata(locale, {
    en: { title: "Pricing for AI Search Intelligence", description: "Choose a Seorchable plan for measurable SEO, AEO and GEO intelligence." },
    fa: { title: "قیمت‌گذاری تحلیل جست‌وجوی هوشمند", description: "پلن مناسب برای تحلیل قابل‌اندازه‌گیری SEO، AEO و GEO را انتخاب کنید." },
  }, "pricing")
}

export default function PublicRouteLayout({ children }: { children: React.ReactNode }) {
  return children
}
