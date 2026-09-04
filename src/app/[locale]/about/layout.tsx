import type { Metadata } from "next"
import type React from "react"
import { localizedMetadata } from "@/lib/seo-metadata"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return localizedMetadata(locale, {
    en: { title: "About Seorchable", description: "Meet the team and product vision behind Seorchable." },
    fa: { title: "درباره سئورچبل", description: "با تیم و چشم‌انداز محصول سئورچبل آشنا شوید." },
  }, "about")
}

export default function PublicRouteLayout({ children }: { children: React.ReactNode }) {
  return children
}
