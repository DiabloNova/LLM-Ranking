"use client";

import React, { use } from "react";
import { Header } from "@/components/marketing/Header";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import AppSidebar from "@/components/navigation/AppSidebar";
import { Sparkles, ArrowRight, Calendar, User, Clock } from "lucide-react";
import Link from "next/link";

export default function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isFa = locale === "fa";

  const posts = [
    {
      id: 1,
      titleFa: "چگونه برای الگوریتم‌های موتورهای پاسخگو (AEO) بهینه‌سازی کنیم؟",
      titleEn: "How to Optimize for Answer Engine Algorithms (AEO)?",
      descFa: "بررسی عمیق استراتژی‌های نوین سئو در عصر ChatGPT و Claude برای ارتقای سهم صدای برند.",
      descEn: "Deep dive into premium SEO strategies tailored for ChatGPT and Claude to improve your brand visibility.",
      dateFa: "۱۲ اردیبهشت ۱۴۰۳",
      dateEn: "May 2, 2024",
      author: isFa ? "تیم فنی سئورچبل" : "seorchable Tech Team",
      readTime: isFa ? "۵ دقیقه مطالعه" : "5 min read",
    },
    {
      id: 2,
      titleFa: "درک و رفع چالش توهم (Hallucination) مدل‌های زبانی در مورد برندها",
      titleEn: "Understanding & Fixing LLM Hallucinations About Your Brand",
      descFa: "چرا چت‌بات‌ها خدمات برند شما را به اشتباه به رقیبان نسبت می‌دهند و چگونه می‌توان از آن جلوگیری کرد؟",
      descEn: "Why models misattribute your services to rivals and how you can improve factual accuracy.",
      dateFa: "۲۸ فروردین ۱۴۰۳",
      dateEn: "April 17, 2024",
      author: isFa ? "تحلیل‌گر ارشد هوش زبانی" : "Senior AI Analyst",
      readTime: isFa ? "۷ دقیقه مطالعه" : "7 min read",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-primary)]" style={{ direction: isFa ? "rtl" : "ltr" }}>
      <AppSidebar />
      <Header />

      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-1/3 left-1/4 w-[40vw] h-[40vw] bg-gradient-to-tr from-[#f97316]/10 to-[#38bdf8]/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute inset-0 grid-backdrop opacity-[0.2] pointer-events-none -z-10" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs font-bold text-orange-400">
              <Sparkles size={12} className="animate-pulse" />
              <span>{isFa ? "وبلاگ آموزشی سئورچبل" : "Our Educational Blog"}</span>
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-gradient-brand">
              {isFa ? "آخرین یافته‌ها و مقالات آموزشی" : "Insights & Latest Findings"}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              {isFa
                ? "به‌روزترین مقالات فنی در حوزه‌ی موتورهای پاسخگو، تولید محتوای بهینه‌شده AEO و بازاریابی مبتنی بر مدل‌های هوش مصنوعی."
                : "Stay ahead with technical tutorials on Generative Engine Optimization, brand factuality, and LLM visibility trends."}
            </p>
          </div>

          {/* Posts Grid */}
          <div className="grid md:grid-cols-2 gap-8 pt-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] flex flex-col justify-between h-full hover-lift transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-[10px] text-[var(--text-muted)] font-bold">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{isFa ? post.dateFa : post.dateEn}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      <span>{post.author}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{post.readTime}</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold leading-snug font-display text-[var(--text-primary)] hover:text-[#38bdf8] transition-colors cursor-pointer">
                    {isFa ? post.titleFa : post.titleEn}
                  </h3>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                    {isFa ? post.descFa : post.descEn}
                  </p>
                </div>

                <div className="pt-6 border-t border-[var(--border)] mt-6">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#38bdf8] hover:underline cursor-pointer">
                    <span>{isFa ? "ادامه مطلب" : "Read Post"}</span>
                    <ArrowRight size={14} className="rtl:-scale-x-100" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
