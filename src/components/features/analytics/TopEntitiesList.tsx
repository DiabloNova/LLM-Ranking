"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/components/ThemeProvider";
import { Award, ShieldAlert, Cpu, Box } from "lucide-react";

interface EntityData {
  name: string;
  type: string;
  mentionCount: number;
}

interface TopEntitiesListProps {
  data: EntityData[];
  loading?: boolean;
}

/**
 * Premium glassmorphic Top Entities List component.
 * Displays top entities with localized badges, mention counts, and relative fill progress bars.
 */
export const TopEntitiesList: React.FC<TopEntitiesListProps> = ({
  data,
  loading = false,
}) => {
  const { language } = useTheme();

  if (loading) {
    return (
      <Card className="h-full min-h-[350px]">
        <CardHeader>
          <div className="h-4 w-48 bg-white/5 rounded animate-pulse mb-2" />
          <div className="h-3 w-64 bg-white/5 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-1/3 bg-white/5 rounded animate-pulse" />
                <div className="h-3 w-12 bg-white/5 rounded animate-pulse" />
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const isRtl = language === "fa";
  const maxCount = data.length > 0 ? Math.max(...data.map((item) => item.mentionCount)) : 100;

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "brand":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <Award size={10} />
            <span>{isRtl ? "برند" : "Brand"}</span>
          </Badge>
        );
      case "model":
        return (
          <Badge variant="info" className="flex items-center gap-1">
            <Cpu size={10} />
            <span>{isRtl ? "مدل" : "Model"}</span>
          </Badge>
        );
      case "competitor":
        return (
          <Badge variant="error" className="flex items-center gap-1">
            <ShieldAlert size={10} />
            <span>{isRtl ? "رقیب" : "Competitor"}</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" className="flex items-center gap-1">
            <Box size={10} />
            <span>{type}</span>
          </Badge>
        );
    }
  };

  return (
    <Card className="h-full min-h-[350px]">
      <CardHeader>
        <CardTitle>
          {isRtl ? "موجودیت‌های پرتکرار" : "Top Extracted Entities"}
        </CardTitle>
        <CardDescription>
          {isRtl
            ? "بیشترین کلیدواژه‌ها و مفاهیمی که با نام برند پیوند یافته‌اند."
            : "The most frequent semantic entities crawled and linked in recent observations."}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-4 space-y-5">
        {data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-[var(--text-muted)] italic">
            {isRtl ? "موجودیت پرتکراری یافت نشد" : "No entities found"}
          </div>
        ) : (
          data.map((item, idx) => {
            const percentage = Math.round((item.mentionCount / maxCount) * 100);
            return (
              <div key={idx} className="space-y-1.5 group">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text-primary)] group-hover:text-[#1F76F9] transition-colors">
                      {item.name}
                    </span>
                    {getTypeBadge(item.type)}
                  </div>
                  <span className="text-[var(--text-muted)] font-display font-medium">
                    {item.mentionCount.toLocaleString()} {isRtl ? "ارجاع" : "mentions"}
                  </span>
                </div>
                {/* Horizontal Progress Bar */}
                <div className="h-1.5 w-full bg-white/[0.02] border border-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-[#1F76F9] to-[#FF6F41]"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
