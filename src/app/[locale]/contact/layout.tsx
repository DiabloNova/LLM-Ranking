import type { Metadata } from "next"
import type React from "react"
import { localizedMetadata } from "@/lib/seo-metadata"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return localizedMetadata(locale, {
    en: { title: "Contact Seorchable", description: "Talk with the Seorchable team about AI search visibility for your organization." },
    fa: { title: "تماس با سئورچبل", description: "با تیم سئورچبل درباره دیده‌شدن سازمان خود در جست‌وجوی هوشمند گفتگو کنید." },
  }, "contact")
}

export default function PublicRouteLayout({ children }: { children: React.ReactNode }) {
  return children
}
