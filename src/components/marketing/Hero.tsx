"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

/**
 * Product-first hero: clear value proposition, restrained motion, and one primary
 * conversion path into the real free-audit flow.
 */
export function Hero() {
  const { session } = useAuth();
  const { language } = useTheme();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isFa = language === "fa";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    // Redirect to auth page with email as query param
    window.location.href = `/${language}/register?email=${encodeURIComponent(email)}`;
  };

  const chips = [
    { icon: TrendingUp, fa: "سنجش حضور برند در پاسخ‌ها", en: "Measure brand presence in answers" },
    { icon: ShieldCheck, fa: "گزارش‌های قابل بررسی", en: "Evidence-backed reporting" },
    { icon: Zap, fa: "از بررسی تا اقدام", en: "From audit to action" },
  ];

  return (
    <section className="aurora-bg fluid-mesh relative isolate overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* layered grain/noise texture */}
      <div className="grain-overlay" />
      {/* dotted grid layer */}
      <div className="grid-backdrop absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 flex flex-col items-center">
        {/* Copy column */}
        <div className="text-center max-w-4xl mx-auto space-y-7 mb-12">
          <span className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-[color-mix(in_srgb,var(--color-primary-600)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-primary-600)_10%,transparent)] px-4 py-2 text-xs font-semibold text-[var(--color-primary-600)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary-600)] opacity-70 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-primary-600)]" />
            </span>
            {isFa ? "تحلیل حضور برند در جست‌وجوی هوشمند" : "Brand visibility intelligence for AI search"}
          </span>

          <h1 className="hero-title headline-reveal font-black tracking-tight text-balance text-5xl sm:text-6xl md:text-7xl leading-[1.15]">
            <span className="title-accent-blue">
              {isFa ? "دیده‌شدن برندتان را در " : "Understand your brand visibility across "}
            </span>
            <span className="title-accent-orange block mt-2">
              {isFa ? "جست‌وجوی مولد و پاسخ‌های هوشمند" : "generative search and AI answers"}
            </span>
            <span className="text-[var(--text-primary)]">
              {isFa ? " بهتر بشناسید و بهینه کنید" : " and turn evidence into action"}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto text-pretty">
            {isFa
              ? "سئورچبل به تیم‌های سئو و بازاریابی کمک می‌کند حضور برند، منابع ارجاع و شکاف‌های محتوایی خود را در جست‌وجوی سنتی و مولد بررسی کنند."
              : "Seorchable helps SEO and marketing teams inspect brand presence, cited sources, and content gaps across traditional and generative search."}
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            {chips.map((chip, i) => {
              const Icon = chip.icon;
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-full)] neu-surface px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] shadow-sm"
                >
                  <Icon size={16} className="text-[var(--color-primary-600)] rtl:-scale-x-100" />
                  {isFa ? chip.fa : chip.en}
                </span>
              );
            })}
          </div>
        </div>

        {/* Dashboard Showcase Video/Slideshow Placeholder */}
        <div className="w-full max-w-5xl mx-auto mb-16 relative perspective-1000">
          <div className="relative rounded-2xl overflow-hidden border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-2xl shadow-sky-900/20 aspect-video group">
            {/* Top Bar (Mockup window controls) */}
            <div className="absolute top-0 inset-x-0 h-8 bg-[var(--muted-surface)] border-b border-[var(--glass-border)] flex items-center px-4 gap-2 z-10">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <div className="flex-1 flex justify-center">
                <div className="skeleton-shimmer h-4 w-32 rounded-full opacity-50" />
              </div>
            </div>

            {/* Main Content Area Placeholder */}
            <div className="absolute inset-0 pt-8 bg-gradient-to-br from-slate-900/40 to-slate-800/40 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-[var(--text-muted)] opacity-70 group-hover:opacity-100 transition-opacity" aria-label={isFa ? "پیش‌نمایش ایستا از محیط محصول" : "Static product workspace preview"}>
                <div className="w-16 h-16 rounded-full bg-[var(--color-primary-600)]/20 flex items-center justify-center" aria-hidden="true">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[12px] border-l-[var(--color-primary-600)] border-b-8 border-b-transparent ml-1 rtl:mr-1 rtl:ml-0 rtl:border-l-0 rtl:border-r-[12px] rtl:border-r-[var(--color-primary-600)]" />
                </div>
                <p className="text-sm font-semibold tracking-widest uppercase">
                  {isFa ? "پیش‌نمایش ایستا از محیط محصول" : "Static product workspace preview"}
                </p>
              </div>
            </div>
          </div>

          {/* Decorative glows behind the showcase */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-[var(--color-primary-600)]/30 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[var(--orange-500)]/20 rounded-full blur-3xl -z-10" />
        </div>

        {/* Email Capture & Access card column */}
        <div className="w-full max-w-md mx-auto relative z-10 mt-8">
          <div className="animated-border-glass p-6 sm:p-7">
            {session.status === "authenticated" ? (
              <div className="space-y-5 text-center">
                <div className="mx-auto grid place-items-center w-14 h-14 rounded-[var(--radius-lg)] neu-surface text-[var(--color-primary-600)] glow-ring">
                  <ShieldCheck size={26} />
                </div>
                <div className="space-y-1">
                  <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
                    {isFa ? "نشست شما فعال است" : "Your session is active"}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] break-all">
                    {session.user?.email}
                  </p>
                </div>
                <Link href={`/${language}/dashboard`} className="block">
                  <Button variant="primary" size="lg" className="w-full font-bold gap-2">
                    {isFa ? "ورود به پیشخوان کاربری" : "Enter admin console"}
                    <ArrowRight size={18} className="rtl:-scale-x-100" />
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-start">
                <div className="space-y-1">
                  <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
                    {isFa ? "ورود سریع به میز کار" : "Access the workspace"}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {isFa
                      ? "ایمیل کاری خود را وارد کنید تا بررسی رایگان سایتتان را شروع کنید."
                      : "Enter your work email to start a free website audit."}
                  </p>
                </div>
                <Input
                  type="email"
                  placeholder={isFa ? "you@company.com" : "you@company.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-label={isFa ? "ایمیل سازمانی" : "Business email"}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-bold gap-2"
                  disabled={isLoading}
                >
                  {isLoading
                    ? isFa
                      ? "در حال انتقال..."
                      : "Opening audit"
                    : isFa
                      ? "شروع بررسی رایگان"
                      : "Start free audit"}
                  {!isLoading && <ArrowRight size={18} className="rtl:-scale-x-100" />}
                </Button>
                <p className="text-[11px] text-[var(--text-muted)] text-center pt-1">
                  {isFa
                    ? "بدون نیاز به کارت بانکی برای شروع"
                    : "No credit card required to get started"}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
