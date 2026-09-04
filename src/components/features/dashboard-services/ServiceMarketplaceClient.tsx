"use client";

import React, { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import {
  MarketplaceItem,
  CATEGORIES
} from "@/services/dashboard-services";
import { ServiceCard } from "./ServiceCard";
import { ServicePreviewModal } from "./ServicePreviewModal";
import {
  Search,
  Filter,
  RefreshCw,
  LayoutGrid,
  X
} from "lucide-react";

interface ServiceMarketplaceClientProps {
  initialItems: MarketplaceItem[];
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    workspaceId: string;
  } | null;
  activePlan: "free" | "professional" | "enterprise";
}

export default function ServiceMarketplaceClient({
  initialItems,
  user: _user,
  activePlan
}: ServiceMarketplaceClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, direction } = useTheme();
  const isRtl = language === "fa";

  // Search, Category and Status filter states
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "");
  const [activeCategory, setActiveCategory] = useState<string>(searchParams?.get("category") || "all");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams?.get("status") || "all");

  const [isPending, startTransition] = useTransition();
  const isRefreshing = isPending;

  // Selected item for preview details
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<MarketplaceItem | null>(null);

  // Sync state back to URL query parameters safely without throwing hydration mismatches
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (statusFilter !== "all") params.set("status", statusFilter);

    const paramsStr = params.toString();
    const targetUrl = `/${language}/dashboard/services${paramsStr ? `?${paramsStr}` : ""}`;
    window.history.replaceState(null, "", targetUrl);
  }, [searchQuery, activeCategory, statusFilter, language]);

  // Handle Refreshing/Synchronizing Marketplace data by triggering server-side recalculation
  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  // Filter computation - Case insensitive over name, description, category, and features
  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      const { service, entitlement } = item;

      // 1. Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = service.nameEn.toLowerCase().includes(query) || service.nameFa.includes(query);
        const matchesDesc = service.descEn.toLowerCase().includes(query) || service.descFa.includes(query);
        const matchesCat = service.category.toLowerCase().includes(query);
        const matchesFeatures = service.features.some(
          (f) => f.nameEn.toLowerCase().includes(query) || f.nameFa.includes(query)
        );

        if (!matchesName && !matchesDesc && !matchesCat && !matchesFeatures) {
          return false;
        }
      }

      // 2. Category tab filter
      if (activeCategory !== "all" && service.category !== activeCategory) {
        return false;
      }

      // 3. Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "available" && entitlement.status !== "AVAILABLE") {
          return false;
        }
        if (statusFilter === "premium" && entitlement.status !== "PREMIUM" && entitlement.status !== "LOCKED") {
          return false;
        }
        if (statusFilter === "unavailable" && entitlement.status !== "UNAVAILABLE" && entitlement.status !== "COMING_SOON") {
          return false;
        }
      }

      return true;
    });
  }, [initialItems, searchQuery, activeCategory, statusFilter]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setActiveCategory("all");
    setStatusFilter("all");
  };

  const handleUpgradeNavigation = () => {
    router.push(`/${language}/dashboard/billing`);
  };

  const handleServiceNavigation = (route: string) => {
    router.push(`/${language}${route}`);
  };

  const strings = {
    title: isRtl ? "بازارچه خدمات و ابزارهای هوشمند" : "Service Marketplace & Core Tools",
    desc: isRtl
      ? "پلتفرم ابزارهای کراولر، مدیریت دانش، سنجش سهم حضور در هوش مصنوعی و بهینه‌سازی فنی سئو در یک نگاه."
      : "Discover, analyze, and manage powerful SaaS analytics engines, entity crawlers, and AI prominence indicators.",
    searchPlaceholder: isRtl ? "جستجوی ابزار، قابلیت، نام انگلیسی یا فارسی..." : "Search services, features, keywords...",
    categoryAll: isRtl ? "همه ابزارها" : "All Services",
    statusLabel: isRtl ? "فیلتر وضعیت:" : "Status:",
    statusAll: isRtl ? "همه وضعیت‌ها" : "All Statuses",
    statusAvailable: isRtl ? "فعال و در دسترس" : "Available",
    statusPremium: isRtl ? "پریمیوم / قفل شده" : "Premium & Locked",
    statusUnavailable: isRtl ? "غیرفعال / سفارشی" : "Unavailable",
    emptyTitle: isRtl ? "هیچ ابزاری با این مشخصات یافت نشد" : "No Services Match Your Filters",
    emptyDesc: isRtl
      ? "تغییراتی در عبارت جستجو یا دسته‌بندی فیلترها اعمال کنید تا ابزارهای منطبق نمایش داده شوند."
      : "Try relaxing your search query or reset category tab selections to view available tools.",
    emptyBtn: isRtl ? "پاک کردن فیلترها" : "Reset Active Filters",
    refreshTooltip: isRtl ? "بروزرسانی داده‌های بازارچه" : "Refresh catalog state",
    activePlanLabel: isRtl ? "پلن فعال فعلی شما:" : "Active Workspace Tier:",
    tierFree: isRtl ? "رایگان (Free Tier)" : "Free Plan",
    tierPro: isRtl ? "حرفه‌ای (Professional Plan)" : "Professional Plan",
    tierEnt: isRtl ? "سازمانی (Enterprise Plan)" : "Enterprise Plan"
  };

  // Determine current active plan name for display
  const currentPlanName = useMemo(() => {
    if (activePlan === "enterprise") {
      return strings.tierEnt;
    }
    if (activePlan === "professional") {
      return strings.tierPro;
    }
    return strings.tierFree;
  }, [activePlan, strings.tierEnt, strings.tierPro, strings.tierFree]);

  return (
    <div className="space-y-8 animate-fade-in text-start" dir={direction}>

      {/* 1. Header Area with Upgrade Banner info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pb-5 border-b border-[var(--border)]">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-[var(--text-primary)] font-display tracking-normal flex items-center gap-2">
            <span>{strings.title}</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {strings.desc}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0 bg-[var(--muted-surface)] p-2.5 rounded-xl border border-[var(--border)]">
          <div className="text-start">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {strings.activePlanLabel}
            </p>
            <p className="text-xs font-black text-[var(--sky-blue-500)]">
              {currentPlanName}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 h-auto"
            title={strings.refreshTooltip}
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Search Input Box */}
        <div className="relative flex-1 max-w-xl">
          <Search
            size={16}
            className={`absolute top-1/2 -translate-y-1/2 ${
              isRtl ? "right-4" : "left-4"
            } text-[var(--text-muted)]`}
          />
          <input
            type="text"
            className={`w-full bg-[var(--card)] border border-[var(--border)] focus:border-[var(--sky-blue-500)] rounded-xl py-3 ${
              isRtl ? "pr-12 pl-4" : "pl-12 pr-4"
            } text-xs outline-none transition-all placeholder-[var(--text-muted)] text-[var(--text-primary)] font-semibold shadow-sm focus:ring-1 focus:ring-[var(--sky-blue-500)]/20`}
            placeholder={strings.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={`absolute top-1/2 -translate-y-1/2 ${
                isRtl ? "left-4" : "right-4"
              } text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded-full hover:bg-[var(--muted-surface)]`}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Select dropdown filter */}
        <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto text-xs font-semibold">
          <span className="text-[var(--text-secondary)] whitespace-nowrap">{strings.statusLabel}</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[var(--card)] border border-[var(--border)] hover:border-[var(--sky-blue-500)]/40 rounded-xl px-4 py-2.5 outline-none text-xs text-[var(--text-primary)] font-bold cursor-pointer transition-all shadow-sm focus:ring-1 focus:ring-[var(--sky-blue-500)]/20"
          >
            <option value="all">{strings.statusAll}</option>
            <option value="available">{strings.statusAvailable}</option>
            <option value="premium">{strings.statusPremium}</option>
            <option value="unavailable">{strings.statusUnavailable}</option>
          </select>
        </div>
      </div>

      {/* 3. Category Navigation Tabs */}
      <div className="border-b border-[var(--border)] overflow-x-auto scrollbar-none flex gap-2 pb-0.5">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer outline-none focus:text-[var(--sky-blue-500)]
            ${activeCategory === "all"
              ? "border-[var(--sky-blue-500)] text-[var(--sky-blue-500)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
        >
          {strings.categoryAll}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer outline-none focus:text-[var(--sky-blue-500)]
              ${activeCategory === cat.id
                ? "border-[var(--sky-blue-500)] text-[var(--sky-blue-500)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
          >
            {isRtl ? cat.labelFa : cat.labelEn}
          </button>
        ))}
      </div>

      {/* 4. Active Filters Summary Indicator */}
      {(searchQuery || activeCategory !== "all" || statusFilter !== "all") && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-[var(--muted-surface)] rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)]">
          <Filter size={13} className="text-[var(--sky-blue-500)] shrink-0" />
          <span>
            {isRtl
              ? `فیلترهای فعال: یافتن ${filteredItems.length} ابزار منطبق`
              : `Active filters: Found ${filteredItems.length} matching tools`}
          </span>

          <div className="flex flex-wrap items-center gap-1.5 ml-auto rtl:mr-auto rtl:ml-0 pt-1.5 sm:pt-0">
            {searchQuery && (
              <Badge variant="neutral" className="text-[10px] gap-1 px-2 py-0.5">
                <span>&quot;{searchQuery}&quot;</span>
                <X size={10} className="cursor-pointer text-[var(--text-muted)]" onClick={() => setSearchQuery("")} />
              </Badge>
            )}
            {activeCategory !== "all" && (
              <Badge variant="neutral" className="text-[10px] gap-1 px-2 py-0.5">
                <span>{isRtl ? CATEGORIES.find(c => c.id === activeCategory)?.labelFa : CATEGORIES.find(c => c.id === activeCategory)?.labelEn}</span>
                <X size={10} className="cursor-pointer text-[var(--text-muted)]" onClick={() => setActiveCategory("all")} />
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="neutral" className="text-[10px] gap-1 px-2 py-0.5">
                <span>
                  {statusFilter === "available"
                    ? strings.statusAvailable
                    : statusFilter === "premium"
                    ? strings.statusPremium
                    : strings.statusUnavailable}
                </span>
                <X size={10} className="cursor-pointer text-[var(--text-muted)]" onClick={() => setStatusFilter("all")} />
              </Badge>
            )}
            <Button variant="outline" className="text-[10px] h-auto py-1 px-2.5 font-bold cursor-pointer" onClick={handleClearFilters}>
              {strings.emptyBtn}
            </Button>
          </div>
        </div>
      )}

      {/* 5. Service Grid & Cards */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.service.id} className="h-full">
              <ServiceCard
                item={item}
                onPreview={(selected) => setSelectedPreviewItem(selected)}
                onUpgrade={handleUpgradeNavigation}
                onNavigate={handleServiceNavigation}
              />
            </div>
          ))}
        </div>
      ) : (
        <Card className="min-h-[300px] flex flex-col justify-center items-center p-8 border border-[var(--border)] bg-[var(--card)] text-center space-y-4">
          <div className="p-4 bg-[var(--muted-surface)] text-[var(--text-muted)] rounded-full border border-[var(--border)]">
            <LayoutGrid size={36} />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-base font-black text-[var(--text-primary)] font-display tracking-normal">
              {strings.emptyTitle}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {strings.emptyDesc}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleClearFilters}
            className="text-xs font-bold px-6 cursor-pointer bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--sky-blue-600)]"
          >
            <span>{strings.emptyBtn}</span>
          </Button>
        </Card>
      )}

      {/* FEATURE PREVIEW MODAL */}
      <ServicePreviewModal
        isOpen={selectedPreviewItem !== null}
        onClose={() => setSelectedPreviewItem(null)}
        item={selectedPreviewItem}
        onUpgrade={handleUpgradeNavigation}
        onNavigate={handleServiceNavigation}
      />
    </div>
  );
}
