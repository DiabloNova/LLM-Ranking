"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/Button";

/**
 * Closing call-to-action wrapped in an animated conic border over an aurora
 * glow.
 */
export function CTASection() {
  const { language } = useTheme();
  const isFa = language === "fa";

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="animated-border-glass aurora-bg relative overflow-hidden rounded-[var(--radius-xl)] px-6 py-14 md:px-16 md:py-16 text-center">
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="font-display font-black text-3xl md:text-4xl text-[var(--text-primary)] text-balance leading-tight">
              {isFa
                ? "امروز کنترل روایت برندتان در هوش مصنوعی را به‌دست بگیرید"
                : "Take control of how AI talks about your brand today"}
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed text-pretty">
              {isFa
                ? "در چند دقیقه راه‌اندازی کنید و اولین گزارش دیده‌شدن برند خود را دریافت کنید."
                : "Get set up in minutes and receive your first brand visibility report."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href={`/${language}/dashboard`}>
                <Button variant="primary" size="lg" className="font-bold gap-2 w-full sm:w-auto">
                  {isFa ? "شروع رایگان" : "Start for free"}
                  <ArrowRight size={18} className="rtl:-scale-x-100" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="font-bold w-full sm:w-auto">
                  {isFa ? "مشاهده‌ی قابلیت‌ها" : "Explore features"}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
