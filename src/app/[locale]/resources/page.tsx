"use client";

import React, { use } from "react";
import { Header } from "@/components/marketing/Header";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import AppSidebar from "@/components/navigation/AppSidebar";
import { Sparkles, BookOpen, FileText, Video, Code, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isFa = locale === "fa";

  const resources = [
    {
      id: "docs",
      icon: <BookOpen size={32} className="text-[#38bdf8]" />,
      titleFa: "مستندات فنی",
      titleEn: "Technical Documentation",
      descFa: "آموزش‌های گام‌به‌گام و مستندات API برای توسعه‌دهندگان.",
      descEn: "Step-by-step guides, architecture overview, and API references.",
      link: `/${locale}/docs`
    },
    {
      id: "blog",
      icon: <FileText size={32} className="text-[#f97316]" />,
      titleFa: "وبلاگ مهندسی",
      titleEn: "Engineering Blog",
      descFa: "آخرین مقالات، تکنیک‌های بهینه‌سازی GEO و اخبار پلتفرم.",
      descEn: "Latest insights on LLM optimization, GEO strategies, and engineering updates.",
      link: `/${locale}/blog`
    },
    {
      id: "support",
      icon: <Video size={32} className="text-emerald-400" />,
      titleFa: "مرکز پشتیبانی",
      titleEn: "Support Center",
      descFa: "راهنمای استفاده از پلتفرم و تماس با تیم کارشناسان.",
      descEn: "Platform usage guides and direct channels to our experts.",
      link: `/${locale}/contact`
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-primary)]" style={{ direction: isFa ? "rtl" : "ltr" }}>
      <AppSidebar />
      <Header />

      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-1/3 right-1/4 w-[40vw] h-[40vw] bg-gradient-to-tl from-[#38bdf8]/10 to-emerald-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute inset-0 grid-backdrop opacity-[0.2] pointer-events-none -z-10" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-bold text-sky-400">
              <Sparkles size={12} className="animate-pulse" />
              <span>{isFa ? "مرکز منابع" : "Resource Center"}</span>
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-gradient-brand">
              {isFa ? "دانش‌نامه هوش مصنوعی" : "Knowledge & Resources"}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              {isFa
                ? "هر آنچه برای شروع بهینه‌سازی موتورهای پاسخگو، آموزش تیم‌ها، و درک عمیق‌تر از سیستم‌های ما نیاز دارید."
                : "Everything you need to master Generative Engine Optimization, train your team, and understand our architecture."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-8">
            {resources.map((res) => (
              <Link href={res.link} key={res.id}>
                <div className="glass-panel p-8 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-6 hover:border-[#38bdf8]/40 transition-all hover-lift h-full flex flex-col">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--muted-surface)]/50 border border-[var(--border)] flex items-center justify-center">
                    {res.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-display mb-2 text-[var(--text-primary)]">{isFa ? res.titleFa : res.titleEn}</h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{isFa ? res.descFa : res.descEn}</p>
                  </div>
                  <div className="pt-4 mt-auto">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#38bdf8]">
                      <span>{isFa ? "مشاهده منابع" : "Browse"}</span>
                      <ArrowRight size={16} className="rtl:-scale-x-100" />
                    </span>
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
