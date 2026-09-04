"use client";

import React, { use } from "react";
import { Header } from "@/components/marketing/Header";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import AppSidebar from "@/components/navigation/AppSidebar";
import { Sparkles, Users, Award, ShieldCheck, Milestone } from "lucide-react";

export default function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isFa = locale === "fa";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-primary)]" style={{ direction: isFa ? "rtl" : "ltr" }}>
      <AppSidebar />
      <Header />

      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        {/* Decorative background orbs */}
        <div className="absolute top-1/4 right-1/4 w-[35vw] h-[35vw] bg-gradient-to-br from-[#38bdf8]/15 to-[#f97316]/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute inset-0 grid-backdrop opacity-[0.25] pointer-events-none -z-10" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-bold text-sky-400">
              <Sparkles size={12} className="animate-pulse" />
              <span>{isFa ? "درباره‌ی ما" : "About Us"}</span>
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-gradient-brand">
              {isFa ? "آینده بهینه‌سازی موتورهای پاسخگو" : "The Future of AI Optimization"}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              {isFa
                ? "سئورچبل (seorchable.ir) یک پلتفرم تخصصی بهینه‌سازی موتورهای پاسخگوی هوش مصنوعی (AEO) و پایش دیده‌شدن برند شما در عصر مدل‌های زبانی بزرگ است."
                : "seorchable.ir is a focused platform for Generative Engine Optimization (GEO) and Answer Engine Optimization (AEO), tracking and maximizing brand citations in LLM responses."}
            </p>
          </div>

          {/* Core values grid */}
          <div className="grid md:grid-cols-2 gap-6 pt-6">
            <div className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-bold font-display">{isFa ? "ماموریت ما" : "Our Mission"}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                {isFa
                  ? "ما به برندها کمک می‌کنیم تا ساختارهای متاداده و محتواهای خود را به گونه‌ای ارتقا دهند که هوش مصنوعی بتواند آن‌ها را به راحتی درک کرده و بدون بروز توهم استناد دهد."
                  : "We empower enterprise brands to refine their entity schemas, enabling models to index and recommend them accurately without hallucinating."}
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Award size={20} />
              </div>
              <h3 className="text-lg font-bold font-display">{isFa ? "تکنولوژی پیشرو" : "Advanced Tech"}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                {isFa
                  ? "بهره‌گیری از معماری پایش چندمدلی به همراه تحلیل‌های عمیق معنایی، گراف‌های دانش محلی و شاخص دیده‌شدن آنلاین برند."
                  : "Leveraging multi-model agent execution pipelines alongside deep semantic analyzers, knowledge graphs, and real-time visibility metrics."}
              </p>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-4">
            <h2 className="text-xl font-bold font-display flex items-center gap-2">
              <Milestone className="text-[#38bdf8]" size={22} />
              <span>{isFa ? "چشم‌انداز و مسیر پیش‌رو" : "Vision & Strategic Road"}</span>
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
              {isFa
                ? "سئورچبل با تمرکز روی وب‌فارسی و بین‌المللی درصدد است تا شکاف بزرگ بازاریابی نوین در عصر چت‌بات‌ها را با ابزار سنجش پیشرفته و راهکارهای تولید محتوای بهینه‌شده حل کند. با پیوستن به ما، گامی بلند به سوی بهینه‌سازی حضور خود در نتایج پاسخ‌های موتورهای پاسخگو بردارید."
                : "seorchable.ir bridges the critical gap in modern digital presence optimization. By standardizing crawl pipelines and resolving hallucinations, we establish semantic authority for top corporate teams."}
            </p>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
