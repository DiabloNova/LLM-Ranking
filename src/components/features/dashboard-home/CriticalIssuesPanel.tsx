import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { useTheme } from "@/components/ThemeProvider";
import { AlertCircle, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/Badge";

interface CriticalIssue {
  id: string;
  issue: string;
  impact: string;
  resolvedByRoute: string;
  priority: "high" | "medium";
}

interface CriticalIssuesPanelProps {
  issues: CriticalIssue[];
  loading?: boolean;
}

export const CriticalIssuesPanel: React.FC<CriticalIssuesPanelProps> = ({
  issues = [],
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

  const navigateTo = (route: string) => {
    router.push(`/${language}${route}`);
  };

  return (
    <Card className="border border-[var(--border)] bg-[var(--card)] flex flex-col justify-between">
      <CardHeader className="text-start">
        <CardTitle className="text-base font-black flex items-center gap-2 text-[var(--text-primary)] font-display">
          <AlertCircle size={18} className="text-[var(--color-error)]" />
          <span>{isRtl ? "مسائل و مشکلات بحرانی" : "Critical Workspace Issues"}</span>
        </CardTitle>
        <CardDescription className="text-xs text-[var(--text-secondary)]">
          {isRtl
            ? "لیستی از مغایرت‌های فنی و معنایی با اولویت بالا که سهم حضور برند شما را تهدید می‌کنند."
            : "Prioritized high-impact technical or entity anomalies requiring immediate resolution."}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-2 flex-1 flex flex-col justify-center">
        {issues.length === 0 ? (
          <div className="text-center py-8 space-y-3 flex flex-col items-center">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
              <CheckCircle2 size={32} />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="text-xs font-bold text-[var(--text-primary)]">
                {isRtl ? "هیچ مشکل بحرانی شناسایی نشد" : "All Systems Fully Optimized"}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                {isRtl
                  ? "سلامت وب‌سایت شما در شرایط مطلوبی قرار دارد یا پایش جدیدی اجرا نشده است."
                  : "No critical search retrieval issues detected. Run audits to scan your pages."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {issues.map((item) => (
              <div
                key={item.id}
                onClick={() => navigateTo(item.resolvedByRoute)}
                className="p-4 rounded-xl border border-[var(--border)] hover:border-[var(--sky-blue-500)]/40 bg-[var(--muted-surface)]/20 hover:bg-[var(--muted-surface)]/40 transition-all cursor-pointer flex items-start gap-3 group text-start"
              >
                <div className="p-1.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/10 shrink-0 mt-0.5">
                  <AlertCircle size={14} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate block">
                      {item.issue}
                    </span>
                    <Badge variant={item.priority === "high" ? "error" : "warning"} className="text-[9px] shrink-0 font-bold px-1.5 py-0">
                      {item.priority === "high" ? (isRtl ? "فوری" : "CRITICAL") : (isRtl ? "متوسط" : "WARNING")}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)]">
                    {isRtl ? `تأثیر: ${item.impact}` : `Impact: ${item.impact}`}
                  </p>
                </div>
                <div className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors self-center">
                  {isRtl ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
