import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { useTheme } from "@/components/ThemeProvider";
import { Activity, Clock, Terminal } from "lucide-react";

interface ActivityLog {
  id: string;
  actionType: string;
  description: string;
  time: string;
}

interface RecentActivityPanelProps {
  activities: ActivityLog[];
  loading?: boolean;
}

export const RecentActivityPanel: React.FC<RecentActivityPanelProps> = ({
  activities = [],
  loading = false,
}) => {
  const { language } = useTheme();
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

  return (
    <Card className="border border-[var(--border)] bg-[var(--card)] flex flex-col justify-between">
      <CardHeader className="text-start">
        <CardTitle className="text-base font-black flex items-center gap-2 text-[var(--text-primary)] font-display">
          <Activity size={18} className="text-[var(--sky-blue-500)]" />
          <span>{isRtl ? "آخرین فعالیت‌های فضای کاری" : "Workspace Activities Stream"}</span>
        </CardTitle>
        <CardDescription className="text-xs text-[var(--text-secondary)]">
          {isRtl
            ? "جریان بلادرنگ رویدادها، تغییرات امنیتی و پرس‌وجو‌های اجرا شده در لایه استناد."
            : "Real-time feed of background crawl tasks, API runs, and diagnostic actions."}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-2 flex-1 flex flex-col justify-center">
        {activities.length === 0 ? (
          <div className="text-center py-8 space-y-3 flex flex-col items-center">
            <div className="p-3 bg-[var(--muted-surface)] text-[var(--text-muted)] rounded-full border border-[var(--border)]">
              <Activity size={32} />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="text-xs font-bold text-[var(--text-primary)]">
                {isRtl ? "هیچ فعالیتی ثبت نشده است" : "Stream is Currently Empty"}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                {isRtl
                  ? "فعالیت اخیری در ارتباط با این مستأجر شناسایی نگردید. با اجرای پرس‌وجو یا اسکن، رویدادها در این بخش ظاهر می‌شوند."
                  : "No platform activities tracked for this organization. Activities appear as you audit pages."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 text-start"
              >
                <div className="p-1.5 rounded-lg bg-[var(--muted-surface)] border border-[var(--border)] text-[var(--text-secondary)] shrink-0 mt-0.5">
                  <Terminal size={12} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs font-medium text-[var(--text-primary)] leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] font-semibold">
                    <Clock size={11} />
                    <span>{item.time}</span>
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
