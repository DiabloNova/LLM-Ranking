"use client";

import React, { use } from "react";
import { Header } from "@/components/marketing/Header";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import AppSidebar from "@/components/navigation/AppSidebar";
import { Sparkles, Building2, ShoppingBag, Stethoscope, Landmark, GraduationCap } from "lucide-react";
import Link from "next/link";

export default function IndustriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isFa = locale === "fa";

  const industries = [
    {
      id: "ecommerce",
      icon: <ShoppingBag size={24} className="text-[#38bdf8]" />,
      titleFa: "تجارت الکترونیک و فروشگاه‌ها",
      titleEn: "E-Commerce & Retail",
      descFa: "کشف فرصت‌های خرید و حضور در پیشنهادات محصولات مدل‌های زبانی مانند ChatGPT.",
      descEn: "Optimize product entity schemas to ensure accurate recommendations in AI purchasing queries."
    },
    {
      id: "finance",
      icon: <Landmark size={24} className="text-emerald-400" />,
      titleFa: "خدمات مالی و بانکی",
      titleEn: "Finance & Banking",
      descFa: "مدیریت شهرت، پاسخ‌دهی دقیق به سوالات پیچیده مالی بدون توهم در نتایج هوش مصنوعی.",
      descEn: "Establish brand authority and deterministic answers for complex financial LLM prompts."
    },
    {
      id: "healthcare",
      icon: <Stethoscope size={24} className="text-rose-400" />,
      titleFa: "سلامت و پزشکی",
      titleEn: "Healthcare Providers",
      descFa: "کمک به بررسی دقیق اطلاعات کلینیک‌ها و خدمات در پاسخ‌های مدل‌های درمانی.",
      descEn: "Review factual references of medical services and locations to prevent dangerous hallucinations."
    },
    {
      id: "b2b",
      icon: <Building2 size={24} className="text-[#f97316]" />,
      titleFa: "نرم‌افزارهای سازمانی (B2B SaaS)",
      titleEn: "B2B SaaS & Technology",
      descFa: "تثبیت سهم صدای راهکارهای سازمانی در میان جستجوهای تخصصی و تحلیل رقبای بازار.",
      descEn: "Monitor competitor capabilities and secure feature visibility in generative tech evaluations."
    },
    {
      id: "education",
      icon: <GraduationCap size={24} className="text-[#8b5cf6]" />,
      titleFa: "آموزش و دانشگاه‌ها",
      titleEn: "Education & Universities",
      descFa: "ارتقای دیده‌شدن دوره‌ها و مقالات پژوهشی در موتورهای جستجوی معنایی و هوشمند.",
      descEn: "Boost discoverability of academic programs and research outputs in semantic engines."
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
              <span>{isFa ? "صنایع هدف" : "Supported Industries"}</span>
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-gradient-brand">
              {isFa ? "راهکارهای صنعتی در عصر هوش مصنوعی" : "AI Readiness by Industry"}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              {isFa
                ? "هر صنعتی با چالش‌های منحصر به فردی در مدل‌های زبانی روبروست. ما ساختارهای اثبات‌پذیر را برای بخش‌های مختلف پیاده‌سازی کرده‌ایم."
                : "Every industry faces unique risks with LLM hallucinations. We deliver structured, evidence-backed observability tailored for major sectors."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((ind) => (
              <div key={ind.id} className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-4 hover:border-[var(--sky-blue-500)]/30 transition-all hover-lift">
                <div className="w-12 h-12 rounded-xl bg-[var(--muted-surface)]/50 border border-[var(--border)] flex items-center justify-center">
                  {ind.icon}
                </div>
                <h3 className="text-lg font-bold font-display">{isFa ? ind.titleFa : ind.titleEn}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{isFa ? ind.descFa : ind.descEn}</p>
              </div>
            ))}
          </div>

          <div className="glass-panel p-8 mt-12 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-center space-y-6">
            <h3 className="text-2xl font-bold font-display">{isFa ? "صنعت شما در لیست نیست؟" : "Don't see your industry?"}</h3>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              {isFa
                ? "فناوری هسته‌ی ما انعطاف‌پذیر است. گراف‌های دانش اختصاصی و پایش مبتنی بر مستندات، برای تمامی سازمان‌های بزرگ قابل اجراست."
                : "Our core technology is agnostic. Private knowledge graphs and strict tenant isolation make the platform adaptable to any enterprise requirement."}
            </p>
            <div className="flex justify-center pt-2">
              <Link href={`/${locale}/contact`}>
                <button className="px-6 py-3 rounded-xl bg-[var(--muted-surface)] border border-[var(--glass-border)] hover:bg-[var(--glass-border)] text-[var(--text-primary)] font-bold text-sm transition-all">
                  {isFa ? "ارتباط با کارشناسان" : "Contact Our Experts"}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
