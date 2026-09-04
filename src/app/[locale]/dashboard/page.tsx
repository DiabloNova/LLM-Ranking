import React from "react";
import { getSession } from "@/services/auth/session";
import { dashboardHomeService } from "@/services/dashboard-home";
import DashboardHomeClient from "@/components/features/dashboard-home/DashboardHomeClient";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Premium unified authenticated Dashboard Home.
 * Serves as a single unified intelligence workspace.
 * Resolves user/tenant context securely on the server with zero client waterfalls.
 */
export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const currentLocale = (locale === "fa" ? "fa" : "en") as "en" | "fa";

  // 1. Resolve session on the server
  const session = await getSession();

  // 2. Fetch aggregated dashboard summary securely from our database aggregation layer
  let summaryData;
  try {
    summaryData = await dashboardHomeService.getDashboardSummary(currentLocale);
  } catch (err) {
    // Graceful secure fallback if session was unauthenticated (client protected wrapper will redirect)
    summaryData = {
      seoHealth: "N/A" as const,
      aiVisibility: "N/A" as const,
      brandAuthority: "N/A" as const,
      citationVisibility: "N/A" as const,
      technicalHealth: "N/A" as const,
      contentHealth: "N/A" as const,
      competitivePosition: "N/A" as const,
      visibilityTrends: [],
      criticalIssues: [],
      recommendedActions: [],
      recentAudits: [],
      recentActivity: []
    };
  }

  return (
    <DashboardHomeClient
      initialData={summaryData}
      user={session ? session.user : null}
    />
  );
}
