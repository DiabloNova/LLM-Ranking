"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Sun,
  Moon,
  Languages,
  X,
  Sparkles,
  Database,
  Settings,
  Receipt,
  HelpCircle,
  Command,
  FileText,
  AlertCircle,
  Inbox
} from "lucide-react";
import { Dropdown } from "@/components/Dropdown";
import { Button } from "@/components/Button";

interface DashboardTopbarProps {
  onMenuTrigger: () => void;
  onHelpTrigger?: () => void;
}

interface Workspace {
  id: string;
  name: string;
  role: string;
}

export default function DashboardTopbar({
  onMenuTrigger,
  onHelpTrigger
}: DashboardTopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme, direction, language, setLanguage } = useTheme();
  const { session, logout } = useAuth();
  const isRtl = language === "fa";

  const getLocalizedHref = (href: string) => {
    return `/${language}${href === "/" ? "" : href}`;
  };

  // --- Theme / Language Toggles ---
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

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

  // --- Workspaces ---
  const workspaces: Workspace[] = [
    { id: "ws-tehran", name: isRtl ? "دفتر تهران (شعبه مرکزی)" : "Tehran HQ Workspace", role: "workspace_admin" },
    { id: "ws-isfahan", name: isRtl ? "فضای خلاق اصفهان" : "Isfahan Creative Lab", role: "viewer" },
    { id: "ws-sandbox", name: isRtl ? "محیط تستی برند سازمانی" : "Enterprise SEO Sandbox", role: "super_admin" }
  ];

  // Derive active workspace directly from the authenticated user session (prevents setState sync issue in useEffect)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  const activeWorkspaceId = selectedWorkspaceId || session.user?.workspaceId || "ws-tehran";
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Click outside to close custom select dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setIsWorkspaceOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSwitchWorkspace = (ws: Workspace) => {
    setSelectedWorkspaceId(ws.id);
    setIsWorkspaceOpen(false);
  };

  // --- Global Search Command Palette (Ctrl+K) ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  const searchItems = [
    { id: "technical", labelEn: "Technical SEO Audit", labelFa: "بهینه‌سازی فنی سئو", href: "/dashboard/seo/technical", icon: Settings },
    { id: "schema", labelEn: "Schema Markups", labelFa: "طرح‌واره و متا داتا", href: "/dashboard/seo/schema", icon: Database },
    { id: "audits", labelEn: "AI Visibility Tracker", labelFa: "رویت‌پذیری هوش مصنوعی", href: "/dashboard/aeo/audits", icon: Sparkles },
    { id: "playground", labelEn: "AI Response Playground", labelFa: "زمین بازی پرسش هوش مصنوعی", href: "/dashboard/aeo/playground", icon: HelpCircle },
    { id: "studio", labelEn: "Content Optimization Studio", labelFa: "استودیوی محتوا", href: "/dashboard/content/studio", icon: FileText },
    { id: "billing", labelEn: "Billing & Subscription Quota", labelFa: "مدیریت اشتراک و صورت‌حساب", href: "/dashboard/billing", icon: Receipt }
  ];

  const filteredSearchItems = searchQuery.trim() === ""
    ? searchItems
    : searchItems.filter(item =>
        item.labelEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.labelFa.includes(searchQuery)
      );

  // --- Notifications popover ---
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifState, setNotifState] = useState<"loading" | "error" | "empty" | "loaded">("loaded");
  const notifRef = useRef<HTMLDivElement>(null);

  const notifications = [
    { id: 1, titleEn: "AI Visibility Audit completed", titleFa: "سنجش رویت‌پذیری برند پایان یافت", time: "5m ago", unread: true },
    { id: 2, titleEn: "New citation found in Google Gemini", titleFa: "استناد جدید در مدل جمینای کشف شد", time: "1h ago", unread: true },
    { id: 3, titleEn: "MCP context synched successfully", titleFa: "همگام‌سازی پروتکل MCP با موفقیت انجام شد", time: "1d ago", unread: false }
  ];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // --- User Menu Dropdown ---
  const userDropdownItems = [
    {
      label: isRtl ? "پروفایل کاربری" : "My Account Profile",
      value: "profile",
      onClick: () => router.push(`/${language}/profile`)
    },
    {
      label: isRtl ? "تنظیمات فضای کاری" : "Workspace Settings",
      value: "settings",
      onClick: () => router.push(`/${language}/dashboard/settings`)
    },
    {
      label: isRtl ? "اشتراک و صورت‌حساب" : "Billing & Invoices",
      value: "billing",
      onClick: () => router.push(`/${language}/dashboard/billing`)
    },
    {
      label: isRtl ? "راهنما و پشتیبانی" : "Help & Documentation",
      value: "help",
      onClick: () => {
        if (onHelpTrigger) onHelpTrigger();
      }
    },
    {
      label: isRtl ? "خروج از سیستم" : "Sign Out",
      value: "logout",
      onClick: async () => {
        await logout();
      }
    }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 h-16 flex items-center justify-between gap-3 px-6 border-b border-[var(--border)] bg-[rgba(15,23,42,0.35)] backdrop-blur-md select-none">
        {/* Left Section: Mobile Menu Trigger + Workspace Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuTrigger}
            className="md:hidden p-2 rounded-xl hover:bg-[var(--muted-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer outline-none focus:ring-1 focus:ring-[var(--sky-blue-500)]"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          {/* Workspace Selector */}
          <div className="relative" ref={workspaceRef}>
            <button
              onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted-surface)] text-xs font-bold text-[var(--text-primary)] cursor-pointer outline-none focus:ring-1 focus:ring-[var(--sky-blue-500)]"
              aria-haspopup="listbox"
              aria-expanded={isWorkspaceOpen}
              aria-label={isRtl ? "انتخاب فضای کاری" : "Select workspace"}
            >
              <div className="w-2 h-2 rounded-full bg-[var(--sky-blue-500)] shrink-0" />
              <span className="max-w-[120px] sm:max-w-[200px] truncate">{activeWorkspace.name}</span>
              <ChevronDown size={12} className="text-[var(--text-muted)] shrink-0" />
            </button>

            <AnimatePresence>
              {isWorkspaceOpen && (
                <motion.ul
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute ${isRtl ? "right-0" : "left-0"} mt-2 w-64 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-lg z-50 overflow-hidden divide-y divide-[var(--border)]`}
                  role="listbox"
                >
                  <div className="px-3.5 py-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider bg-[var(--background)]/30 text-start">
                    {isRtl ? "فضاهای کاری شما" : "Available Workspaces"}
                  </div>
                  {workspaces.map((ws) => (
                    <li key={ws.id}>
                      <button
                        onClick={() => handleSwitchWorkspace(ws)}
                        className={`w-full text-start px-4 py-2.5 text-xs font-bold transition-all duration-150 flex items-center justify-between cursor-pointer
                          ${activeWorkspace.id === ws.id
                            ? "text-[var(--sky-blue-500)] bg-[var(--muted-surface)]/40"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)]"
                          }`}
                        role="option"
                        aria-selected={activeWorkspace.id === ws.id}
                      >
                        <span className="truncate">{ws.name}</span>
                        <span className="px-2 py-0.5 text-[8px] rounded-full bg-[var(--border)] font-black text-[var(--text-muted)] uppercase">
                          {ws.role}
                        </span>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Section: Actions + User Menu */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mock Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-[var(--border)] hover:bg-white/[0.06] text-xs text-[var(--text-muted)] cursor-pointer min-w-[120px] lg:min-w-[200px] outline-none focus:ring-1 focus:ring-[var(--sky-blue-500)]"
            title={isRtl ? "جستجو (Ctrl+K)" : "Search (Ctrl+K)"}
            aria-label={isRtl ? "جستجو" : "Search"}
          >
            <div className="flex items-center gap-2">
              <Search size={14} />
              <span className="hidden sm:inline text-[10px]">{isRtl ? "جستجو..." : "Search..."}</span>
            </div>
            <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[var(--border)] text-[8px] font-mono font-bold uppercase select-none">
              <Command size={8} /> K
            </kbd>
          </button>

          {/* Language Toggle */}
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="px-2 h-9 cursor-pointer outline-none focus:ring-1 focus:ring-[var(--sky-blue-500)]" aria-label="Toggle language">
            <Languages size={15} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
            <span className="uppercase text-[10px] font-bold text-[var(--text-secondary)]">{language}</span>
          </Button>

          {/* Theme Toggle */}
          <Button variant="ghost" size="sm" onClick={toggleTheme} className="p-2 w-9 h-9 cursor-pointer outline-none focus:ring-1 focus:ring-[var(--sky-blue-500)]" aria-label="Toggle theme">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="inline-flex"
              >
                {theme === "light" ? <Moon size={16} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" /> : <Sun size={16} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" />}
              </motion.span>
            </AnimatePresence>
          </Button>

          <span className="h-5 w-px bg-[var(--border)] mx-1 shrink-0" />

          {/* Notifications Center Popover */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 w-9 h-9 rounded-xl hover:bg-[var(--muted-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer outline-none focus:ring-1 focus:ring-[var(--sky-blue-500)]"
              aria-haspopup="true"
              aria-expanded={isNotifOpen}
              aria-label={isRtl ? "اعلان‌ها" : "Notifications"}
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--orange-500)] animate-pulse" />
            </button>

            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute ${isRtl ? "left-0" : "right-0"} mt-2 w-80 sm:w-96 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-xl z-50 overflow-hidden divide-y divide-[var(--border)]`}
                >
                  {/* Notification Center Header & state toggles */}
                  <div className="px-4 py-3 flex items-center justify-between bg-[var(--background)]/30 text-start">
                    <span className="text-xs font-black text-[var(--text-primary)]">
                      {isRtl ? "مرکز اعلان‌ها" : "Notification Center"}
                    </span>
                    {/* Tiny state switches for demonstration purposes */}
                    <div className="flex gap-1.5 text-[8px] font-black uppercase text-[var(--text-muted)]">
                      <button onClick={() => setNotifState("loaded")} className={`hover:text-[var(--text-primary)] ${notifState === "loaded" ? "text-[var(--sky-blue-500)]" : ""}`}>Ok</button>
                      <span>•</span>
                      <button onClick={() => setNotifState("loading")} className={`hover:text-[var(--text-primary)] ${notifState === "loading" ? "text-[var(--sky-blue-500)]" : ""}`}>Load</button>
                      <span>•</span>
                      <button onClick={() => setNotifState("empty")} className={`hover:text-[var(--text-primary)] ${notifState === "empty" ? "text-[var(--sky-blue-500)]" : ""}`}>Empty</button>
                      <span>•</span>
                      <button onClick={() => setNotifState("error")} className={`hover:text-[var(--text-primary)] ${notifState === "error" ? "text-[var(--sky-blue-500)]" : ""}`}>Err</button>
                    </div>
                  </div>

                  {/* Dynamic Content Panel */}
                  <div className="max-h-[320px] overflow-y-auto divide-y divide-[var(--border)]">
                    {notifState === "loading" && (
                      <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-[var(--sky-blue-500)] border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-bold text-[var(--text-muted)]">{isRtl ? "در حال دریافت..." : "Fetching notices..."}</span>
                      </div>
                    )}

                    {notifState === "error" && (
                      <div className="p-6 text-center flex flex-col items-center justify-center gap-2 text-[var(--color-error)]">
                        <AlertCircle size={20} />
                        <span className="text-[10px] font-black">{isRtl ? "خطا در دریافت اعلان‌ها" : "Network sync failed"}</span>
                      </div>
                    )}

                    {notifState === "empty" && (
                      <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                        <Inbox size={22} className="opacity-50" />
                        <span className="text-[10px] font-bold">{isRtl ? "هیچ اعلانی یافت نشد" : "All caught up!"}</span>
                      </div>
                    )}

                    {notifState === "loaded" && notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3.5 text-start transition-colors duration-150 flex gap-2.5 relative hover:bg-[var(--muted-surface)]/20 cursor-pointer
                          ${notif.unread ? "bg-[var(--sky-blue-500)]/[0.02]" : ""}`}
                      >
                        {notif.unread && (
                          <span className="absolute top-4 start-3 w-1.5 h-1.5 rounded-full bg-[var(--sky-blue-500)]" />
                        )}
                        <div className={`${notif.unread ? "ps-3" : "ps-0"} flex-1`}>
                          <p className={`text-[11px] leading-tight text-[var(--text-primary)] ${notif.unread ? "font-bold" : "font-semibold"}`}>
                            {isRtl ? notif.titleFa : notif.titleEn}
                          </p>
                          <span className="text-[9px] text-[var(--text-muted)] mt-1 inline-block font-semibold">{notif.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="py-2 text-center bg-[var(--background)]/10">
                    <button className="text-[10px] font-black text-[var(--sky-blue-500)] hover:underline cursor-pointer">
                      {isRtl ? "علامت‌گذاری همه به عنوان خوانده شده" : "Mark all as read"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Account Menu */}
          <Dropdown
            align="right"
            trigger={
              <button
                className="flex items-center gap-2 p-1 pe-2 rounded-full hover:bg-[var(--muted-surface)] transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-[var(--sky-blue-500)]"
                aria-label={isRtl ? "منوی کاربری" : "User menu"}
              >
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A365D] to-[#B8860B] dark:from-[#0D9488] dark:to-[#D97706] text-white flex items-center justify-center text-xs font-bold uppercase shadow-inner">
                  {session.user?.name?.slice(0, 1) || "U"}
                </span>
                <span className="hidden lg:flex flex-col items-start leading-none text-start">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{session.user?.name || "User Admin"}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{session.user?.email || "user@seorchable.ir"}</span>
                </span>
                <ChevronDown size={14} className="hidden lg:inline text-[var(--text-muted)]" />
              </button>
            }
            items={userDropdownItems}
          />
        </div>
      </header>

      {/* SEARCH COMMAND PALETTE MODAL */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[110]" dir={direction}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsSearchOpen(false)}
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50"
            >
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden divide-y divide-[var(--border)]">
                {/* Search Header Bar */}
                <div className="flex items-center gap-3.5 px-4 py-4">
                  <Search size={18} className="text-[var(--text-muted)] shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isRtl ? "به دنبال چه هستید؟ نام ابزار را وارد کنید..." : "Type a module or guide name to jump..."}
                    className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border-none outline-none focus:ring-0"
                    aria-label="Search modules"
                  />
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="p-1 rounded-full hover:bg-[var(--muted-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer outline-none"
                    aria-label="Close search"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Filtered Results list */}
                <div className="max-h-[350px] overflow-y-auto py-2">
                  {filteredSearchItems.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                      <AlertCircle size={22} className="opacity-50" />
                      <span className="text-xs font-semibold">{isRtl ? "نتیجه‌ای یافت نشد" : "No matches found"}</span>
                    </div>
                  ) : (
                    filteredSearchItems.map((item) => {
                      const IconComp = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            router.push(getLocalizedHref(item.href));
                            setIsSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="w-full px-4 py-3 text-start hover:bg-[var(--muted-surface)]/40 flex items-center justify-between cursor-pointer group outline-none"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <IconComp size={16} className="text-[var(--text-muted)] group-hover:text-[var(--sky-blue-500)] shrink-0 transition-colors" />
                            <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                              {isRtl ? item.labelFa : item.labelEn}
                            </span>
                          </div>
                          <span className="text-[9px] font-black text-[var(--text-muted)] group-hover:text-[var(--sky-blue-500)] transition-colors uppercase">
                            Jump
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer instructions */}
                <div className="px-4 py-2.5 bg-[var(--background)]/15 flex items-center justify-between text-[10px] text-[var(--text-muted)] font-semibold select-none">
                  <div className="flex items-center gap-3">
                    <span><kbd className="px-1 py-0.5 rounded bg-[var(--border)] font-mono font-bold">ESC</kbd> {isRtl ? "بستن" : "Close"}</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-[var(--border)] font-mono font-bold">↵</kbd> {isRtl ? "انتخاب" : "Select"}</span>
                  </div>
                  <span>{isRtl ? "توسعه‌یافته در سئورچبل" : "Seorchable Workspace Search"}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
