import type { Metadata } from "next";
import type React from "react";
import { localizedMetadata } from "@/lib/seo-metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return localizedMetadata(locale, { en: { title: "Privacy Policy | Seorchable", description: "Read how Seorchable handles account, workspace and product data." }, fa: { title: "سیاست حریم خصوصی | سئورچبل", description: "نحوه مدیریت داده‌های حساب، فضای کاری و محصول در سئورچبل را بخوانید." } }, "privacy");
}
export default function PrivacyLayout({ children }: { children: React.ReactNode }) { return children; }
