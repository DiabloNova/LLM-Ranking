"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { SeorchableLogo } from "@/components/marketing/SeorchableLogo";
import {
  Home,
  BarChart2,
  Globe,
  Shield,
  Radar,
  Settings,
  User,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Languages,
  Receipt
} from "lucide-react";

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelFa: string;
  path: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    icon: Home,
    labelEn: "Command Center",
    labelFa: "صفحه نخست",
    path: "/"
  },
  {
    icon: BarChart2,
    labelEn: "GEO Optimization Engine",
    labelFa: "موتور بهینه‌سازی GEO",
    path: "/solutions/geo"
  },
  {
    icon: Globe,
    labelEn: "AEO Optimization Studio",
    labelFa: "استودیو بهینه‌سازی AEO",
    path: "/solutions/aeo"
  },
  {
    icon: Shield,
    labelEn: "Cognitive Brand Protection",
    labelFa: "محافظت از هویت برند",
    path: "/solutions/protection"
  },
  {
    icon: Radar,
    labelEn: "Competitive Intelligence Radar",
    labelFa: "رادار تحلیل رقابتی برند",
    path: "/solutions/radar"
  },
  {
    icon: Settings,
    labelEn: "System Configuration",
    labelFa: "پیکربندی سیستم",
    path: "/settings"
  },
  {
    icon: User,
    labelEn: "User Account Profile",
    labelFa: "حساب کاربری",
    path: "/profile"
  }
];

export default function FloatingSidebar() {
  const { language, setLanguage, theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const pathname = usePathname();
  const isFa = language === "fa";

  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Only render on workspace routes (dashboard, settings, profile) and never on main marketing page
  const isWorkspace =
    pathname?.includes("/dashboard") ||
    pathname?.includes("/settings") ||
    pathname?.includes("/profile");

  if (!isWorkspace) return null;

  const getLocalizedHref = (path: string) => {
    return `/${language}${path === "/" ? "" : path}`;
  };

  const isItemActive = (path: string) => {
    const localizedPath = getLocalizedHref(path);
    if (path === "/") {
      return pathname === localizedPath;
    }
    return pathname === localizedPath || pathname?.startsWith(localizedPath);
  };

  const toggleMobileMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* DESKTOP HORIZONTAL FLOATING DOCK */}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] hidden md:block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`glass-panel border border-white/10 dark:border-white/5 shadow-2xl rounded-full px-5 py-3 flex items-center gap-4 transition-all duration-500 ease-in-out backdrop-blur-2xl bg-slate-950/85 text-white ${
            isHovered ? "max-w-[95vw] scale-100 opacity-100" : "max-w-[280px] scale-95 opacity-90"
          }`}
          style={{
            boxShadow: isHovered
              ? "0 25px 50px -12px rgba(56, 189, 248, 0.25), 0px 0px 15px rgba(249, 115, 22, 0.15)"
              : "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
          }}
        >
          <AnimatePresence mode="wait">
            {!isHovered ? (
              // Collapsed/Subtle Pill State
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 select-none"
              >
                <div className="relative">
                  <SeorchableLogo className="w-8 h-8" glow={true} />
                </div>
                <div className="flex flex-col text-start">
                  <span className="text-[11px] font-black tracking-wider text-[var(--sky-blue-500)] uppercase font-display">
                    {isFa ? "منوی هوشمند ناوبری" : "SMART NAVIGATION"}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium font-mono">
                    {isFa ? "برای نمایش نگه دارید" : "Hover to Expand"}
                  </span>
                </div>
              </motion.div>
            ) : (
              // Expanded Horizontal State
              <motion.div
                key="expanded"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-5"
                dir={isFa ? "rtl" : "ltr"}
              >
                {/* Logo and Brand */}
                <div className="flex items-center gap-2 px-1 border-r border-white/10 rtl:border-r-0 rtl:border-l pl-3 rtl:pl-0 rtl:pr-3 shrink-0">
                  <SeorchableLogo className="w-7 h-7" glow={false} />
                  <span className="text-[11px] font-black bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] bg-clip-text text-transparent font-display">
                    {isFa ? "سئورچبل" : "Seorchable"}
                  </span>
                </div>

                {/* Horizontal Navigation Links */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {SIDEBAR_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item.path);
                    const label = isFa ? item.labelFa : item.labelEn;

                    return (
                      <Link
                        key={item.path}
                        href={getLocalizedHref(item.path)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border ${
                          isActive
                            ? "bg-gradient-to-r from-[var(--sky-blue-500)]/20 to-[var(--orange-500)]/10 text-white border-[var(--sky-blue-500)]/40 font-black shadow-inner"
                            : "text-slate-300 hover:bg-white/10 hover:text-white border-transparent"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                            isActive ? "text-[var(--sky-blue-500)]" : "text-slate-400"
                          }`}
                        />
                        <span className="whitespace-nowrap">{label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-white/10 shrink-0" />

                {/* Theme, Language and Invoice Controls right next to each other */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Language */}
                  <button
                    onClick={() => setLanguage(language === "fa" ? "en" : "fa")}
                    title={isFa ? "Switch to English" : "تغییر به فارسی"}
                    className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer text-[10px] font-black flex items-center gap-0.5"
                  >
                    <Languages className="w-4 h-4 text-[var(--sky-blue-500)]" />
                    <span>{isFa ? "EN" : "فا"}</span>
                  </button>

                  {/* Theme Toggle */}
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    title={isFa ? "تغییر پوسته" : "Toggle Theme"}
                    className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {theme === "dark" ? (
                      <Sun className="w-4 h-4 text-[var(--orange-500)]" />
                    ) : (
                      <Moon className="w-4 h-4 text-[var(--orange-500)]" />
                    )}
                  </button>

                  {/* Invoice */}
                  <Link
                    href={`/${language}/invoice`}
                    title={isFa ? "پرداخت صورتحساب" : "Invoice Payment"}
                    className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Receipt className="w-4 h-4 text-[var(--sky-blue-500)]" />
                  </Link>

                  {/* Logout */}
                  <button
                    onClick={async () => {
                      await logout();
                    }}
                    title={isFa ? "خروج از سیستم" : "Sign Out"}
                    className="p-1.5 rounded-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MOBILE TRIGGER IN THE CENTER BOTTOM OF THE PAGE */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] md:hidden">
        <button
          onClick={toggleMobileMenu}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] text-white flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold text-xs"
          style={{ boxShadow: "0 10px 30px rgba(56, 189, 248, 0.4)" }}
        >
          {isOpen ? (
            <>
              <X className="w-4 h-4" />
              <span>{isFa ? "بستن منو" : "Close Menu"}</span>
            </>
          ) : (
            <>
              <Menu className="w-4 h-4" />
              <span>{isFa ? "منوی ناوبری هوشمند" : "Smart Menu"}</span>
            </>
          )}
        </button>
      </div>

      {/* MOBILE MENU OVERLAY CONTAINER */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[998] md:hidden" dir={isFa ? "rtl" : "ltr"}>
            {/* Dark blur backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-2xl"
              onClick={toggleMobileMenu}
            />

            {/* Centered / Slide-up Content Sheet */}
            <motion.div
              initial={{ opacity: 0, y: "15%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "15%" }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              className="absolute bottom-24 left-4 right-4 glass-panel border border-white/10 rounded-3xl p-6 bg-slate-950/95 text-white shadow-2xl flex flex-col gap-4 max-h-[75vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <SeorchableLogo className="w-8 h-8" />
                  <span className="text-sm font-black bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] bg-clip-text text-transparent font-display">
                    {isFa ? "منوی ناوبری پیشرفته" : "Advanced Navigation Menu"}
                  </span>
                </div>
                <button
                  onClick={toggleMobileMenu}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Quick controls inside Mobile overlay */}
              <div className="flex items-center justify-around py-2.5 bg-white/5 rounded-xl border border-white/5">
                <button
                  onClick={() => setLanguage(language === "fa" ? "en" : "fa")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  <Languages className="w-4 h-4 text-[var(--sky-blue-500)]" />
                  <span>{isFa ? "English" : "فارسی"}</span>
                </button>

                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 text-[var(--orange-500)]" />
                  ) : (
                    <Moon className="w-4 h-4 text-[var(--orange-500)]" />
                  )}
                  <span>{isFa ? "پوسته" : "Theme"}</span>
                </button>

                <Link
                  href={`/${language}/invoice`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  <Receipt className="w-4 h-4 text-[var(--sky-blue-500)]" />
                  <span>{isFa ? "صورتحساب" : "Invoice"}</span>
                </Link>
              </div>

              {/* Mobile item list */}
              <div className="flex flex-col gap-2">
                {SIDEBAR_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.path);
                  const label = isFa ? item.labelFa : item.labelEn;

                  return (
                    <Link
                      key={item.path}
                      href={getLocalizedHref(item.path)}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3.5 p-3.5 rounded-2xl transition-all duration-300 border ${
                        isActive
                          ? "bg-gradient-to-r from-[var(--sky-blue-500)]/20 to-[var(--orange-500)]/10 text-white border-[var(--sky-blue-500)]/40 font-black shadow-inner"
                          : "text-slate-300 hover:bg-white/5 hover:text-white border-transparent"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive ? "text-[var(--sky-blue-500)]" : "text-slate-400"
                        }`}
                      />
                      <span className="text-sm">{label}</span>
                    </Link>
                  );
                })}

                {/* Mobile Logout Button */}
                <button
                  onClick={async () => {
                    setIsOpen(false);
                    await logout();
                  }}
                  className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl transition-all duration-300 border text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border-transparent cursor-pointer text-start"
                >
                  <LogOut className="w-5 h-5 shrink-0 text-rose-400" />
                  <span className="text-sm">{isFa ? "خروج از حساب کاربری" : "Logout of Account"}</span>
                </button>
              </div>

              {/* Branding Footer inside mobile drawer */}
              <div className="pt-3 border-t border-white/10 text-center text-[10px] text-slate-500">
                <span>{isFa ? "سئورچبل — seorchable.ir" : "seorchable.ir — Brand Premium"}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
