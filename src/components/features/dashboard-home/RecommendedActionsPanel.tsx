import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { useTheme } from "@/components/ThemeProvider";
import { Sparkles, ArrowRight, ArrowLeft, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/Badge";

interface RecommendedAction {
  id: string;
  action: string;
  impact: string;
  toolRoute: string;
  priority: "high" | "medium" | "low";
}

interface RecommendedActionsPanelProps {
  actions: RecommendedAction[];
  loading?: boolean;
}

export const RecommendedActionsPanel: React.FC<RecommendedActionsPanelProps> = ({
  actions = [],
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
          <Sparkles size={18} className="text-[var(--sky-blue-500)]" />
          <span>{isRtl ? "اقدامات پیشنهادی اولویت‌دار" : "Strategic Action Items"}</span>
        </CardTitle>
        <CardDescription className="text-xs text-[var(--text-secondary)]">
          {isRtl
            ? "توصیه‌های هوشمند با اثرگذاری بالا که حضور برند شما را در هسته‌های معنایی بهبود می‌دهند."
            : "Actionable recommendations formulated to elevate your brand content for retrieval engines."}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-2 flex-1 flex flex-col justify-center">
        {actions.length === 0 ? (
          <div className="text-center py-8 space-y-3 flex flex-col items-center">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
              <Trophy size={32} />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="text-xs font-bold text-[var(--text-primary)]">
                {isRtl ? "همه توصیه‌ها پیاده‌سازی شده‌اند" : "Highly Optimized Profile"}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                {isRtl
                  ? "هیچ اقدام اولویت‌داری برای بهبود هم‌بستگی رتبه وب‌سایت در این مستأجر شناسایی نشده است."
                  : "Excellent coverage! Register new target keywords to discover more opportunities."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {actions.map((item) => (
              <div
                key={item.id}
                onClick={() => navigateTo(item.toolRoute)}
                className="p-4 rounded-xl border border-[var(--border)] hover:border-[var(--sky-blue-500)]/40 bg-[var(--muted-surface)]/20 hover:bg-[var(--muted-surface)]/40 transition-all cursor-pointer flex items-start gap-3 group text-start"
              >
                <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 shrink-0 mt-0.5">
                  <Sparkles size={14} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate block">
                      {item.action}
                    </span>
                    <Badge variant={item.priority === "high" ? "success" : "info"} className="text-[9px] shrink-0 font-bold px-1.5 py-0">
                      {item.priority === "high" ? (isRtl ? "اولویت بالا" : "HIGH") : (isRtl ? "معمولی" : "STANDARD")}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)]">
                    {isRtl ? `تأثیر تقریبی: ${item.impact}` : `Estimated Impact: ${item.impact}`}
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
