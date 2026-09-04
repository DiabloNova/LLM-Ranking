"use client";

import React, { use } from "react";
import { Header } from "@/components/marketing/Header";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import AppSidebar from "@/components/navigation/AppSidebar";
import { Sparkles, MessageSquare, Award, CheckCircle } from "lucide-react";

export default function AeoSolutionPage({ params }: { params: Promise<{ locale: string }> }) {
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
              <span>{isFa ? "بهینه‌سازی AEO" : "AEO Optimization"}</span>
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-gradient-brand">
              {isFa ? "بهینه‌سازی موتورهای پاسخگو (AEO)" : "Answer Engine Optimization"}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              {isFa
                ? "قالب‌بندی و بهینه‌سازی محتوای سایت برای حضور موثر و مستمر در کادر پاسخ‌های مستقیم چت‌بات‌های بزرگ هوش مصنوعی."
                : "Structure and tune your web content to win organic, direct answers within LLMs and intelligent chat dialogues."}
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-6">
            <h3 className="text-xl font-bold font-display flex items-center gap-2">
              <MessageSquare className="text-orange-400" size={22} />
              <span>{isFa ? "۱. قالب‌بندی پرسش و پاسخ" : "1. Structuring Q&A Forms"}</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {isFa
                ? "تولید کدهای اسکیما بر پایه استاندارد سوالات متداول (FAQ)، ارائه‌ی پاسخ‌های صریح و بدون ابهام و سازمان‌دهی محتوای متنی جهت تطابق با الگوهای بازیابی اطلاعات مدل‌های زبانی."
                : "Authoring highly structured FAQ elements, compiling explicit definitions, and preparing clean semantic nodes to align with complex LLM retrieval schemas."}
            </p>

            <h3 className="text-xl font-bold font-display flex items-center gap-2">
              <Award className="text-[#38bdf8]" size={22} />
              <span>{isFa ? "۲. ارتقای رتبه و رفرنس‌ها" : "2. Enhancing Recommendations"}</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {isFa
                ? "ابزار بهینه‌سازی فنی سئورچبل کدهای قالب محتوای شما را به صورت بلادرنگ اسکن کرده و توصیه‌های دقیقی را جهت ارتقای امتیاز و برتری بر رقبا ارائه می‌دهد."
                : "Our platform scans your web layout in real-time, delivering tactical, on-page optimization steps to outpace competitor recommendations in conversational search."}
            </p>

            <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 space-y-2">
              <h4 className="text-xs font-bold text-orange-400">{isFa ? "چرا بهینه‌سازی AEO اهمیت دارد؟" : "Why is AEO Vital?"}</h4>
              <ul className="text-xs text-[var(--text-muted)] space-y-1 font-semibold">
                <li className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>{isFa ? "برطرف کردن ارجاعات نامعتبر چت‌بات‌ها" : "Mitigates inaccurate fact rendering and claims"}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>{isFa ? "حضور فعال در نتایج جستجوی مبتنی بر مکالمه" : "Secures authority inside conversational workflows"}</span>
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
