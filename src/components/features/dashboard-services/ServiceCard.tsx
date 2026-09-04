"use client";

import React from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { MarketplaceItem, CATEGORY_ICONS } from "@/services/dashboard-services";
import { Check, ArrowRight, ArrowLeft, Info, Eye, Sparkles } from "lucide-react";

interface ServiceCardProps {
  item: MarketplaceItem;
  onPreview: (item: MarketplaceItem) => void;
  onUpgrade: () => void;
  onNavigate: (route: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  item,
  onPreview,
  onUpgrade,
  onNavigate
}) => {
  const { language } = useTheme();
  const isRtl = language === "fa";
  const { service, entitlement, usage } = item;

  const IconComp = CATEGORY_ICONS[service.category] || Info;

  const name = isRtl ? service.nameFa : service.nameEn;
  const description = isRtl ? service.descFa : service.descEn;

  // Status badge styling and text
  const getStatusBadge = () => {
    switch (entitlement.status) {
      case "AVAILABLE":
        return (
          <Badge variant="success" className="text-[10px] font-black uppercase">
            {isRtl ? "فعال" : "Available"}
          </Badge>
        );
      case "PREMIUM":
        return (
          <Badge variant="warning" className="text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border-amber-500/20">
            {isRtl ? "پریمیوم" : "Premium"}
          </Badge>
        );
      case "LOCKED":
        return (
          <Badge className="text-[10px] font-black uppercase bg-rose-500/10 text-rose-400 border-rose-500/20">
            {isRtl ? "قفل شده" : "Locked"}
          </Badge>
        );
      case "UNAVAILABLE":
        return (
          <Badge className="text-[10px] font-black uppercase bg-slate-500/10 text-slate-400 border-slate-500/20">
            {isRtl ? "غیرفعال" : "Unavailable"}
          </Badge>
        );
      default:
        return (
          <Badge className="text-[10px] font-black uppercase bg-sky-500/10 text-sky-400 border-sky-500/20">
            {isRtl ? "بزودی" : "Coming Soon"}
          </Badge>
        );
    }
  };

  // Get primary button render
  const renderPrimaryButton = () => {
    const isExhausted = usage && usage.limit !== null && usage.used >= usage.limit;

    if (entitlement.status === "AVAILABLE") {
      if (isExhausted) {
        return (
          <Button
            variant="outline"
            className="w-full text-xs font-bold gap-2 cursor-pointer border-amber-500/30 text-amber-500 hover:bg-amber-500/5"
            onClick={onUpgrade}
          >
            <span>{isRtl ? "افزایش سقف مصرف" : "Increase Quota"}</span>
            {isRtl ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
          </Button>
        );
      }
      return (
        <Button
          variant="primary"
          className="w-full text-xs font-bold gap-2 cursor-pointer bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--sky-blue-600)] text-white hover:opacity-95"
          onClick={() => onNavigate(service.route)}
        >
          <span>{isRtl ? "ورود به ابزار" : "Open Tool"}</span>
          {isRtl ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
        </Button>
      );
    }

    if (entitlement.status === "PREMIUM" || entitlement.status === "LOCKED") {
      return (
        <Button
          variant="primary"
          className="w-full text-xs font-bold gap-2 cursor-pointer bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] text-white hover:opacity-95 shadow-md border-0"
          onClick={onUpgrade}
        >
          <Sparkles size={13} />
          <span>{isRtl ? "ارتقای اشتراک" : "Upgrade Plan"}</span>
        </Button>
      );
    }

    return (
      <Button
        variant="outline"
        className="w-full text-xs font-bold gap-2 cursor-pointer opacity-50"
        disabled
      >
        <span>{isRtl ? "غیرقابل دسترس" : "Unavailable"}</span>
      </Button>
    );
  };

  // Render Usage Balance
  const renderUsageIndicator = () => {
    if (entitlement.status !== "AVAILABLE" || !usage) return null;

    const isUnlimited = usage.limit === null;
    const isExhausted = !isUnlimited && usage.limit !== null && usage.used >= usage.limit;
    const isNearLimit = !isUnlimited && usage.limit !== null && usage.used >= usage.limit * 0.8;

    return (
      <div className="space-y-1.5 pt-3 border-t border-[var(--border)]">
        <div className="flex justify-between items-center text-[10px] font-bold text-[var(--text-secondary)]">
          <span>{isRtl ? "میزان مصرف اشتراک" : "Monthly Usage"}</span>
          <span className="font-mono">
            {isUnlimited
              ? (isRtl ? "نامحدود" : "Unlimited")
              : `${usage.used} / ${usage.limit}`}
          </span>
        </div>

        {!isUnlimited && (
          <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isExhausted
                  ? "bg-rose-500"
                  : isNearLimit
                  ? "bg-amber-500"
                  : "bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--sky-blue-400)]"
              }`}
              style={{ width: `${Math.min(usage.percentage, 100)}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="flex flex-col justify-between border border-[var(--border)] bg-[var(--card)] hover:border-[var(--sky-blue-500)]/40 hover:shadow-lg transition-all duration-300 text-start group h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="p-2 bg-[var(--muted-surface)] rounded-xl border border-[var(--border)] text-[var(--sky-blue-500)] group-hover:text-[var(--orange-500)] transition-colors duration-300">
            <IconComp size={18} />
          </div>
          {getStatusBadge()}
        </div>

        <div className="mt-3 space-y-1">
          <CardTitle className="text-sm font-black text-[var(--text-primary)] group-hover:text-[var(--sky-blue-500)] transition-colors">
            {name}
          </CardTitle>
          <CardDescription className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed min-h-[36px]">
            {description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4 flex-1 flex flex-col justify-end">
        {/* Core Included Features Checklist */}
        <div className="space-y-1.5 py-1">
          {service.features.map((feat) => (
            <div key={feat.id} className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-semibold">
              <Check size={11} className="text-emerald-500 shrink-0" />
              <span className="truncate">{isRtl ? feat.nameFa : feat.nameEn}</span>
            </div>
          ))}
        </div>

        {/* Usage Section */}
        {renderUsageIndicator()}

        {/* Buttons Row */}
        <div className="grid grid-cols-5 gap-2 pt-2">
          <div className="col-span-4">
            {renderPrimaryButton()}
          </div>
          <Button
            variant="outline"
            className="col-span-1 p-0 flex items-center justify-center cursor-pointer hover:bg-[var(--muted-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border)]"
            title={isRtl ? "پیش‌نمایش ابزار" : "Preview Features"}
            onClick={() => onPreview(item)}
          >
            <Eye size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
