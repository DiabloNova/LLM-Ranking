"use client";

import React from "react";
import { BrainCircuit, Sparkles, ShieldCheck, Waypoints, TrendingUp, Radar } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

/**
 * Feature bento grid. Cards intentionally mix three advanced surface
 * treatments — animated conic border, glass panel, and neumorphic extrusion —
 * for a layered, high-craft composition.
 */
export function FeaturesSection() {
  const { language } = useTheme();
  const isFa = language === "fa";

  const features = [
    {
      icon: BrainCircuit,
      span: "md:col-span-2",
      title: isFa ? "بهینه‌سازی موتور مولد (GEO)" : "Generative Engine Optimization",
      desc: isFa
        ? "ردپای برند خود را در خطوط پردازش RAG به‌صورت سیستماتیک دنبال و بهینه کنید تا در خروجی مدل‌ها برجسته شوید."
        : "Systematically track and optimize your brand footprint inside RAG pipelines so you surface in model outputs.",
    },
    {
      icon: Sparkles,
      span: "",
      title: isFa ? "بهینه‌سازی موتور پاسخ (AEO)" : "Answer Engine Optimization",
      desc: isFa
        ? "زمینه‌ی پیوندهای خروجی را چنان ساختار دهید که به‌عنوان منبع مستقیم توصیه در Perplexity ذکر شوید."
        : "Structure outbound link context to be cited as a direct recommendation source in Perplexity.",
    },
    {
      icon: ShieldCheck,
      span: "",
      title: isFa ? "محافظت در برابر توهم" : "Hallucination protection",
      desc: isFa
        ? "به‌محض آنکه مدل‌ها درباره‌ی شرکت شما اطلاعات نادرست تولید کنند، هشدار دریافت کنید."
        : "Get alerted the instant language models output factual inaccuracies about your company.",
    },
    {
      icon: Waypoints,
      span: "",
      title: isFa ? "گراف دانش برند" : "Brand knowledge graph",
      desc: isFa
        ? "روابط میان موجودیت‌ها، محصولات و مدیران را در یک گراف زنده و قابل‌کاوش مشاهده کنید."
        : "See how entities, products, and executives relate inside a live, explorable graph.",
    },
    {
      icon: TrendingUp,
      span: "",
      title: isFa ? "تحلیل احساسات و روند" : "Sentiment & trend analytics",
      desc: isFa
        ? "روند لحن گفتگوها درباره‌ی برند شما را در طول زمان و در هر موتور بسنجید."
        : "Measure how sentiment about your brand shifts over time, per engine.",
    },
    {
      icon: Radar,
      span: "md:col-span-2",
      title: isFa ? "رصد رقبا" : "Competitive radar",
      desc: isFa
        ? "جایگاه خود را در برابر رقبا در پاسخ‌های مدل‌ها بسنجید و شکاف‌های ارجاع را کشف کنید."
        : "Benchmark your share of voice against competitors in model answers and uncover citation gaps.",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-4 mb-14">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary-600)]">
            {isFa ? "قابلیت‌ها" : "Capabilities"}
          </span>
          <h2 className="font-display font-black text-3xl md:text-4xl text-[var(--text-primary)] text-balance">
            {isFa
              ? "یک سکوی فرماندهی برای حضور شما در هوش مصنوعی"
              : "One command center for your AI presence"}
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed text-pretty">
            {isFa
              ? "هر آنچه برای سنجش، محافظت و رشد اعتبار برندتان در موتورهای مولد نیاز دارید."
              : "Everything you need to measure, protect, and grow your brand's credibility across generative engines."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <article
                key={i}
                className={`group animated-border-glass ${f.span} hover-lift rounded-[var(--radius-xl)] p-6 md:p-7 flex flex-col gap-4`}
              >
                <span className="feature-icon">
                  <Icon size={22} className="rtl:-scale-x-100" />
                </span>
                <div className="space-y-2">
                  <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                    {f.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed text-pretty">
                    {f.desc}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
