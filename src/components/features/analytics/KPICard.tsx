import React from "react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string | number;
  changeType?: "success" | "error" | "warning" | "info";
  description?: string;
  icon?: LucideIcon;
  loading?: boolean;
}

/**
 * Premium glassmorphic KPI Card component.
 * Displays key metrics with trend indicators and Lucide icons.
 */
export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeType = "info",
  description,
  icon: Icon,
  loading = false,
}) => {
  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-3 w-2/3 skeleton rounded" />
            <div className="h-8 w-1/2 skeleton rounded" />
          </div>
          <div className="w-10 h-10 skeleton rounded-lg" />
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="h-5 w-12 skeleton rounded-full" />
          <div className="h-3 w-20 skeleton rounded" />
        </div>
      </Card>
    );
  }

  const isPositive = changeType === "success";
  const isNegative = changeType === "error";

  return (
    <Card hoverable className="h-full flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
            {title}
          </span>
          <span className="text-2xl font-black text-[var(--text-primary)] block font-display tracking-tight">
            {value}
          </span>
        </div>
        {Icon && (
          <div className="p-2.5 bg-[var(--color-info-bg)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--color-primary-600)]">
            <Icon size={18} className="rtl:-scale-x-100" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] gap-2">
        {change && (
          <Badge variant={changeType}>
            <span className="flex items-center gap-0.5">
              {isPositive && <ArrowUpRight size={12} />}
              {isNegative && <ArrowDownRight size={12} />}
              {change}
            </span>
          </Badge>
        )}
        {description && (
          <span className="text-[var(--text-muted)] truncate max-w-[150px] text-end">
            {description}
          </span>
        )}
      </div>
    </Card>
  );
};
