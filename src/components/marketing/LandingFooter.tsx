"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Globe, Mail, MapPin, ArrowUpRight } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { marketingContent as C } from "./content";
import { SeorchableLogo } from "./SeorchableLogo";

/**
 * Enterprise Sitemap Footer for seorchable.ir.
 * Reorganized into exactly 6 requested groups: Products, Services, Documentation, Resources, Company, and Legal.
 * Preserves pre-existing links, routes, URLs, and pages.
 */
export function LandingFooter() {
  const { language } = useTheme();
  const isFa = language === "fa";

  const footerGroups = [
    {
      heading: isFa ? "محصولات" : "Products",
      links: [
        { label: isFa ? "میز فرماندهی هوشمند" : "Command Center", href: `/${language}/dashboard` },
        { label: isFa ? "تحلیل استاندارد برند" : "Standard Brand Audit", href: `/${language}/dashboard/audits` },
        { label: isFa ? "گراف دانش سازمانی" : "Enterprise Knowledge Graph", href: `/${language}/dashboard/entities` },
        { label: isFa ? "جستجوی معنایی RAG" : "AI Semantic Discovery", href: `/${language}/dashboard/query` },
        { label: isFa ? "پایش پرسش‌ها" : "Prompt Monitoring", href: `/${language}/dashboard` },
        { label: isFa ? "آنالیز موتورهای پاسخگو" : "AI Search Analytics", href: `/${language}/dashboard` },
      ],
    },
    {
      heading: isFa ? "خدمات" : "Services",
      links: [
        { label: isFa ? "بهینه‌سازی GEO" : "GEO Optimization", href: `/${language}/solutions/geo` },
        { label: isFa ? "بهینه‌سازی پاسخ‌ها AEO" : "AEO Optimization", href: `/${language}/solutions/aeo` },
        { label: isFa ? "محافظت از برند" : "Brand Protection", href: `/${language}/solutions/protection` },
        { label: isFa ? "رادار پایش رقبا" : "Competitive Radar", href: `/${language}/solutions/radar` },
        { label: isFa ? "راهکارهای ویژه سازمانی" : "Enterprise Solutions", href: `/${language}/contact` },
      ],
    },
    {
      heading: isFa ? "مستندات" : "Documentation",
      links: [
        { label: isFa ? "مقدمه و شروع سریع" : "Getting Started", href: `/${language}/docs/introduction-to-brandgraph`, external: true },
        { label: isFa ? "مفاهیم اساسی پلتفرم" : "Platform Concepts", href: `/${language}/docs/infrastructure-architecture`, external: true },
        { label: isFa ? "رابط برنامه‌نویسی REST API" : "REST API Reference", href: `/${language}/docs/ai-pipeline-architecture`, external: true },
        { label: isFa ? "تامین‌کنندگان هوش زبانی" : "AI Providers", href: `/${language}/docs/introduction-to-brandgraph`, external: true },
        { label: isFa ? "امنیت و جداسازی داده" : "Architecture & Security", href: `/${language}/docs/multi-tenant-isolation`, external: true },
      ],
    },
    {
      heading: isFa ? "منابع" : "Resources",
      links: [
        { label: isFa ? "مرکز منابع" : "All Resources", href: `/${language}/resources` },
        { label: isFa ? "ابزارهای رایگان سنجش" : "Free Tools", href: `/${language}/#free-audit` },
        { label: isFa ? "وبلاگ مهندسی" : "Corporate Blog", href: `/${language}/blog` },
        { label: isFa ? "مطالعات موردی موفقیت" : "Case Studies", href: `/${language}/blog` },
        { label: isFa ? "بنچ‌مارک‌های صنعت" : "Industry Benchmarks", href: `/${language}/blog` },
        { label: isFa ? "کیت‌های توسعه (SDKs)" : "Official SDK Library", href: `/${language}/docs/knowledge-graph-design`, external: true },
        { label: isFa ? "هوک‌های وب (Webhooks)" : "Webhooks Stream", href: `/${language}/docs/ai-pipeline-architecture`, external: true },
      ],
    },
    {
      heading: isFa ? "شرکت" : "Company",
      links: [
        { label: isFa ? "قابلیت‌ها" : "Features", href: `/${language}/features` },
        { label: isFa ? "صنایع هدف" : "Industries", href: `/${language}/industries` },
        { label: isFa ? "راهکارها" : "Solutions", href: `/${language}/solutions` },
        { label: isFa ? "درباره ما" : "About Us", href: `/${language}/about` },
        { label: isFa ? "همکاری با ما" : "Careers", href: `/${language}/about` },
        { label: isFa ? "تماس با ما" : "Contact Us", href: `/${language}/contact` },
        { label: isFa ? "نقشه راه محصول" : "Changelog & Roadmap", href: `/${language}/dashboard` },
      ],
    },
    {
      heading: isFa ? "بخش حقوقی" : "Legal",
      links: [
        { label: isFa ? "حریم خصوصی کاربران" : "Privacy Policy", href: `/${language}/privacy` },
        { label: isFa ? "قوانین استفاده از خدمات" : "Terms of Service", href: `/${language}/privacy` },
        { label: isFa ? "انطباق و امنیت سازمانی" : "Compliance Stand", href: `/${language}/privacy` },
      ],
    },
  ];

  const socialChannels = [
    { icon: Globe, label: isFa ? "وب‌سایت" : "Website", href: `/${language}` },
    { icon: Mail, label: isFa ? "ایمیل" : "Email", href: "mailto:info@seorchable.ir" },
  ];

  return (
    <footer className="mt-16 border-t border-[var(--border)] bg-[var(--background-subtle)]/30 dark:bg-[#07090f]/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid gap-12 xl:grid-cols-[1fr_3.5fr] pb-12 border-b border-[var(--border)]">
          {/* Brand & Mission block */}
          <div className="space-y-6 max-w-sm">
            <Link href={`/${language}`} className="flex items-center gap-2.5 shrink-0">
              <SeorchableLogo className="w-10 h-10" />
              <span className="font-display font-black text-xl tracking-tight text-[var(--text-primary)]">
                {C.brand[language]}
              </span>
            </Link>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed text-balance">
              {isFa
                ? "اکوسیستم پیشرو مدیریت حضور، بهینه‌سازی موتورهای پاسخگو (GEO & AEO) و پایش دیده‌شدن برند در مدل‌های هوش مصنوعی."
                : "The enterprise-defining AI Visibility, Generative Engine Optimization, and conversational search analytics software platform."}
            </p>

            <div className="space-y-2.5 text-xs text-[var(--text-muted)] font-bold">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[#38bdf8]" />
                <span>info@seorchable.ir</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#f97316]" />
                <span>{isFa ? "تهران، پارک فناوری پردیس" : "Tehran, Pardis Technology Park"}</span>
              </div>
            </div>

            {/* Social channels grid */}
            <div className="flex items-center gap-2 pt-2">
              {socialChannels.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="grid place-items-center w-9 h-9 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] border border-[var(--border)] transition-all hover:scale-[1.03]"
                  >
                    <Icon size={15} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Grid of 6 logical navigation columns */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-6">
            {footerGroups.map((col) => (
              <nav key={col.heading} className="space-y-4">
                <h3 className="font-display font-black text-sm text-[var(--text-primary)] tracking-wide">
                  {col.heading}
                </h3>
                <ul className="space-y-3 text-xs font-bold">
                  {col.links.map((link) => {
                    const l = link as { label: string; href: string; external?: boolean; badge?: string };
                    return (
                      <li key={l.label}>
                        {l.external ? (
                          <a
                            href={l.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--text-secondary)] hover:text-[#38bdf8] transition-colors inline-flex items-center gap-1 group cursor-pointer"
                          >
                            <span>{l.label}</span>
                            <ArrowUpRight size={10} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ) : (
                          <Link
                            href={l.href}
                            className="text-[var(--text-secondary)] hover:text-[#38bdf8] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{l.label}</span>
                            {l.badge && (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-black font-mono tracking-widest">{l.badge}</span>
                            )}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Bottom copyright & system status banner */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span className="text-[var(--text-muted)] font-medium">
            © {new Date().getFullYear()} {C.brand[language]}.{" "}
            {isFa ? "تمامی حقوق مادی و معنوی محفوظ است." : "All rights reserved. BrandGraph / seorchable.ir"}
          </span>
          <div className="flex items-center gap-4 text-[var(--text-muted)] font-bold">
            <span className="inline-flex items-center gap-1.5 text-xs">
              <ShieldCheck size={14} />
              {isFa ? "معماری چندمستأجری و کنترل دسترسی" : "Multi-tenant access controls"}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
