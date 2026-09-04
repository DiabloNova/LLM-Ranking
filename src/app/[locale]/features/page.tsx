"use client";

import React, { use } from "react";
import { Header } from "@/components/marketing/Header";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import AppSidebar from "@/components/navigation/AppSidebar";
import { Sparkles, Brain, Search, Activity, Network, Target, CheckCircle, ShieldCheck, Cpu } from "lucide-react";
import Link from "next/link";

export default function FeaturesPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isFa = locale === "fa";

  const features = [
    {
      id: "ai-visibility",
      icon: <Brain size={24} className="text-[#38bdf8]" />,
      titleFa: "موتور سنجش دیده‌شدن در هوش مصنوعی",
      titleEn: "AI Visibility Engine",
      descFa: "پایش سهم صدای برند و حضور سازمان در خروجی مدل‌های زبانی مانند ChatGPT و Claude.",
      descEn: "Track your brand's share of voice and presence across major LLMs like ChatGPT and Claude."
    },
    {
      id: "seo-intelligence",
      icon: <Search size={24} className="text-[#f97316]" />,
      titleFa: "هوش سئوی ساختاری",
      titleEn: "Selective SEO Intelligence",
      descFa: "تحلیل دقیق قابلیت‌های خزش، نمایه‌سازی و ساختار صفحات بدون معیارهای گمراه‌کننده.",
      descEn: "Deterministic analysis of crawlability, indexability, and site architecture without fabricated vanity metrics."
    },
    {
      id: "content-intelligence",
      icon: <Target size={24} className="text-emerald-400" />,
      titleFa: "هوش محتوایی و AEO",
      titleEn: "Content & AEO Intelligence",
      descFa: "شناسایی شکاف‌های محتوایی و استخراج ساختار بهینه پاسخگو (Answerability) برای تولید محتوای سئو شده.",
      descEn: "Identify content gaps and extract optimized answer structures to build highly-cited content."
    },
    {
      id: "competitive",
      icon: <Activity size={24} className="text-[#8b5cf6]" />,
      titleFa: "هوش رقابتی متمرکز",
      titleEn: "Competitive Intelligence",
      descFa: "مقایسه هوشمند سازمان با رقبا در زمینه سئو، کلمات کلیدی، و شاخص‌های هوش مصنوعی.",
      descEn: "Deterministic comparison against competitors across SEO, keywords, topics, and AI indexes."
    },
    {
      id: "knowledge-graph",
      icon: <Network size={24} className="text-pink-400" />,
      titleFa: "هوش گراف دانش",
      titleEn: "Knowledge Intelligence",
      descFa: "ایجاد موجودیت‌های معنایی استاندارد و نقشه‌برداری ارتباطات کلیدی با بالاترین دقت.",
      descEn: "Establish standard semantic entities and map crucial relationships with multi-tenant graph isolation."
    },
    {
      id: "monitoring",
      icon: <ShieldCheck size={24} className="text-yellow-400" />,
      titleFa: "پایش برند و اعتبار",
      titleEn: "Brand Monitoring",
      descFa: "رهگیری استنادات نام تجاری، بررسی زمینه و بافت اشارات، و تحلیل میزان توهم مدل‌ها.",
      descEn: "Track brand citations, analyze context and sentiment, and monitor LLM hallucination risks."
    },
    {
      id: "diagnostics",
      icon: <Cpu size={24} className="text-[#38bdf8]" />,
      titleFa: "موتور تشخیص و اقدام",
      titleEn: "Diagnostic & Action Engine",
      descFa: "تحلیل یکپارچه خطاها، ریشه‌یابی سیستمی، و تولید اقدامات اجرایی بر اساس داده‌های اثبات‌شده.",
      descEn: "Unified analysis of technical signals, root-cause dependencies, and evidence-backed recommendations."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-primary)]" style={{ direction: isFa ? "rtl" : "ltr" }}>
      <AppSidebar />
      <Header />

      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-1/3 left-1/4 w-[40vw] h-[40vw] bg-gradient-to-tr from-[#38bdf8]/10 to-[#f97316]/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute inset-0 grid-backdrop opacity-[0.2] pointer-events-none -z-10" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-bold text-sky-400">
              <Sparkles size={12} className="animate-pulse" />
              <span>{isFa ? "قابلیت‌های هسته مرکزی" : "Core Capabilities"}</span>
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-gradient-brand">
              {isFa ? "امکانات پلتفرم سئورچبل" : "Platform Features"}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              {isFa
                ? "مجموعه‌ای کامل از ابزارهای تحلیلی بدون توهم و اثبات‌پذیر برای تسلط بر جستجوی مدرن."
                : "A deterministic, evidence-backed suite of intelligence tools designed to master modern AI search."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div key={feat.id} className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-4 hover:border-[var(--sky-blue-500)]/30 transition-all hover-lift">
                <div className="w-12 h-12 rounded-xl bg-[var(--muted-surface)]/50 border border-[var(--border)] flex items-center justify-center">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold font-display">{isFa ? feat.titleFa : feat.titleEn}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{isFa ? feat.descFa : feat.descEn}</p>

                <div className="pt-4 mt-auto">
                  <ul className="space-y-2 text-xs font-medium text-[var(--text-muted)]">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={12} className="text-emerald-400" />
                      <span>{isFa ? "با تکیه بر داده و شواهد" : "Evidence-aware workflows"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={12} className="text-emerald-400" />
                      <span>{isFa ? "قابل بررسی و مستند" : "Evidence-based analysis"}</span>
                    </li>
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-8">
            <Link href={`/${locale}/#pricing`}>
              <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#f97316] text-white font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-sky-500/20">
                {isFa ? "مشاهده تعرفه‌ها و شروع" : "View Pricing & Get Started"}
              </button>
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
