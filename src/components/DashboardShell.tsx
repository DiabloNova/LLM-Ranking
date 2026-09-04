"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { Dropdown } from "@/components/Dropdown";
import { Button } from "@/components/Button";
import {
  LayoutDashboard,
  BrainCircuit,
  Network,
  Compass,
  BarChart3,
  Menu,
  X,
  Sun,
  Moon,
  Search,
  Database,
  Building2,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Languages,
  Receipt,
  LogOut,
} from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// 1. Static Sub-Component: Brand Logo
const Logo = ({
  language,
  showText = true,
}: {
  language: "en" | "fa";
  showText?: boolean;
}) => (
  <div className="flex items-center gap-2.5">
    <div className="relative w-9 h-9 flex-shrink-0 rounded-[var(--radius-md)] overflow-hidden ring-1 ring-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md">
      <Image
        src="/logo-horse.png"
        alt="Brand logo"
        fill
        sizes="36px"
        className="object-contain p-0.5"
        priority
      />
    </div>
    {showText && (
      <div className="flex flex-col leading-none">
        <span className="font-bold text-sm text-[var(--text-primary)] tracking-tight">
          {language === "fa" ? "هوش برند" : "BrandGraph"}
        </span>
        <span className="text-[10px] text-[var(--text-muted)] font-medium">
          {language === "fa" ? "پلتفرم هوشمندی" : "Intelligence Platform"}
        </span>
      </div>
    )}
  </div>
);

// 2. Static Sub-Component: Navigation List
const NavList = ({
  navSections,
  sidebarOpen,
  isItemActive,
  getLocalizedHref,
  onNavigate,
}: {
  navSections: NavSection[];
  sidebarOpen: boolean;
  isItemActive: (href: string) => boolean;
  getLocalizedHref: (href: string) => string;
  onNavigate?: () => void;
}) => (
  <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
    {navSections.map((section) => (
      <div key={section.title} className="space-y-1">
        {sidebarOpen && (
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {section.title}
          </p>
        )}
        {section.items.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.href);
          return (
            <Link
              key={item.href}
              href={getLocalizedHref(item.href)}
              onClick={onNavigate}
              title={!sidebarOpen ? item.name : undefined}
              className={`group relative flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors duration-150 ${
                active
                  ? "bg-[var(--color-info-bg)] text-[var(--color-primary-600)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--muted-surface)] hover:text-[var(--text-primary)]"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-[var(--color-primary-600)]"
                />
              )}
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </div>
    ))}
  </nav>
);

export const DashboardShell: React.FC<DashboardShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, direction, language, setLanguage } = useTheme();
  const { logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState("Enterprise Tehran");

  const navSections: NavSection[] = [
    {
      title: language === "fa" ? "مرکز عملیات هسته" : "Core Operations",
      items: [
        {
          name: language === "fa" ? "میز فرماندهی هوشمند" : "Command Center",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          name:
            language === "fa"
              ? "موتور ورود و پایش اسناد"
              : "Data Ingestion Engine",
          href: "/dashboard/content/ingestion",
          icon: Database,
        },
        {
          name:
            language === "fa"
              ? "جستجوی پیشرفته معنایی RAG"
              : "AI Semantic Discovery",
          href: "/dashboard/query",
          icon: Search,
        },
        {
          name:
            language === "fa"
              ? "گراف دانش سازمانی"
              : "Enterprise Knowledge Graph",
          href: "/dashboard/entities",
          icon: Network,
        },
      ],
    },
    {
      title:
        language === "fa"
          ? "هوشمندی و تحلیل‌های ژرف"
          : "Intelligence & Deep Analysis",
      items: [
        {
          name:
            language === "fa"
              ? "رادار تحلیل رقابتی برند"
              : "Competitive Intelligence Radar",
          href: "/dashboard/competitors",
          icon: Compass,
        },
        {
          name:
            language === "fa"
              ? "تحلیل پاسخ‌های مدل‌های زبانی"
              : "Language Model Analytics",
          href: "/dashboard/analytics",
          icon: BarChart3,
        },
      ],
    },
  ];

  const workspaceDropdownItems = [
    {
      label: "Enterprise Tehran",
      value: "tehran",
      onClick: () => setActiveWorkspace("Enterprise Tehran"),
    },
    {
      label: "Global EMEA",
      value: "emea",
      onClick: () => setActiveWorkspace("Global EMEA"),
    },
    {
      label: "GCC Regional",
      value: "gcc",
      onClick: () => setActiveWorkspace("GCC Regional"),
    },
  ];

  const userDropdownItems = [
    {
      label: language === "fa" ? "حساب کاربری" : "User Account Profile",
      value: "profile",
      onClick: () => router.push(`/${language}/profile`),
    },
    {
      label: language === "fa" ? "پیکربندی سیستم" : "System Configuration",
      value: "settings",
      onClick: () => router.push(`/${language}/settings`),
    },
    {
      label: language === "fa" ? "خروج از سیستم" : "Logout of System",
      value: "logout",
      onClick: async () => await logout(),
    },
  ];

  const toggleLanguage = () => {
    const newLang = language === "en" ? "fa" : "en";
    setLanguage(newLang);
    if (pathname) {
      const segments = pathname.split("/");
      if (segments[1] === "en" || segments[1] === "fa") {
        segments[1] = newLang;
        router.push(segments.join("/"));
      } else {
        router.push(`/${newLang}${pathname}`);
      }
    }
  };

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const getLocalizedHref = (href: string) =>
    `/${language}${href === "/" ? "" : href}`;

  const isItemActive = (href: string) => {
    const localizedHref = getLocalizedHref(href);
    return (
      pathname === localizedHref ||
      (href !== "/dashboard" && pathname?.startsWith(localizedHref))
    );
  };

  return (
    <div
      className="min-h-screen flex bg-transparent text-[var(--foreground)] relative overflow-hidden"
      dir={direction}
    >
      {/* 4. Ambient Background Orbs */}
      <div className="ambient-bg">
        <div className="ambient-orb orb-1" />
        <div className="ambient-orb orb-2" />
      </div>

      {/* DESKTOP SIDEBAR - Standard glassmorphic treatment */}
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 76 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="hidden md:flex flex-col border-e border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] shadow-[var(--glass-shadow)] sticky top-0 h-screen z-30"
      >
        <div className="h-16 flex items-center px-4 border-b border-[var(--glass-border)]">
          <Logo language={language} showText={sidebarOpen} />
        </div>

        {/* Tenant switcher (sidebar) */}
        {sidebarOpen && (
          <div className="px-3 pt-4">
            <Dropdown
              trigger={
                <button className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-[var(--sky-blue-500)]/35 transition-colors shadow-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <Building2
                      size={16}
                      className="text-[var(--color-primary-600)] flex-shrink-0"
                    />
                    <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {activeWorkspace}
                    </span>
                  </span>
                  <ChevronDown
                    size={14}
                    className="text-[var(--text-muted)] flex-shrink-0"
                  />
                </button>
              }
              items={workspaceDropdownItems}
            />
          </div>
        )}

        <NavList
          navSections={navSections}
          sidebarOpen={sidebarOpen}
          isItemActive={isItemActive}
          getLocalizedHref={getLocalizedHref}
        />

        {/* Quota card */}
        {sidebarOpen && (
          <div className="mx-3 mb-3 p-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-medium mb-2">
              <span className="text-[var(--text-secondary)]">
                {language === "fa" ? "سهمیه پرس‌وجو" : "Query Quota"}
              </span>
              <span className="text-[var(--color-primary-600)] font-semibold">
                72%
              </span>
            </div>
            <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] rounded-full"
                style={{ width: "72%" }}
              />
            </div>
            <span className="mt-2 block text-[10px] text-[var(--text-muted)]">
              {language === "fa"
                ? "۷,۲۰۰ از ۱۰,۰۰۰"
                : "7,200 of 10,000 queries"}
            </span>
          </div>
        )}

        {/* Collapse toggle */}
        <div className="p-3 border-t border-[var(--glass-border)]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`w-full ${sidebarOpen ? "justify-start" : "justify-center"}`}
            aria-label={
              sidebarOpen
                ? language === "fa"
                  ? "جمع کردن منو"
                  : "Collapse menu"
                : language === "fa"
                  ? "باز کردن منو"
                  : "Expand menu"
            }
          >
            <span className="rtl:-scale-x-100 inline-flex">
              {sidebarOpen ? (
                <PanelLeftClose size={18} />
              ) : (
                <PanelLeftOpen size={18} />
              )}
            </span>
            {sidebarOpen && (
              <span className="text-xs">
                {language === "fa" ? "جمع کردن" : "Collapse"}
              </span>
            )}
          </Button>
        </div>
      </motion.aside>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: direction === "rtl" ? 280 : -280 }}
              animate={{ x: 0 }}
              exit={{ x: direction === "rtl" ? 280 : -280 }}
              transition={{ type: "tween", duration: 0.25 }}
              className="absolute inset-y-0 start-0 w-72 flex flex-col bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border-e border-[var(--glass-border)] shadow-xl"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--glass-border)]">
                <Logo language={language} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5"
                  aria-label={language === "fa" ? "بستن منو" : "Close menu"}
                >
                  <X size={18} />
                </Button>
              </div>
              <div className="px-3 pt-4">
                <Dropdown
                  trigger={
                    <button className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]">
                      <span className="flex items-center gap-2 min-w-0">
                        <Building2
                          size={16}
                          className="text-[var(--color-primary-600)]"
                        />
                        <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {activeWorkspace}
                        </span>
                      </span>
                      <ChevronDown
                        size={14}
                        className="text-[var(--text-muted)]"
                      />
                    </button>
                  }
                  items={workspaceDropdownItems}
                />
              </div>
              <NavList
                navSections={navSections}
                sidebarOpen={true}
                isItemActive={isItemActive}
                getLocalizedHref={getLocalizedHref}
                onNavigate={() => setMobileSidebarOpen(false)}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN COLUMN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="sticky top-0 z-40 h-16 flex items-center justify-between gap-3 px-4 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] shadow-[var(--glass-shadow)]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 -ms-1 rounded-[var(--radius-md)] hover:bg-[var(--muted-surface)] text-[var(--text-secondary)]"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {/* Search bar */}
            <div className="relative hidden sm:flex items-center w-64 lg:w-80">
              <Search
                size={16}
                className="absolute start-3 text-[var(--text-muted)] pointer-events-none"
              />
              <input
                type="search"
                placeholder={
                  language === "fa"
                    ? "جستجو در اسناد..."
                    : "Search documents..."
                }
                className="w-full ps-9 pe-16 py-2 text-sm rounded-xl bg-white/[0.03] border border-[var(--glass-border)] focus:border-[var(--sky-blue-500)]/40 focus:bg-white/[0.05] outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
              />
              <kbd className="absolute end-2.5 hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="px-2"
              aria-label="Toggle language"
            >
              <Languages size={16} />
              <span className="uppercase text-xs">{language}</span>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex"
                >
                  {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                </motion.span>
              </AnimatePresence>
            </Button>

            {/* Invoice Icon button placed right next to Language and Theme Toggles */}
            <Link
              href={`/${language}/invoice`}
              title={language === "fa" ? "پرداخت صورتحساب" : "Invoice Payment"}
            >
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                aria-label="Invoice"
              >
                <Receipt size={18} />
              </Button>
            </Link>

            <span className="hidden sm:inline h-6 w-px bg-[var(--glass-border)] mx-1" />

            <Dropdown
              align="right"
              trigger={
                <button className="flex items-center gap-2 p-1 pe-2 rounded-[var(--radius-full)] hover:bg-[var(--muted-surface)] transition-colors">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--sky-blue-500)] to-[var(--orange-500)] text-white flex items-center justify-center text-xs font-bold">
                    U
                  </span>
                  <span className="hidden lg:flex flex-col items-start leading-none">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      User Admin
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      tehran@brandgraph.ai
                    </span>
                  </span>
                  <ChevronDown
                    size={14}
                    className="hidden lg:inline text-[var(--text-muted)]"
                  />
                </button>
              }
              items={userDropdownItems}
            />
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full relative z-10">
            {children}
          </div>

          <footer className="h-9 border-t border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] flex items-center justify-between px-4 text-[11px] text-[var(--text-muted)] mt-auto">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
              <span>
                {language === "fa"
                  ? "همه سیستم‌ها عملیاتی"
                  : "All systems operational"}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <span>
                {language === "fa"
                  ? "همگام‌سازی: ۱ دقیقه پیش"
                  : "Synced 1m ago"}
              </span>
              <span>v2.4.0</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
