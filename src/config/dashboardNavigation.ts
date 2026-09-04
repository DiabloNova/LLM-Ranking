import {
  LayoutDashboard,
  Search,
  Sparkles,
  BarChart3,
  SearchCode,
  HelpCircle,
  Settings,
  Receipt
} from "lucide-react";
import React from "react";

export interface NavigationSubItem {
  id: string;
  labelEn: string;
  labelFa: string;
  href: string;
}

export interface NavigationItem {
  id: string;
  labelEn: string;
  labelFa: string;
  href?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children?: NavigationSubItem[];
}

export interface NavigationSection {
  id: string;
  titleEn: string;
  titleFa: string;
  items: NavigationItem[];
}

export const dashboardNavigation: NavigationSection[] = [
  {
    id: "main",
    titleEn: "Workspace",
    titleFa: "فضای کاری",
    items: [
      {
        id: "overview",
        labelEn: "Overview",
        labelFa: "نمای کلی",
        href: "/dashboard",
        icon: LayoutDashboard
      },
      {
        id: "audits",
        labelEn: "SEO Audits",
        labelFa: "سنجش سئو",
        href: "/dashboard/audits",
        icon: Search
      },
      {
        id: "prompts",
        labelEn: "AI Visibility Prompts",
        labelFa: "دستورات رویت‌پذیری هوش مصنوعی",
        href: "/dashboard/prompts",
        icon: Sparkles
      },
      {
        id: "brand-monitoring",
        labelEn: "Brand Intelligence",
        labelFa: "هوشمندی برند",
        href: "/dashboard/brand-monitoring",
        icon: BarChart3
      },
      {
        id: "query",
        labelEn: "Query Engine",
        labelFa: "موتور پرس‌وجو",
        href: "/dashboard/query",
        icon: SearchCode
      }
    ]
  },
  {
    id: "admin",
    titleEn: "Administration",
    titleFa: "مدیریت سیستم",
    items: [
      {
        id: "settings",
        labelEn: "Workspace Settings",
        labelFa: "تنظیمات فضای کاری",
        href: "/dashboard/settings",
        icon: Settings
      },
      {
        id: "billing",
        labelEn: "Billing & Subscriptions",
        labelFa: "اشتراک و صورت‌حساب",
        href: "/dashboard/billing",
        icon: Receipt
      }
    ]
  },
  {
    id: "support",
    titleEn: "Support",
    titleFa: "پشتیبانی",
    items: [
      {
        id: "help",
        labelEn: "Help & Guide",
        labelFa: "راهنما و پشتیبانی",
        href: "#help",
        icon: HelpCircle
      }
    ]
  }
];
