"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import {
  dashboardNavigation,
  NavigationItem,
  NavigationSubItem
} from "@/config/dashboardNavigation";
import { SeorchableLogo } from "../marketing/SeorchableLogo";
import {
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  ChevronLeft
} from "lucide-react";

interface DashboardSidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (val: boolean) => void;
  onHelpClick?: () => void;
}

export default function DashboardSidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  onHelpClick
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, direction } = useTheme();
  const { session, logout } = useAuth();
  const isRtl = language === "fa";

  // Accordion state manually toggled by user (key is item id, value is boolean)
  const [toggledItems, setToggledItems] = useState<Record<string, boolean>>({});

  // Trap focus for mobile drawer
  const drawerRef = useRef<HTMLDivElement>(null);

  // Support Escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, setMobileOpen]);

  // Trap focus implementation for mobile drawer
  useEffect(() => {
    if (!mobileOpen || !drawerRef.current) return;

    const focusableElements = drawerRef.current.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select'
    );
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleFocusTrap);
    firstElement.focus();

    return () => window.removeEventListener("keydown", handleFocusTrap);
  }, [mobileOpen]);

  const toggleExpand = (id: string) => {
    setToggledItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getLocalizedHref = (href: string) => {
    return `/${language}${href === "/" ? "" : href}`;
  };

  const isRouteActive = (href?: string) => {
    if (!href) return false;
    const localizedHref = getLocalizedHref(href);
    if (href === "/dashboard") {
      return pathname === localizedHref;
    }
    return pathname === localizedHref || pathname?.startsWith(localizedHref + "/");
  };

  const isParentActive = (item: NavigationItem) => {
    if (item.href) return isRouteActive(item.href);
    if (item.children) {
      return item.children.some((child) => isRouteActive(child.href));
    }
    return false;
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item.href) {
      if (item.href === "#help") {
        if (onHelpClick) onHelpClick();
      } else {
        router.push(getLocalizedHref(item.href));
        setMobileOpen(false);
      }
    } else {
      toggleExpand(item.id);
    }
  };

  const handleSubItemClick = (child: NavigationSubItem) => {
    router.push(getLocalizedHref(child.href));
    setMobileOpen(false);
  };

  const renderNavItems = (items: NavigationItem[], isMobileState: boolean) => {
    return items.map((item) => {
      const IconComp = item.icon;
      const hasChildren = !!item.children && item.children.length > 0;
      const isChildActive = hasChildren && item.children!.some((child) => isRouteActive(child.href));

      // Accordion is expanded if toggled state is true OR if we haven't manually toggled it but a child is active
      const isExpanded = toggledItems[item.id] !== undefined
        ? toggledItems[item.id]
        : isChildActive;

      const isActive = isParentActive(item);

      return (
        <div key={item.id} className="space-y-1">
          {/* Main Item Button */}
          <button
            onClick={() => handleItemClick(item)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer group outline-none focus:ring-1 focus:ring-[var(--sky-blue-500)]
              ${isActive
                ? "bg-gradient-to-r from-[#1A365D]/20 to-[#008080]/10 text-[var(--text-primary)] border-[#008080]/40 font-bold dark:from-[#0F172A]/40 dark:to-[#0D9488]/20"
                : "text-[var(--text-secondary)] hover:bg-[var(--muted-surface)] hover:text-[var(--text-primary)] border-transparent"
              }
              ${collapsed && !isMobileState ? "justify-center" : ""}`}
            title={collapsed && !isMobileState ? (isRtl ? item.labelFa : item.labelEn) : undefined}
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-label={isRtl ? item.labelFa : item.labelEn}
          >
            <div className="flex items-center gap-3 min-w-0">
              <IconComp
                size={16}
                className={`shrink-0 transition-transform group-hover:scale-105 duration-200
                  ${isActive ? "text-[var(--sky-blue-500)]" : "text-[var(--text-muted)] group-hover:text-[var(--sky-blue-500)]"}`}
              />
              {(!collapsed || isMobileState) && (
                <span className="truncate">{isRtl ? item.labelFa : item.labelEn}</span>
              )}
            </div>

            {hasChildren && (!collapsed || isMobileState) && (
              <div className="shrink-0 text-[var(--text-muted)]">
                {isExpanded ? <ChevronDown size={14} /> : (isRtl ? <ChevronLeft size={14} /> : <ChevronRight size={14} />)}
              </div>
            )}
          </button>

          {/* Children / Accordion list */}
          {hasChildren && isExpanded && (!collapsed || isMobileState) && (
            <div className={`space-y-1 ${isRtl ? "pr-6 border-r border-[var(--border)]" : "pl-6 border-l border-[var(--border)]"} mt-1 mr-2 ml-2`}>
              {item.children?.map((child) => {
                const isChildActiveRoute = isRouteActive(child.href);
                return (
                  <button
                    key={child.id}
                    onClick={() => handleSubItemClick(child)}
                    className={`w-full text-start px-3 py-2 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer outline-none focus:text-[var(--sky-blue-500)]
                      ${isChildActiveRoute
                        ? "text-[var(--sky-blue-500)] font-black"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    aria-label={isRtl ? child.labelFa : child.labelEn}
                  >
                    {isRtl ? child.labelFa : child.labelEn}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

  const renderSidebarContents = (isMobileState: boolean) => {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* LOGO & BRAND HEADER */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-[var(--border)] shrink-0 bg-[rgba(15,23,42,0.15)]">
          <SeorchableLogo className="w-7 h-7" glow={false} />
          {(!collapsed || isMobileState) && (
            <span className="font-black text-[var(--text-primary)] text-sm tracking-tight font-display">
              {isRtl ? "پنل هوشمند سئورچبل" : "seorchable Intelligence"}
            </span>
          )}
        </div>

        {/* NAVIGATION SECTIONS */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-none">
          {dashboardNavigation.map((sec) => {
            const hasVisibleItems = sec.items.length > 0;
            if (!hasVisibleItems) return null;

            return (
              <div key={sec.id} className="space-y-2">
                {(!collapsed || isMobileState) ? (
                  <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    {isRtl ? sec.titleFa : sec.titleEn}
                  </h3>
                ) : (
                  <div className="h-px bg-[var(--border)] mx-2 my-4" />
                )}
                <div className="space-y-1">
                  {renderNavItems(sec.items, isMobileState)}
                </div>
              </div>
            );
          })}
        </nav>

        {/* FOOTER PINNED SECTION */}
        {(!collapsed || isMobileState) && (
          <div className="p-4 border-t border-[var(--border)] bg-[rgba(15,23,42,0.15)] shrink-0 space-y-3">
            <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A365D] to-[#B8860B] dark:from-[#0D9488] dark:to-[#D97706] text-white flex items-center justify-center text-xs font-bold uppercase shrink-0 shadow-inner">
                {session.user?.name?.slice(0, 1) || "U"}
              </span>
              <div className="min-w-0 flex-1 text-start">
                <p className="text-xs font-black text-[var(--text-primary)] truncate">
                  {session.user?.name || (isRtl ? "کاربر سیستم" : "User System")}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">
                  {session.user?.email || "user@seorchable.ir"}
                </p>
              </div>
            </div>

            <button
              onClick={async () => {
                setMobileOpen(false);
                await logout();
              }}
              className="w-full py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer outline-none focus:ring-1 focus:ring-rose-500"
              aria-label={isRtl ? "خروج" : "Sign Out"}
            >
              <LogOut size={14} />
              <span>{isRtl ? "خروج از حساب" : "Sign Out"}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* DESKTOP SIDEBAR CONTAINER (Hidden on Mobile <768px) */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-[var(--card)] border-r border-l border-[var(--border)] transition-all duration-300 shrink-0 z-30 select-none overflow-hidden
          ${collapsed ? "w-20" : "w-64 lg:w-72"}`}
        dir={direction}
      >
        {renderSidebarContents(false)}

        {/* Collapse Button floating indicator on desktop */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`absolute bottom-20 ${isRtl ? "-left-3" : "-right-3"} w-6 h-6 rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center shadow-md cursor-pointer transition-transform duration-200 z-50`}
          aria-label={isRtl ? "تغییر عرض سایدبار" : "Toggle Sidebar Collapse"}
        >
          {collapsed ? (
            isRtl ? <ChevronLeft size={12} /> : <ChevronRight size={12} />
          ) : (
            isRtl ? <ChevronRight size={12} /> : <ChevronLeft size={12} />
          )}
        </button>
      </aside>

      {/* MOBILE DRAWER (Controlled by mobileOpen) */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] md:hidden" dir={direction} ref={drawerRef}>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            {/* Sliding Drawer Panel */}
            <motion.div
              initial={{ x: isRtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? "100%" : "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className={`absolute top-0 bottom-0 ${isRtl ? "right-0" : "left-0"} w-80 max-w-[85vw] bg-[var(--card)] border-r border-l border-[var(--border)] flex flex-col shadow-2xl overflow-hidden`}
            >
              {/* Close Button floating top inner */}
              <button
                onClick={() => setMobileOpen(false)}
                className={`absolute top-4 ${isRtl ? "left-4" : "right-4"} p-1.5 rounded-full hover:bg-[var(--muted-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer outline-none focus:ring-1 focus:ring-[var(--sky-blue-500)]`}
                aria-label={isRtl ? "بستن منو" : "Close menu"}
              >
                <X size={16} />
              </button>

              {renderSidebarContents(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
