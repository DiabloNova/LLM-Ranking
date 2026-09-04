"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LinkNext from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import {
  LayoutDashboard, Database, Search,
  BarChart3, Settings, User, X, Menu,
  LogOut, Sun, Moon, Languages, Receipt,
  BookOpen, Shield, HelpCircle, Briefcase, Mail, Info, FileText, Sparkles, MessageSquare, Activity
} from "lucide-react";
import { SeorchableLogo } from "../marketing/SeorchableLogo";

interface NavItem {
  href: string;
  icon: React.ElementType;
  labelEn: string;
  labelFa: string;
}

interface NavCategory {
  titleEn: string;
  titleFa: string;
  items: NavItem[];
}

interface AppSidebarProps {
  collapsed?: boolean;
  setCollapsed?: (val: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (val: boolean) => void;
  hideToggle?: boolean; // Prop to hide the floating top-left toggle when rendered inside Header
}

export default function AppSidebar({
  mobileOpen,
  setMobileOpen,
  hideToggle = false
}: AppSidebarProps) {
  const pathname = usePathname();
  const { language, setLanguage, theme, setTheme } = useTheme();
  const { session, logout } = useAuth();
  const isFa = language === "fa";

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen !== undefined) {
      setIsOpen(mobileOpen);
    }
  }, [mobileOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (setMobileOpen) {
      setMobileOpen(nextState);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const getLocalizedHref = (href: string) => {
    return `/${language}${href === "/" ? "" : href}`;
  };

  const isItemActive = (href: string) => {
    const localizedHref = getLocalizedHref(href);
    return pathname === localizedHref || (href !== "/" && href !== "/dashboard" && pathname?.startsWith(localizedHref));
  };

  // Structured Information Architecture Categories
  const categories: NavCategory[] = [
    {
      titleEn: "Products & Services",
      titleFa: "محصولات و خدمات",
      items: [
        { href: "/solutions/aeo", icon: Sparkles, labelEn: "AEO Optimization", labelFa: "هوشمندسازی و بهینه‌سازی محتوا (AEO)" },
        { href: "/dashboard/analytics/llm", icon: BarChart3, labelEn: "LLM Analytics", labelFa: "تحلیل مدل‌های زبانی بزرگ" },
        { href: "/dashboard/query", icon: MessageSquare, labelEn: "Prompt Intelligence", labelFa: "تحلیل هوش مصنوعی و پرسش" },
        { href: "/dashboard/content", icon: LayoutDashboard, labelEn: "Content Studio", labelFa: "استودیو محتوا" },
        { href: "/dashboard/seo/technical", icon: Settings, labelEn: "Technical SEO", labelFa: "سئوی تکنیکال" },
        { href: "/solutions/protection", icon: Shield, labelEn: "AI Advertising", labelFa: "تبلیغات در هوش مصنوعی" },
        { href: "/docs", icon: FileText, labelEn: "Model Context Protocol (MCP)", labelFa: "اتصال داده‌ها (MCP)" },
        { href: "/dashboard/query", icon: Search, labelEn: "Agent Search", labelFa: "جستجوی عامل هوشمند" }
      ]
    },
    {
      titleEn: "Documentation",
      titleFa: "مستندات",
      items: [
        { href: "/docs/introduction-to-brandgraph", icon: BookOpen, labelEn: "User Guide", labelFa: "راهنمای استفاده" },
        { href: "/docs", icon: Database, labelEn: "Technical Documentation", labelFa: "مستندات فنی" },
        { href: "/privacy", icon: Shield, labelEn: "Terms & Regulations", labelFa: "قوانین و مقررات" },
        { href: "/privacy", icon: FileText, labelEn: "Terms of Service", labelFa: "توافق‌نامه استفاده از خدمات وبسایت" },
        { href: "/privacy", icon: Shield, labelEn: "Privacy Policy", labelFa: "مقررات حفظ حریم خصوصی" }
      ]
    },
    {
      titleEn: "Platform",
      titleFa: "پلتفرم",
      items: [
        { href: "/features", icon: Sparkles, labelEn: "Features", labelFa: "قابلیت‌ها" },
        { href: "/industries", icon: Info, labelEn: "Industries", labelFa: "صنایع هدف" },
        { href: "/solutions", icon: Activity, labelEn: "Solutions", labelFa: "راهکارها" },
        { href: "/resources", icon: BookOpen, labelEn: "Resources", labelFa: "منابع" },
      ]
    },
    {
      titleEn: "Users",
      titleFa: "کاربران",
      items: [
        { href: "/#free-audit", icon: Sparkles, labelEn: "Free Tools", labelFa: "ابزارهای رایگان" },
        { href: "/pricing", icon: Receipt, labelEn: "Pricing", labelFa: "تعرفه خدمات" },
        { href: "/contact", icon: Info, labelEn: "Enterprise Solutions", labelFa: "خدمات سازمانی" }
      ]
    },
    {
      titleEn: "Company",
      titleFa: "شرکت",
      items: [
        { href: "/about", icon: Info, labelEn: "About Us", labelFa: "درباره ما" },
        { href: "/about", icon: Briefcase, labelEn: "Careers", labelFa: "همکاری با ما" },
        { href: "/contact", icon: Mail, labelEn: "Contact Us", labelFa: "تماس با ما" },
        { href: "/contact", icon: HelpCircle, labelEn: "Support", labelFa: "پشتیبانی" }
      ]
    }
  ];

  return (
    <>
      {/* HAMBURGER TOGGLE BUTTON IN TOP LEFT (Only if not hideToggle) */}
      {!hideToggle && (
        <div className="fixed top-3 left-4 z-[60]">
          <button
            onClick={handleToggle}
            aria-label={isFa ? "باز کردن منوی ناوبری" : "Toggle navigation menu"}
            className="flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-500 shadow-lg border border-[var(--glass-border)] backdrop-blur-2xl bg-slate-950/60 dark:bg-slate-950/60 hover:bg-slate-950/85 text-[var(--sky-blue-500)] hover:text-[var(--orange-500)] cursor-pointer hover:scale-105 active:scale-95"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={20} className="text-[var(--orange-500)]" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={20} className="text-[var(--sky-blue-500)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      )}

      {/* OVERLAY DRAWER PANEL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100]" dir={isFa ? "rtl" : "ltr"}>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl"
              onClick={handleClose}
            />

            {/* Sliding Drawer Container */}
            <motion.div
              initial={{ x: isFa ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isFa ? "100%" : "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className={`absolute top-0 bottom-0 ${isFa ? "right-0" : "left-0"} w-80 sm:w-85 border-r border-l border-white/10 bg-slate-950/95 text-white shadow-2xl flex flex-col overflow-hidden`}
            >
              {/* Drawer Header */}
              <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <SeorchableLogo className="w-8 h-8" glow={false} />
                  <span className="font-bold text-slate-100 text-sm">
                    {isFa ? "منوی پیشرفته سئورچبل" : "seorchable.ir Explorer"}
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label={isFa ? "بستن منو" : "Close menu"}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quick Controls Row */}
              <div className="px-6 py-3 border-b border-white/10 flex items-center justify-around bg-slate-900/40 shrink-0">
                <button
                  onClick={() => setLanguage(language === "fa" ? "en" : "fa")}
                  title={isFa ? "Switch to English" : "تغییر به فارسی"}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <Languages size={16} className="text-[var(--sky-blue-500)]" />
                  <span>{isFa ? "EN" : "فا"}</span>
                </button>

                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  title={isFa ? "تغییر پوسته تم" : "Toggle Color Theme"}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {theme === "dark" ? (
                    <Sun size={16} className="text-[var(--orange-500)]" />
                  ) : (
                    <Moon size={16} className="text-[var(--orange-500)]" />
                  )}
                </button>

                <LinkNext
                  href={`/${language}/invoice`}
                  onClick={handleClose}
                  title={isFa ? "پرداخت صورتحساب" : "Invoice Payment"}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Receipt size={16} className="text-[var(--sky-blue-500)]" />
                </LinkNext>
              </div>

              {/* Navigation Hierarchy Categories */}
              <nav className="flex-1 overflow-y-auto px-6 py-6 space-y-7 scrollbar-none">
                {categories.map((cat, catIdx) => (
                  <div key={catIdx} className="space-y-2">
                    {/* Category Visually Separated Heading */}
                    <h3 className="px-3 text-[10px] font-black uppercase tracking-wider text-[var(--sky-blue-500)] border-b border-white/5 pb-1 mb-2">
                      {isFa ? cat.titleFa : cat.titleEn}
                    </h3>
                    <div className="space-y-1">
                      {cat.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = isItemActive(item.href);
                        return (
                          <LinkNext
                            key={item.href}
                            href={getLocalizedHref(item.href)}
                            onClick={handleClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 border
                              ${isActive
                                ? "bg-gradient-to-r from-[var(--sky-blue-500)]/20 to-[var(--orange-500)]/10 text-white border-[var(--sky-blue-500)]/40 font-bold"
                                : "text-slate-300 hover:bg-white/5 hover:text-white border-transparent"
                              }`}
                          >
                            <Icon size={14} className="shrink-0 text-[var(--sky-blue-500)]" />
                            <span className="truncate">{isFa ? item.labelFa : item.labelEn}</span>
                          </LinkNext>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Bottom Action Area (Pinned to Bottom) */}
              <div className="p-6 border-t border-white/10 bg-slate-900/60 flex flex-col gap-2 shrink-0">
                {session.status === "authenticated" ? (
                  <>
                    <button
                      onClick={async () => {
                        handleClose();
                        await logout();
                      }}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30 hover:text-rose-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>{isFa ? "خروج از حساب کاربری" : "Sign Out of Workspace"}</span>
                    </button>
                    <LinkNext href={`/${language}/contact`} onClick={handleClose} className="w-full">
                      <button className="w-full py-2.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer">
                        <Mail size={14} />
                        <span>{isFa ? "تماس با ما" : "Contact Us"}</span>
                      </button>
                    </LinkNext>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <LinkNext href={`/${language}/login`} onClick={handleClose}>
                        <button className="w-full py-2.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                          <User size={14} />
                          <span>{isFa ? "ورود" : "Login"}</span>
                        </button>
                      </LinkNext>
                      <LinkNext href={`/${language}/register`} onClick={handleClose}>
                        <button className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] text-white border-none hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
                          <Sparkles size={13} />
                          <span>{isFa ? "عضویت" : "Register"}</span>
                        </button>
                      </LinkNext>
                    </div>

                    <LinkNext href={`/${language}/contact`} onClick={handleClose} className="w-full">
                      <button className="w-full py-2.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer">
                        <Mail size={14} />
                        <span>{isFa ? "تماس با ما" : "Contact Us"}</span>
                      </button>
                    </LinkNext>
                  </div>
                )}

                <div className="pt-2 text-center text-[9px] text-slate-500 select-none">
                  <span>{isFa ? "قدرت‌گرفته از سئورچبل (seorchable.ir)" : "Powered by seorchable.ir"}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
