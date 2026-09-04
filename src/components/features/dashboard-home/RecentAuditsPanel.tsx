import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { useTheme } from "@/components/ThemeProvider";
import { FileText, ArrowRight, ArrowLeft, Calendar, Globe, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

interface RecentAudit {
  id: string;
  url: string;
  score: number;
  grade: string;
  createdAt: string;
  status: string;
  crawledPages: number;
}

interface RecentAuditsPanelProps {
  audits: RecentAudit[];
  loading?: boolean;
}

export const RecentAuditsPanel: React.FC<RecentAuditsPanelProps> = ({
  audits = [],
  loading = false,
}) => {
  const { language } = useTheme();
  const router = useRouter();
  const isRtl = language === "fa";

  if (loading) {
    return (
      <Card className="border border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <div className="h-4 w-48 bg-[var(--muted-surface)] rounded animate-pulse mb-2" />
          <div className="h-3 w-80 bg-[var(--muted-surface)] rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[var(--muted-surface)]/40 rounded-xl animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const navigateToAudit = (item: RecentAudit) => {
    router.push(`/${language}/dashboard/audits/${item.id}?url=${encodeURIComponent(item.url)}&score=${item.score}`);
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    if (isRtl) {
      return d.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
    }
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 70) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-rose-500 bg-rose-500/10 border-rose-500/20";
  };

  return (
    <Card className="border border-[var(--border)] bg-[var(--card)] flex flex-col justify-between">
      <CardHeader className="text-start">
        <CardTitle className="text-base font-black flex items-center gap-2 text-[var(--text-primary)] font-display">
          <FileText size={18} className="text-[var(--sky-blue-500)]" />
          <span>{isRtl ? "پایش‌های اخیر دامنه‌ها" : "Recent Brand Audits"}</span>
        </CardTitle>
        <CardDescription className="text-xs text-[var(--text-secondary)]">
          {isRtl
            ? "مرور آخرین ارزیابی‌های فنی و گزارش‌های خزش معنایی انجام شده در محیط کاربری."
            : "Review technical and entity analysis logs captured from your historical crawl triggers."}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-2 flex-1 flex flex-col justify-center">
        {audits.length === 0 ? (
          <div className="text-center py-8 space-y-3 flex flex-col items-center">
            <div className="p-3 bg-[var(--muted-surface)] text-[var(--text-muted)] rounded-full border border-[var(--border)]">
              <FileText size={32} />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="text-xs font-bold text-[var(--text-primary)]">
                {isRtl ? "هیچ اسکن یا پایشی انجام نشده" : "No Registered Audits"}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                {isRtl
                  ? "وب‌سایتی برای تحلیل ثبت نگردیده است. پایش اول را برای استخراج آمار سئو آغاز کنید."
                  : "No crawl logs exist for this workspace. Run an audit to generate structural summaries."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {audits.map((item) => (
              <div
                key={item.id}
                onClick={() => navigateToAudit(item)}
                className="p-4 rounded-xl border border-[var(--border)] hover:border-[var(--sky-blue-500)]/40 bg-[var(--muted-surface)]/20 hover:bg-[var(--muted-surface)]/40 transition-all cursor-pointer flex items-center justify-between gap-3 group text-start"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Globe size={13} className="text-[var(--text-muted)]" />
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate block" title={item.url}>
                      {item.url}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-[var(--text-secondary)] font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} className="text-[var(--text-muted)]" />
                      {formatDate(item.createdAt)}
                    </span>
                    <span>•</span>
                    <span>{isRtl ? `${item.crawledPages} صفحه` : `${item.crawledPages} pgs`}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${getScoreColor(item.score)}`}>
                    {item.score}%
                  </span>
                  <div className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                    {isRtl ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
