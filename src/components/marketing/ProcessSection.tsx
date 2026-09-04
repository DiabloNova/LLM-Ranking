"use client";

import React from "react";
import { Link2, ScanSearch, SlidersHorizontal } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

/**
 * Three-step "how it works" flow using glass tiles with a subtle numbered
 * accent and connecting rhythm.
 */
export function ProcessSection() {
  const { language } = useTheme();
  const isFa = language === "fa";

  const steps = [
    {
      icon: Link2,
      title: isFa ? "اتصال منابع برند" : "Connect your brand sources",
      desc: isFa
        ? "دامنه‌ها، محصولات و موجودیت‌های کلیدی خود را وارد کنید تا پایگاه دانش شکل بگیرد."
        : "Add your domains, products, and key entities to build the knowledge base.",
    },
    {
      icon: ScanSearch,
      title: isFa ? "پایش موتورهای هوش مصنوعی" : "Monitor the AI engines",
      desc: isFa
        ? "پلتفرم به‌طور مداوم پاسخ‌های ChatGPT، Gemini، Claude و Perplexity را رصد می‌کند."
        : "The platform continuously observes answers from ChatGPT, Gemini, Claude, and Perplexity.",
    },
    {
      icon: SlidersHorizontal,
      title: isFa ? "بهینه‌سازی و محافظت" : "Optimize & protect",
      desc: isFa
        ? "بر اساس توصیه‌های عملی، ارجاع‌ها را تقویت و توهم‌ها را اصلاح کنید."
        : "Act on concrete recommendations to boost citations and correct hallucinations.",
    },
  ];

  return (
    <section id="process" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-4 mb-14">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary-600)]">
            {isFa ? "فرآیند" : "How it works"}
          </span>
          <h2 className="font-display font-black text-3xl md:text-4xl text-[var(--text-primary)] text-balance">
            {isFa ? "از راه‌اندازی تا بینش، در سه گام" : "From setup to insight, in three steps"}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="neu-surface hover-lift rounded-[var(--radius-xl)] p-7 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="grid place-items-center w-12 h-12 rounded-[var(--radius-lg)] neu-inset text-[var(--color-primary-600)]">
                    <Icon size={22} className="rtl:-scale-x-100" />
                  </span>
                  <span
                    dir="ltr"
                    className="font-display font-black text-4xl text-[color-mix(in_srgb,var(--color-primary-600)_55%,transparent)]"
                  >
                    {`${i + 1}.`}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                    {s.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed text-pretty">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
