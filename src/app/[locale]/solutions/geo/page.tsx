"use client";

import React, { use } from "react";
import { Header } from "@/components/marketing/Header";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import AppSidebar from "@/components/navigation/AppSidebar";
import { Sparkles, Globe, Cpu, CheckCircle } from "lucide-react";

export default function GeoSolutionPage({ params }: { params: Promise<{ locale: string }> }) {
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-bold text-sky-400">
              <Sparkles size={12} className="animate-pulse" />
              <span>{isFa ? "بهینه‌سازی GEO" : "GEO Optimization"}</span>
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-gradient-brand">
              {isFa ? "بهینه‌سازی موتورهای جستجوی هوشمند (GEO)" : "Generative Engine Optimization"}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              {isFa
                ? "ارتقای رتبه، سهم دیده‌شدن و میزان استناد به برند شما در خروجی موتورهای نسل جدید چت‌بات‌ها مانند Perplexity و SearchGPT."
                : "Boost your brand's presence, authority, and citations across generative engines such as SearchGPT, Gemini, and Perplexity."}
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-6">
            <h3 className="text-xl font-bold font-display flex items-center gap-2">
              <Globe className="text-[#38bdf8]" size={22} />
              <span>{isFa ? "۱. نمایه عمومی و مراجع هوشمند" : "1. Generative References"}</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {isFa
                ? "موتورهای جستجوی متکی بر هوش مصنوعی برخلاف موتورهای کلاسیک، اطلاعات را به صورت خلاصه و همراه با ارجاع دقیق به مراجع ارائه می‌دهند. بهینه‌سازی GEO به شما کمک می‌کند تا به عنوان منبع اصلی این پاسخ‌ها انتخاب شوید."
                : "Unlike static search indexes, generative engines synthesize answers dynamically while citing relevant resources. Our GEO framework ensures your content structures are prioritized as primary source citations."}
            </p>

            <h3 className="text-xl font-bold font-display flex items-center gap-2">
              <Cpu className="text-[#f97316]" size={22} />
              <span>{isFa ? "۲. بهبود انطباق معنایی" : "2. Semantic Alignment"}</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {isFa
                ? "تولید تگ‌های ساختاریافته‌ی کلمات کلیدی، بهینه‌سازی بردارهای محتوایی و هماهنگی کامل معنایی وب‌سایت با نیازهای مدل‌های زبانی کلان."
                : "Aligning text vector metrics, fine-tuning schema declarations, and optimizing structural catalogs to meet semantic ingestion requirements of top LLMs."}
            </p>

            <div className="p-4 rounded-xl border border-sky-500/20 bg-sky-500/5 space-y-2">
              <h4 className="text-xs font-bold text-sky-400">{isFa ? "مزایای کلیدی بهینه‌سازی GEO" : "Core GEO Benefits"}</h4>
              <ul className="text-xs text-[var(--text-muted)] space-y-1 font-semibold">
                <li className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>{isFa ? "کاهش چشمگیر نرخ توهم درباره برند شما" : "Significant reduction in model hallucination rate"}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>{isFa ? "افزایش ترافیک ارجاعی با کیفیت بالا" : "High citation retention and conversion flows"}</span>
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
