"use client";

import React, { use } from "react";
import { Header } from "@/components/marketing/Header";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import AppSidebar from "@/components/navigation/AppSidebar";
import { Sparkles, Brain, Search, Activity, Network, CheckCircle, ShieldCheck, Cpu } from "lucide-react";
import Link from "next/link";

export default function SolutionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isFa = locale === "fa";

  const solutions = [
    {
      id: "geo",
      link: `/${locale}/solutions/geo`,
      icon: <Search size={24} className="text-[#f97316]" />,
      titleFa: "بهینه‌سازی GEO",
      titleEn: "GEO Optimization",
      descFa: "آماده‌سازی معماری محتوای شما برای موتورهای جستجوی تولیدی مبتنی بر هوش مصنوعی.",
      descEn: "Prepare your content architecture for generative AI search engines."
    },
    {
      id: "aeo",
      link: `/${locale}/solutions/aeo`,
      icon: <Brain size={24} className="text-[#38bdf8]" />,
      titleFa: "بهینه‌سازی پاسخ‌ها AEO",
      titleEn: "AEO Optimization",
      descFa: "بهینه‌سازی ساختار داده‌ها برای استخراج بهتر پاسخ توسط مدل‌های زبانی مانند ChatGPT.",
      descEn: "Optimize data structures for better answer extraction by LLMs like ChatGPT."
    },
    {
      id: "protection",
      link: `/${locale}/solutions/protection`,
      icon: <ShieldCheck size={24} className="text-emerald-400" />,
      titleFa: "محافظت از برند",
      titleEn: "Brand Protection",
      descFa: "محافظت در برابر توهم مدل‌های زبانی و حفظ اعتبار برند در خروجی‌های هوش مصنوعی.",
      descEn: "Protect against LLM hallucinations and maintain brand factual accuracy."
    },
    {
      id: "radar",
      link: `/${locale}/solutions/radar`,
      icon: <Activity size={24} className="text-[#8b5cf6]" />,
      titleFa: "رادار پایش رقبا",
      titleEn: "Competitive Radar",
      descFa: "تحلیل مقایسه‌ای وضعیت برند شما و رقبا در اکوسیستم مدل‌های زبانی و موتورهای جستجو.",
      descEn: "Comparative analysis of your brand vs competitors in the AI and search ecosystem."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-primary)]" style={{ direction: isFa ? "rtl" : "ltr" }}>
      <AppSidebar />
      <Header />

      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-1/4 right-1/4 w-[35vw] h-[35vw] bg-gradient-to-br from-[#8b5cf6]/10 to-[#38bdf8]/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute inset-0 grid-backdrop opacity-[0.2] pointer-events-none -z-10" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-bold text-violet-400">
              <Sparkles size={12} className="animate-pulse" />
              <span>{isFa ? "راهکارها" : "Solutions"}</span>
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-gradient-brand">
              {isFa ? "راهکارهای جامع سئورچبل" : "Comprehensive Solutions"}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              {isFa
                ? "مجموعه‌ای از ابزارها و استراتژی‌های اثبات‌شده برای تسلط بر دیده‌شدن در عصر هوش مصنوعی."
                : "A suite of proven tools and strategies to master visibility in the era of Artificial Intelligence."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 pt-8">
            {solutions.map((sol) => (
              <Link href={sol.link} key={sol.id}>
                <div className="glass-panel p-8 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-6 hover:border-[var(--sky-blue-500)]/40 transition-all hover-lift h-full flex flex-col">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--muted-surface)]/50 border border-[var(--border)] flex items-center justify-center">
                    {sol.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-display mb-2 text-[var(--text-primary)]">{isFa ? sol.titleFa : sol.titleEn}</h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{isFa ? sol.descFa : sol.descEn}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
