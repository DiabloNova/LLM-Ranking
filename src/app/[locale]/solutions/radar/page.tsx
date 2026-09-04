"use client";

import React, { use } from "react";
import { Header } from "@/components/marketing/Header";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import AppSidebar from "@/components/navigation/AppSidebar";
import { Sparkles, Compass, BarChart3, CheckCircle } from "lucide-react";

export default function RadarSolutionPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isFa = locale === "fa";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-primary)]" style={{ direction: isFa ? "rtl" : "ltr" }}>
      <AppSidebar />
      <Header />

      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-1/4 right-1/4 w-[35vw] h-[35vw] bg-gradient-to-br from-[#38bdf8]/15 to-[#f97316]/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute inset-0 grid-backdrop opacity-[0.25] pointer-events-none -z-10" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs font-bold text-orange-400">
              <Sparkles size={12} className="animate-pulse" />
              <span>{isFa ? "رصد رقبا" : "Competitive Radar"}</span>
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-gradient-brand">
              {isFa ? "رادار هوشمند پایش و سنجش رقبا" : "Competitive AI Radar"}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              {isFa
                ? "سنجش هوشمند و همه‌جانبه‌ی سهم صدای برند رقیبان شما در تمام مدل‌های برجسته‌ی هوش زبانی (LLM Voice Share)."
                : "Analyze competitor voice shares, citation indices, and factual attributions across generative search results."}
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-6">
            <h3 className="text-xl font-bold font-display flex items-center gap-2">
              <Compass className="text-[#38bdf8]" size={22} />
              <span>{isFa ? "۱. پایش سهم صدا و توزیع احساسات" : "1. Share of Voice Tracking"}</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {isFa
                ? "کدام رقبای شما مکرراً در پاسخ‌های مقایسه‌ای هوش مصنوعی (مثل کاربردی سرویس‌دهنده سئو) معرفی می‌شوند؟ سئورچبل به شما گزارش‌های متناوبی از رتبه و قدرت حضور آن‌ها ارائه می‌کند."
                : "Which competitors are recommended when users ask models for 'best market provider'? We monitor and log competitor recommendation patterns, delivering automated tracking logs and share charts."}
            </p>

            <h3 className="text-xl font-bold font-display flex items-center gap-2">
              <BarChart3 className="text-[#f97316]" size={22} />
              <span>{isFa ? "۲. مهندسی معکوس الگوها" : "2. Reverse Engineering Attributions"}</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {isFa
                ? "استخراج و مهندسی معکوس ساختار مراجعی که مدل‌های زبانی از آن‌ها برای معرفی رقیب استفاده کرده‌اند، جهت اتخاذ تصمیمات استراتژیک."
                : "We trace the references that LLMs cite when recommending your competitors, allowing you to intercept those vectors and optimize your brand coverage."}
            </p>

            <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 space-y-2">
              <h4 className="text-xs font-bold text-orange-400">{isFa ? "مزیت‌های کلیدی رادار رقابتی" : "Key Radar Benefits"}</h4>
              <ul className="text-xs text-[var(--text-muted)] space-y-1 font-semibold">
                <li className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>{isFa ? "تحلیل جامع نقاط ضعف محتوایی در قیاس با رقبا" : "Uncover content gaps where competitors outrank you"}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>{isFa ? "دریافت نمودارهای زنده سهم حضور در بازار" : "Interactive comparative dashboards tracking 5+ competitors"}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
