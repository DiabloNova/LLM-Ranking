"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun, Languages, Receipt, ChevronDown, Sparkles, LogIn, Menu } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { SeorchableLogo } from "./SeorchableLogo";
import { Dropdown } from "@/components/Dropdown";
import AppSidebar from "@/components/navigation/AppSidebar";

/**
 * Enterprise-grade Sticky navigation bar with advanced adjacent Hamburger selector and sliding drawer,
 * mapped to the product-first flow sections (Platform, Solutions, Comparison, Trust, Pricing, Docs, Resources).
 */
export function Header() {
  const { language, setLanguage, theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isFa = language === "fa";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solutionsItems = [
    { label: isFa ? "بهینه‌سازی GEO" : "GEO Optimization", value: "geo", href: `/${language}/solutions/geo` },
    { label: isFa ? "بهینه‌سازی پاسخ‌ها AEO" : "AEO Optimization", value: "aeo", href: `/${language}/solutions/aeo` },
    { label: isFa ? "محافظت از برند" : "Brand Protection", value: "protection", href: `/${language}/solutions/protection` },
    { label: isFa ? "رادار تحلیل رقابتی" : "Competitive Radar", value: "radar", href: `/${language}/solutions/radar` },
    { label: isFa ? "همه راهکارها" : "All Solutions", value: "solutions", href: `/${language}/solutions` },
  ];

  const platformItems = [
    { label: isFa ? "قابلیت‌های پلتفرم" : "Features", value: "features", href: `/${language}/features` },
    { label: isFa ? "صنایع هدف" : "Industries", value: "industries", href: `/${language}/industries` },
    { label: isFa ? "معماری اکوسیستم" : "Ecosystem Architecture", value: "ecosystem", href: `/${language}/#ecosystem` },
    { label: isFa ? "بررسی کلان پلتفرم" : "Platform Overview", value: "overview", href: `/${language}/#overview` },
    { label: isFa ? "داستان چرخه محصول" : "Product Lifecycle Story", value: "story", href: `/${language}/#story` },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-6 pt-3">
      {/* Outer Flex Container for Menu Button + Floating Navigation Bar */}
      <div className="mx-auto max-w-7xl flex items-center gap-3">
        {/* Navigation Menu Button - Perfectly adjacent and matches glassmorphism */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label={isFa ? "باز کردن منوی ناوبری" : "Open navigation menu"}
          className={`h-16 w-16 flex items-center justify-center rounded-[var(--radius-full)] border transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] hover:border-[var(--sky-blue-500)]/40 focus:ring-2 focus:ring-[var(--sky-blue-500)]/20 cursor-pointer shrink-0 ${
            scrolled
              ? "glass-panel border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md shadow-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              : "border-transparent bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Menu size={20} className="text-[var(--sky-blue-500)] hover:text-[var(--orange-500)] transition-colors duration-300" />
        </button>

        {/* Floating Navigation Bar - Reduced slightly on the left to fit the adjacent menu button */}
        <div
          className={`flex-1 flex items-center justify-between gap-3 rounded-[var(--radius-full)] px-3 sm:px-6 h-16 transition-all duration-300 ${
            scrolled
              ? "glass-panel border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md shadow-md"
              : "border border-transparent bg-transparent"
          }`}
        >
          {/* Brand & Logo */}
          <Link
            href={`/${language}`}
            aria-label={isFa ? "صفحه نخست سئورچبل" : "Seorchable Homepage"}
            className="flex items-center justify-center shrink-0 rounded-[var(--radius-md)] focus-visible:ring-2 focus-visible:ring-[var(--sky-blue-500)]/40 focus-visible:outline-none outline-none"
          >
            <SeorchableLogo className="w-10 h-10 transition-transform duration-300 hover:scale-[1.05]" />
          </Link>

          {/* Enterprise-grade Nav Menu */}
          <nav className="hidden xl:flex items-center gap-2">
            {/* Platform Dropdown */}
            <Dropdown
              trigger={
                <button className="header-link micro-interaction flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-colors rounded-[var(--radius-md)]">
                  <span>{isFa ? "پلتفرم" : "Platform"}</span>
                  <ChevronDown size={14} />
                </button>
              }
              items={platformItems.map((item) => ({
                label: item.label,
                value: item.value,
                onClick: () => { window.location.href = item.href; }
              }))}
            />

            {/* Solutions Dropdown */}
            <Dropdown
              trigger={
                <button className="header-link micro-interaction flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-colors rounded-[var(--radius-md)]">
                  <span>{isFa ? "راهکارها" : "Solutions"}</span>
                  <ChevronDown size={14} />
                </button>
              }
              items={solutionsItems.map((item) => ({
                label: item.label,
                value: item.value,
                onClick: () => { window.location.href = item.href; }
              }))}
            />

            {/* Comparison table link */}
            <a
              href={`/${language}/#why-different`}
              className="px-3 py-2 text-sm font-semibold header-link rounded-[var(--radius-md)] transition-colors"
            >
              {isFa ? "تمایز ما" : "Why Us"}
            </a>

            {/* Pricing Link */}
            <a
              href={`/${language}/#pricing`}
              className="px-3 py-2 text-sm font-semibold header-link rounded-[var(--radius-md)] transition-colors"
            >
              {isFa ? "تعرفه‌ها" : "Pricing"}
            </a>

            {/* Documentation Section (Opens in new browser tab) */}
            <Link
              href={`/${language}/docs`}
              className="px-3 py-2 text-sm font-semibold header-link rounded-[var(--radius-md)] transition-colors flex items-center gap-1"
            >
              <span>{isFa ? "مستندات فنی" : "Documentation"}</span>
              <span className="text-[9px] bg-[var(--sky-blue-500)]/20 text-[var(--sky-blue-500)] px-1.5 py-0.5 rounded font-black font-mono">NEW</span>
            </Link>

            {/* Resources */}
            <Link
              href={`/${language}/resources`}
              className="px-3 py-2 text-sm font-semibold header-link rounded-[var(--radius-md)] transition-colors"
            >
              {isFa ? "منابع" : "Resources"}
            </Link>

            {/* About */}
            <Link
              href={`/${language}/about`}
              className="px-3 py-2 text-sm font-semibold header-link rounded-[var(--radius-md)] transition-colors"
            >
              {isFa ? "درباره ما" : "About"}
            </Link>

            {/* Contact */}
            <Link
              href={`/${language}/contact`}
              className="px-3 py-2 text-sm font-semibold header-link rounded-[var(--radius-md)] transition-colors"
            >
              {isFa ? "تماس با ما" : "Contact"}
            </Link>
          </nav>

          {/* Global Configuration Controls + Toggles + CTA */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLanguage(isFa ? "en" : "fa")}
              aria-label={isFa ? "Switch to English" : "تغییر به فارسی"}
              className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors text-xs font-bold border border-[var(--glass-border)]"
            >
              <Languages size={15} />
              <span className="font-mono">{isFa ? "EN" : "FA"}</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "حالت روشن" : "حالت تاریک"}
              className="grid place-items-center w-9 h-9 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] border border-[var(--glass-border)] transition-colors"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Invoice Icon placed right next to Language and Theme Toggles */}
            <Link
              href={`/${language}/invoice`}
              aria-label={isFa ? "پرداخت صورتحساب" : "Invoice Payment"}
              className="grid place-items-center w-9 h-9 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] border border-[var(--glass-border)] transition-colors"
            >
              <Receipt size={15} />
            </Link>

            {/* Separator */}
            <span className="hidden sm:inline h-6 w-px bg-[var(--glass-border)]" />

            {/* Enterprise Action CTA Buttons */}
            <div className="flex items-center gap-2">
              <Link href={`/${language}/login`}>
                <button className="header-link micro-interaction px-4 h-9 text-xs font-bold rounded-[var(--radius-md)] border border-[var(--glass-border)] hover:bg-[var(--muted-surface)] transition-all flex items-center gap-1.5">
                  <LogIn size={14} />
                  <span>{isFa ? "ورود" : "Login"}</span>
                </button>
              </Link>

              <Link href={`/${language}/#free-audit`} className="hidden sm:inline-block">
                <button className="relative overflow-hidden group px-4 h-9 text-xs font-bold rounded-[var(--radius-md)] text-white bg-gradient-to-r from-[#38bdf8] to-[#f97316] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5">
                  <Sparkles size={13} className="animate-pulse" />
                  <span>{isFa ? "آنالیز رایگان" : "Free Audit"}</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Reusable AppSidebar as the Global Sliding Drawer, sharing the exact category IA */}
      <AppSidebar mobileOpen={drawerOpen} setMobileOpen={setDrawerOpen} hideToggle={true} />
    </header>
  );
}
