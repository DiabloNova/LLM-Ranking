import React from "react";
import { getSession } from "@/services/auth/session";
import { getMarketplaceData, getWorkspacePlan } from "@/services/dashboard-services";
import ServiceMarketplaceClient from "@/components/features/dashboard-services/ServiceMarketplaceClient";

interface ServicesPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Reusable, authenticated Service Marketplace route.
 * Renders into the Dashboard Shell content viewport.
 */
export default async function ServicesPage({ params }: ServicesPageProps) {
  const { locale } = await params;

  // 1. Resolve session on the server
  const session = await getSession();
  const workspaceId = session?.user?.workspaceId || "ws-default";

  // 2. Fetch data-driven marketplace items mapping catalog config, entitlements, and limits
  const items = getMarketplaceData(workspaceId);
  const activePlan = getWorkspacePlan(workspaceId);

  return (
    <ServiceMarketplaceClient
      initialItems={items}
      user={session ? session.user : null}
      activePlan={activePlan}
    />
  );
}
