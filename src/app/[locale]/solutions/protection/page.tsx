"use client";

import React, { use } from "react";
import { Header } from "@/components/marketing/Header";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import AppSidebar from "@/components/navigation/AppSidebar";
import { Sparkles, ShieldCheck, AlertCircle, CheckCircle } from "lucide-react";

export default function ProtectionSolutionPage({ params }: { params: Promise<{ locale: string }> }) {
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400">
              <Sparkles size={12} className="animate-pulse" />
              <span>{isFa ? "محافظت از برند" : "Brand Protection"}</span>
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-gradient-brand">
              {isFa ? "محافظت معنایی و اعتبارسنجی برند" : "Semantic Brand Protection"}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              {isFa
                ? "پایش مستمر مدل‌های هوش زبانی برای جلوگیری از تخریب برند، رفع توهم‌ها و اصلاح اطلاعات سوگیرانه."
                : "Continuous monitoring of LLM outputs to preempt brand defamation, resolve hallucinations, and correct biased outputs."}
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-6">
            <h3 className="text-xl font-bold font-display flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={22} />
              <span>{isFa ? "۱. پایش زنده توهم برند" : "1. Live Hallucination Watch"}</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {isFa
                ? "مدل‌های زبانی بزرگ ممکن است با ارائه‌ی پاسخ‌های توهم‌آمیز، اطلاعات نادرستی در مورد موجودیت، آدرس، تماس یا دستاوردهای کسب‌وکار شما ارائه دهند. سئورچبل این انحرافات را پایش کرده و برطرف می‌کند."
                : "LLMs frequently generate false claims regarding corporate assets, services, and locations. Our semantic agent scans query models daily to flag and fix deflection risks."}
            </p>

            <h3 className="text-xl font-bold font-display flex items-center gap-2">
              <AlertCircle className="text-orange-400" size={22} />
              <span>{isFa ? "۲. شناسایی ارجاعات مخرب رقابتی" : "2. Competitor Deflection Control"}</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {isFa
                ? "جلوگیری از انحراف مشتریان شما به سمت رقبا در اثر سوگیری‌ها یا اشتباهات متنی چت‌بات‌ها به وسیله ارائه‌ی مراجع معنایی غنی و متصل."
                : "Ensure conversational search users are not redirected to competitors due to model attribution errors. We construct highly interconnected, canonical schemas that direct traffic to your true brand endpoints."}
            </p>

            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
              <h4 className="text-xs font-bold text-emerald-400">{isFa ? "راهکار محافظتی هوش برند" : "Brand Defense Scope"}</h4>
              <ul className="text-xs text-[var(--text-muted)] space-y-1 font-semibold">
                <li className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>{isFa ? "حفاظت شبانه‌روزی از یکپارچگی اطلاعات" : "24/7 scanning of brand factual integrity"}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>{isFa ? "کاهش خطاهای استناد و توهم برند تا ۸۵٪" : "Cuts brand citation deflection rates by up to 85%"}</span>
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
