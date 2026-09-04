import type { Metadata } from "next"
import type React from "react"
import { localizedMetadata } from "@/lib/seo-metadata"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return localizedMetadata(locale, {
    en: { title: "Seorchable Blog: SEO, AEO and GEO", description: "Practical thinking on SEO, answer engines, generative search and brand visibility." },
    fa: { title: "بلاگ سئورچبل: SEO، AEO و GEO", description: "دیدگاه‌ها و آموزش‌های کاربردی درباره سئو، موتورهای پاسخ‌گو و دیده‌شدن برند." },
  }, "blog")
}

export default function PublicRouteLayout({ children }: { children: React.ReactNode }) {
  return children
}
