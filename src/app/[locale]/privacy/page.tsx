"use client";

import React, { use } from "react";
import { Header } from "@/components/marketing/Header";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import AppSidebar from "@/components/navigation/AppSidebar";
import { ShieldCheck, Lock, Key, Server } from "lucide-react";

export default function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isFa = locale === "fa";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-primary)]" style={{ direction: isFa ? "rtl" : "ltr" }}>
      <AppSidebar />
      <Header />

      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/4 right-1/4 w-[35vw] h-[35vw] bg-gradient-to-br from-[#38bdf8]/15 to-[#f97316]/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute inset-0 grid-backdrop opacity-[0.25] pointer-events-none -z-10" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400">
              <ShieldCheck size={12} className="animate-pulse" />
              <span>{isFa ? "حریم خصوصی و امنیت" : "Privacy & Data Security"}</span>
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-gradient-brand">
              {isFa ? "حفاظت کامل از داده‌های سازمانی" : "Enterprise Data Protection"}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              {isFa
                ? "سیاست‌های سئورچبل (seorchable.ir) در راستای تامین امنیت و حریم خصوصی داده‌های خزش‌شده و اسناد اختصاصی شما."
                : "At seorchable.ir, we safeguard crawled corporate data and isolated schemas within secure databases."}
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-6">
            <h3 className="text-xl font-bold font-display flex items-center gap-2">
              <Lock className="text-emerald-400" size={20} />
              <span>{isFa ? "۱. حریم خصوصی اسناد ورودیافته" : "1. Document Isolation"}</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {isFa
                ? "تمام اسناد و متون بارگذاری‌شده توسط کاربران در بخش ورود اسناد (Ingest)، تحت ایزولاسیون کامل مستاجر قرار گرفته و هرگز برای آموزش مدل‌های عمومی زبان طبیعی به کار گرفته نخواهند شد."
                : "All uploaded document chunks are processed inside sandboxed environments and isolated at the row-level (RLS). They are never shared with public LLM providers or used as training corpora."}
            </p>

            <h3 className="text-xl font-bold font-display flex items-center gap-2">
              <Key className="text-[#38bdf8]" size={20} />
              <span>{isFa ? "۲. رمزنگاری کامل اطلاعات" : "2. Full Encryption"}</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {isFa
                ? "داده‌های مربوط به ردیابی رقبا و توصیه‌های بهینه‌سازی فنی به صورت کاملاً رمزنگاری‌شده بر مبنای استانداردهای نوین ابری نگهداری می‌شوند."
                : "Your query histories, sentiment scores, and proprietary brand networks are encrypted in transit and at rest using banking-grade security protocols."}
            </p>

            <h3 className="text-xl font-bold font-display flex items-center gap-2">
              <Server className="text-[#f97316]" size={20} />
              <span>{isFa ? "۳. سیاست‌های خزش ربات‌ها" : "3. Ingestion & Crawler Compliance"}</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {isFa
                ? "موتورهای خزش هوشمند ما قوانین موجود در فایل robots.txt دامنه‌ها را رعایت کرده و درخواست‌های متعددی را به سرورهای هدف جهت ایجاد ترافیک کاذب ارسال نخواهند کرد."
                : "Our smart Firecrawl agents respect standard robots.txt configurations. We avoid spamming target web-servers during deep link discovery."}
            </p>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
