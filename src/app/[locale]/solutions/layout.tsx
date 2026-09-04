import type { Metadata } from "next";
import type React from "react";
import { localizedMetadata } from "@/lib/seo-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return localizedMetadata(locale, {
    en: { title: "AI Search Solutions for Brand Visibility", description: "Explore practical SEO, AEO and GEO solutions for improving how your organization appears in AI search." },
    fa: { title: "راهکارهای دیده‌شدن برند در جست‌وجوی هوشمند", description: "راهکارهای کاربردی SEO، AEO و GEO برای بهبود حضور سازمان شما در جست‌وجوی هوشمند." },
  }, "solutions");
}

export default function SolutionsLayout({ children }: { children: React.ReactNode }) { return children; }
