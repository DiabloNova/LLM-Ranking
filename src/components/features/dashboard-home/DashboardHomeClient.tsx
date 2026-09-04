"use client";

import React, { useState, useTransition } from "react";
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Dialog } from "@/components/Dialog";
import { AlertCircle, Plus, RefreshCw, Sparkles } from "lucide-react";
import { DashboardKpiGrid } from "./DashboardKpiGrid";
const VisibilityTrendChart = dynamic(() => import("./VisibilityTrendChart").then((m) => ({ default: m.VisibilityTrendChart })), { loading: () => <div className="h-72 w-full animate-pulse rounded-xl bg-[var(--muted-surface)]" aria-label="Loading chart" /> });
import { CriticalIssuesPanel } from "./CriticalIssuesPanel";
import { RecommendedActionsPanel } from "./RecommendedActionsPanel";
import { RecentAuditsPanel } from "./RecentAuditsPanel";
import { RecentActivityPanel } from "./RecentActivityPanel";
import { DashboardSummaryData } from "@/services/dashboard-home";
import { triggerAuditAction } from "@/app/actions/audit";
import { getDashboardStatsAction } from "@/app/actions/dashboard";

interface DashboardHomeClientProps {
  initialData: DashboardSummaryData;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    workspaceId: string;
  } | null;
}

export default function DashboardHomeClient({
  initialData,
  user,
}: DashboardHomeClientProps) {
  const router = useRouter();
  const { language, direction } = useTheme();
  const isRtl = language === "fa";

  const [data, setData] = useState<DashboardSummaryData>(initialData);
  const [realStats, setRealStats] = useState<{
    totalAudits: number;
    completedAudits: number;
    seoHealth: number | "N/A";
    aiVisibility: "N/A";
    brandAuthority: "N/A";
    citationVisibility: "N/A";
    technicalHealth: number | "N/A";
    contentHealth: number | "N/A";
    competitivePosition: "N/A";
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNewAuditOpen, setIsNewAuditOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newUrlError, setNewUrlError] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchRealStats = React.useCallback(async () => {
    try {
      const stats = await getDashboardStatsAction();
      setRealStats(stats);
    } catch (err) {
      console.error("Failed to fetch real dashboard stats", err);
    }
  }, []);

  React.useEffect(() => {
    fetchRealStats();
  }, [fetchRealStats]);

  // Trigger manual refresh by calling the server API summary route or re-fetching via client
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const workspaceId = user?.workspaceId || "ws-default";

      const response = await fetch(
        `/api/v1/dashboard/summary?locale=${language}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": workspaceId,
            "x-user-id": user?.id || "usr-default",
          },
        },
      );

      if (response.ok) {
        const refreshedData = await response.json();
        setData(refreshedData);
      }

      await fetchRealStats();
    } catch (err) {
      console.error("Failed to refresh dashboard stats", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Run a real crawl/audit trigger using the Core Audit Engine
  const handleStartAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewUrlError("");

    const trimmed = newUrl.trim();
    if (!trimmed) return;

    // Validate URL protocol and hostname
    try {
      const withProto = trimmed.match(/^https?:\/\//i)
        ? trimmed
        : `https://${trimmed}`;
      const parsed = new URL(withProto);
      if (!parsed.hostname.includes(".")) {
        throw new Error();
      }
    } catch {
      setNewUrlError(
        isRtl
          ? "لطفاً یک آدرس وب‌سایت معتبر همراه با پروتکل وارد کنید (مثال: https://example.ir)."
          : "Please enter a valid website URL with protocol (e.g., https://example.com).",
      );
      return;
    }

    startTransition(async () => {
      try {
        const result = await triggerAuditAction(trimmed);

        // Automatically refresh summary metrics and navigate to results list
        setIsNewAuditOpen(false);
        setNewUrl("");
        await handleRefresh();

        // Navigate to the specific audit to see results
        if (result && result.auditId) {
          router.push(`/${language}/dashboard/audits/${result.auditId}`);
        } else {
          router.push(`/${language}/dashboard/audits`);
        }
      } catch (err: unknown) {
        setNewUrlError(
          err instanceof Error
            ? err.message
            : isRtl
              ? "ارتباط با لایه تحلیل با خطا مواجه شد."
              : "Error communicating with crawling layer.",
        );
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in text-start" dir={direction}>
      {/* 1. Executive Welcome Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 pb-5 border-b border-[var(--border)]">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black tracking-normal text-[var(--text-primary)] font-display flex items-center gap-2">
            <span>
              {isRtl
                ? `داشبورد هوشمندی برند، ${user?.name || "کاربر گرامی"}`
                : `Brand Intelligence Suite, ${user?.name || "Guest"}`}
            </span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {isRtl
              ? "پایش یکپارچه سهم حضور برند شما در موتورهای پاسخ‌گویی هوش مصنوعی، کیفیت ارجاعات و سلامت فنی دامنه‌ها."
              : "Consolidated intelligence workspace to protect your prominence inside generative retrieval models."}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? "animate-spin" : ""}
            />
            <span>{isRtl ? "بروزرسانی آمار" : "Refresh"}</span>
          </Button>

          <Button
            onClick={() => setIsNewAuditOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] text-white hover:opacity-95 border-0 shadow-lg"
          >
            <Plus size={16} />
            <span>{isRtl ? "پایش دامنه جدید" : "Run Brand Audit"}</span>
          </Button>
        </div>
      </div>

      {/* 2. Executive KPI Layer */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase text-[var(--text-muted)] tracking-wider">
          {isRtl ? "شاخص‌های کلیدی عملکرد اجرایی" : "Executive KPI Layer"}
        </h2>
        <DashboardKpiGrid
          seoHealth={realStats?.seoHealth ?? data.seoHealth}
          aiVisibility={realStats?.aiVisibility ?? data.aiVisibility}
          brandAuthority={realStats?.brandAuthority ?? data.brandAuthority}
          citationVisibility={realStats?.citationVisibility ?? data.citationVisibility}
          technicalHealth={realStats?.technicalHealth ?? data.technicalHealth}
          contentHealth={realStats?.contentHealth ?? data.contentHealth}
          competitivePosition={realStats?.competitivePosition ?? data.competitivePosition}
          loading={isRefreshing || !realStats}
        />
      </div>

      {/* 3. Intelligence Layer (Visibility Trends) */}
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase text-[var(--text-muted)] tracking-wider">
            {isRtl ? "لایه هوشمندی و روند تغییرات" : "Intelligence Layer"}
          </h2>
          <VisibilityTrendChart
            data={data.visibilityTrends}
            loading={isRefreshing}
          />
        </div>
      </div>

      {/* 4. Action Layer (Critical Issues & Recommended Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase text-[var(--text-muted)] tracking-wider">
            {isRtl
              ? "مشکلات بحرانی و با اولویت بالا"
              : "Action Layer — Critical Issues"}
          </h2>
          <CriticalIssuesPanel
            issues={data.criticalIssues}
            loading={isRefreshing}
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase text-[var(--text-muted)] tracking-wider">
            {isRtl
              ? "اقدامات و اولویت‌های بهبود استراتژیک"
              : "Action Layer — Recommended Actions"}
          </h2>
          <RecommendedActionsPanel
            actions={data.recommendedActions}
            loading={isRefreshing}
          />
        </div>
      </div>

      {/* 5. Activity Layer (Recent Audits & Recent Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase text-[var(--text-muted)] tracking-wider">
            {isRtl
              ? "آخرین پایش‌های ثبت شده دامنه‌ها"
              : "Activity Layer — Recent Audits"}
          </h2>
          <RecentAuditsPanel
            audits={data.recentAudits}
            loading={isRefreshing}
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase text-[var(--text-muted)] tracking-wider">
            {isRtl
              ? "جریان بلادرنگ فعالیت‌های فضای کاربری"
              : "Activity Layer — Recent Activities"}
          </h2>
          <RecentActivityPanel
            activities={data.recentActivity}
            loading={isRefreshing}
          />
        </div>
      </div>

      {/* CRAWL BRAND AUDIT DIALOG */}
      <Dialog
        isOpen={isNewAuditOpen}
        onClose={() => setIsNewAuditOpen(false)}
        title={
          isRtl
            ? "اجرای پایش و تحلیل کامل معنایی"
            : "Crawl & Run New Brand Audit"
        }
      >
        <form onSubmit={handleStartAudit} className="space-y-4 text-start">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {isRtl
              ? "آدرس وب‌سایت اصلی یا صفحه لندینگ برند خود را وارد کنید. سیستم به صورت خودکار فرآیند خزش عمیق، استخراج تگ‌های اسکیما و سنجش کیفیت محتوا را آغاز می‌کند."
              : "Enter your primary root website or landing page. Conversational crawlers will crawl, index, and score model discoverability."}
          </p>

          <Input
            label={
              isRtl
                ? "آدرس کامل وب‌سایت همراه با پروتکل"
                : "Target Website Address with Protocol"
            }
            placeholder="https://company.ir"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            disabled={isPending}
            required
          />

          {newUrlError && (
            <div
              className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2"
              role="alert"
            >
              <AlertCircle size={14} className="shrink-0" />
              <span className="font-bold">{newUrlError}</span>
            </div>
          )}

          <div className="flex items-center gap-3 justify-end pt-4 border-t border-[var(--border)]">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsNewAuditOpen(false)}
              disabled={isPending}
            >
              {isRtl ? "انصراف" : "Cancel"}
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isPending || !newUrl.trim()}
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-1.5" />
                  <span>
                    {isRtl
                      ? "در حال اجرای فرآیند خزش..."
                      : "Executing Scrape..."}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>{isRtl ? "اجرای پایش و خزش" : "Run Full Crawl"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
