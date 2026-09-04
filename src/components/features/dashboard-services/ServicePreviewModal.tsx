"use client";

import React from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/Button";
import { MarketplaceItem, CATEGORY_ICONS } from "@/services/dashboard-services";
import { CheckCircle2, Sparkles, Terminal, Info } from "lucide-react";

interface ServicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MarketplaceItem | null;
  onUpgrade: () => void;
  onNavigate: (route: string) => void;
}

export const ServicePreviewModal: React.FC<ServicePreviewModalProps> = ({
  isOpen,
  onClose,
  item,
  onUpgrade,
  onNavigate
}) => {
  const { language, direction } = useTheme();
  const isRtl = language === "fa";

  if (!item) return null;

  const { service, entitlement } = item;
  const name = isRtl ? service.nameFa : service.nameEn;
  const desc = isRtl ? service.descFa : service.descEn;
  const IconComp = CATEGORY_ICONS[service.category] || Info;

  const strings = {
    featuresTitle: isRtl ? "قابلیت‌های فنی و امکانات کلیدی" : "Key Capabilities & Technical Features",
    requirements: isRtl ? "پیش‌نیازهای دسترسی و لایسنس" : "Access Tier & Resource Allocations",
    tierLabel: isRtl ? "پلن مورد نیاز:" : "Required Plan:",
    statusLabel: isRtl ? "وضعیت دسترسی فعلی شما:" : "Your Access Status:",
    ctaOpen: isRtl ? "ورود به ابزار" : "Open Tool",
    ctaUpgrade: isRtl ? "ارتقای اشتراک و فعال‌سازی" : "Upgrade Plan to Unlock",
    demoWorkflow: isRtl ? "نمونه جریان کاری (Workflow)" : "Typical Enterprise Workflow",
    demoNote: isRtl ? "توجه: این یک نمونه جریان کاری شبیه‌سازی شده برای پیش‌نمایش معماری ابزار است." : "Note: This is an illustrative workflow mapping for interface architecture preview.",
    pricingTiers: {
      free: isRtl ? "رایگان (Free)" : "Free Tier",
      professional: isRtl ? "حرفه‌ای (Professional)" : "Professional Plan",
      enterprise: isRtl ? "سازمانی (Enterprise)" : "Enterprise Plan",
      custom: isRtl ? "سفارشی (Custom Integration)" : "Custom Integration"
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isRtl ? `پیش‌نمایش ابزار: ${name}` : `Feature Preview: ${name}`}
    >
      <div className="space-y-6 text-start" dir={direction}>
        {/* Banner with icon & category */}
        <div className="p-4 bg-[var(--muted-surface)] rounded-xl border border-[var(--border)] flex items-center gap-4">
          <div className="p-3 bg-[var(--card)] rounded-xl text-[var(--sky-blue-500)] border border-[var(--border)] shrink-0">
            <IconComp size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-[var(--sky-blue-500)] tracking-wider">
              {service.category.toUpperCase()} TOOL
            </span>
            <h3 className="text-sm font-black text-[var(--text-primary)] mt-0.5">{name}</h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {desc}
        </p>

        {/* Dynamic Mock Terminal Workflow */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
            <Terminal size={12} className="text-[var(--sky-blue-500)]" />
            <span>{strings.demoWorkflow}</span>
          </h4>
          <div className="bg-slate-950/90 dark:bg-slate-950/50 text-slate-300 font-mono text-[10px] p-4 rounded-xl border border-slate-800 space-y-1 overflow-x-auto leading-relaxed shadow-inner">
            <p className="text-slate-500">{"// Initialize seorchable API runner"}</p>
            <p className="text-emerald-400">import {"{ executeEngine }"} from &quot;@seorchable/sdk&quot;;</p>
            <p className="text-slate-400">const runner = await executeEngine.setup({"{"} slug: &quot;{service.slug}&quot; {"}"});</p>
            <p className="text-slate-400">const result = await runner.run({"{"} target: &quot;company.ir&quot;, depth: 3 {"}"});</p>
            <p className="text-amber-400">console.log(result.score); <span className="text-slate-500">{"// => 94.2% optimized"}</span></p>
          </div>
          <p className="text-[9px] text-[var(--text-muted)] font-semibold italic">
            * {strings.demoNote}
          </p>
        </div>

        {/* Key Features Checklist */}
        <div className="space-y-3 pt-2 border-t border-[var(--border)]">
          <h4 className="text-xs font-black text-[var(--text-primary)]">
            {strings.featuresTitle}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {service.features.map((feat) => (
              <div
                key={feat.id}
                className="p-2.5 bg-[var(--card)] border border-[var(--border)] rounded-lg flex items-start gap-2.5"
              >
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[var(--text-primary)] truncate">
                    {isRtl ? feat.nameFa : feat.nameEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements / Entitlements */}
        <div className="space-y-3 pt-4 border-t border-[var(--border)]">
          <h4 className="text-xs font-black text-[var(--text-primary)]">
            {strings.requirements}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold">
            <div className="flex justify-between p-2.5 bg-[var(--muted-surface)] rounded-lg border border-[var(--border)]">
              <span className="text-[var(--text-secondary)]">{strings.tierLabel}</span>
              <span className="text-[var(--sky-blue-500)] font-black uppercase">
                {strings.pricingTiers[service.pricingTier] || service.pricingTier}
              </span>
            </div>
            <div className="flex justify-between p-2.5 bg-[var(--muted-surface)] rounded-lg border border-[var(--border)]">
              <span className="text-[var(--text-secondary)]">{strings.statusLabel}</span>
              <span className="font-black text-amber-500">
                {entitlement.status}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex items-center gap-3 justify-end pt-4 border-t border-[var(--border)]">
          <Button variant="outline" type="button" onClick={onClose} className="text-xs font-bold px-5 cursor-pointer">
            {isRtl ? "بستن پیش‌نمایش" : "Close Preview"}
          </Button>

          {entitlement.status === "AVAILABLE" ? (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onNavigate(service.route);
              }}
              className="text-xs font-bold px-5 cursor-pointer bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--sky-blue-600)] text-white hover:opacity-95"
            >
              <span>{strings.ctaOpen}</span>
            </Button>
          ) : entitlement.status === "PREMIUM" || entitlement.status === "LOCKED" ? (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onUpgrade();
              }}
              className="text-xs font-bold px-5 cursor-pointer bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] text-white hover:opacity-95 shadow-md border-0"
            >
              <Sparkles size={13} />
              <span>{strings.ctaUpgrade}</span>
            </Button>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
};
