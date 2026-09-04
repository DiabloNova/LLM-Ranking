import {
  SERVICE_CATALOG,
  getWorkspacePlan,
  getWorkspaceEntitlements,
  getWorkspaceUsage,
  getMarketplaceData,
  registerWorkspacePlan,
  clearWorkspacePlans
} from "../../src/services/dashboard-services";

function runTests() {
  console.log("=========================================================================");
  console.log("SEORCHABLE — SERVICE MARKETPLACE ARCHITECTURE TEST SUITE");
  console.log("=========================================================================");

  // Reset/Clear workspace plans to ensure clean state and register test-specific fixtures
  clearWorkspacePlans();

  // Register explicit plan fixtures for testing
  registerWorkspacePlan("ws-test-free", "free");
  registerWorkspacePlan("Tehran HQ Workspace", "professional");
  registerWorkspacePlan("ws-pro-tenant", "professional");
  registerWorkspacePlan("ws-enterprise-organization", "enterprise");
  registerWorkspacePlan("ws-free", "free");
  registerWorkspacePlan("ws-enterprise", "enterprise");

  // 1. Service Catalog definitions test
  console.log("▶ TEST: Verifying Service Catalog assignment and metadata...");
  if (SERVICE_CATALOG.length === 0) {
    throw new Error("FAIL: Service Catalog is empty.");
  }
  const expectedServices = [
    "tech-seo",
    "schema-metadata",
    "ai-visibility",
    "ai-playground",
    "content-studio",
    "content-ingestion",
    "competitor-radar",
    "brand-citations",
    "knowledge-graph",
    "llm-bias"
  ];
  for (const sId of expectedServices) {
    const found = SERVICE_CATALOG.find((s) => s.id === sId);
    if (!found) {
      throw new Error(`FAIL: Expected service "${sId}" was not found in catalog.`);
    }
  }
  console.log("  ✅ All 10 canonical services configured in catalog with full details.");

  // 2. Workspace Plan Resolution test
  console.log("▶ TEST: Verifying Workspace subscription plan resolution...");
  const freePlan = getWorkspacePlan("ws-test-free");
  const proPlan1 = getWorkspacePlan("Tehran HQ Workspace");
  const proPlan2 = getWorkspacePlan("ws-pro-tenant");
  const entPlan = getWorkspacePlan("ws-enterprise-organization");

  if (freePlan !== "free") throw new Error(`FAIL: Expected free plan, got ${freePlan}`);
  if (proPlan1 !== "professional") throw new Error(`FAIL: Expected professional plan, got ${proPlan1}`);
  if (proPlan2 !== "professional") throw new Error(`FAIL: Expected professional plan, got ${proPlan2}`);
  if (entPlan !== "enterprise") throw new Error(`FAIL: Expected enterprise plan, got ${entPlan}`);
  console.log("  ✅ Workspace plan resolution mapped correctly to subscription tiers.");

  // 3. Entitlement Rules & Status Transitions test
  console.log("▶ TEST: Verifying Workspace service entitlements (Available vs. Premium vs. Locked)...");

  // Free Workspace
  const freeEnts = getWorkspaceEntitlements("ws-free");
  const techSeoFree = freeEnts.find((e) => e.serviceId === "tech-seo")!;
  const aiVisibilityFree = freeEnts.find((e) => e.serviceId === "ai-visibility")!;
  const knowledgeGraphFree = freeEnts.find((e) => e.serviceId === "knowledge-graph")!;
  const llmBiasFree = freeEnts.find((e) => e.serviceId === "llm-bias")!;

  if (techSeoFree.status !== "AVAILABLE") {
    throw new Error(`FAIL: Free plan tech SEO should be AVAILABLE, got ${techSeoFree.status}`);
  }
  if (aiVisibilityFree.status !== "PREMIUM") {
    throw new Error(`FAIL: Free plan AI Visibility should be PREMIUM, got ${aiVisibilityFree.status}`);
  }
  if (knowledgeGraphFree.status !== "LOCKED") {
    throw new Error(`FAIL: Free plan Knowledge Graph should be LOCKED, got ${knowledgeGraphFree.status}`);
  }
  if (llmBiasFree.status !== "UNAVAILABLE") {
    throw new Error(`FAIL: Free plan LLM Bias should be UNAVAILABLE, got ${llmBiasFree.status}`);
  }

  // Professional Workspace
  const proEnts = getWorkspaceEntitlements("Tehran HQ Workspace");
  const aiVisibilityPro = proEnts.find((e) => e.serviceId === "ai-visibility")!;
  const knowledgeGraphPro = proEnts.find((e) => e.serviceId === "knowledge-graph")!;

  if (aiVisibilityPro.status !== "AVAILABLE") {
    throw new Error(`FAIL: Pro plan AI Visibility should be AVAILABLE, got ${aiVisibilityPro.status}`);
  }
  if (knowledgeGraphPro.status !== "LOCKED") {
    throw new Error(`FAIL: Pro plan Knowledge Graph should be LOCKED, got ${knowledgeGraphPro.status}`);
  }

  // Enterprise Workspace
  const entEnts = getWorkspaceEntitlements("ws-enterprise");
  const knowledgeGraphEnt = entEnts.find((e) => e.serviceId === "knowledge-graph")!;

  if (knowledgeGraphEnt.status !== "AVAILABLE") {
    throw new Error(`FAIL: Enterprise plan Knowledge Graph should be AVAILABLE, got ${knowledgeGraphEnt.status}`);
  }

  console.log("  ✅ Service availability states (AVAILABLE, PREMIUM, LOCKED, UNAVAILABLE) enforced beautifully.");

  // 4. Usage limit and progression percentage test
  console.log("▶ TEST: Verifying usage mapping and progressive indicators...");

  const freeUsages = getWorkspaceUsage("ws-free");
  const techSeoFreeUsage = freeUsages.find((u) => u.serviceId === "tech-seo")!;
  const aiVisibilityFreeUsage = freeUsages.find((u) => u.serviceId === "ai-visibility")!;

  if (techSeoFreeUsage.used !== 15 || techSeoFreeUsage.limit !== 50 || techSeoFreeUsage.percentage !== 30) {
    throw new Error(`FAIL: Free tech-seo usage incorrect: ${JSON.stringify(techSeoFreeUsage)}`);
  }
  if (aiVisibilityFreeUsage.used !== 0 || aiVisibilityFreeUsage.limit !== 0 || aiVisibilityFreeUsage.percentage !== 0) {
    throw new Error(`FAIL: Free ai-visibility usage incorrect: ${JSON.stringify(aiVisibilityFreeUsage)}`);
  }

  const proUsages = getWorkspaceUsage("Tehran HQ Workspace");
  const aiVisibilityProUsage = proUsages.find((u) => u.serviceId === "ai-visibility")!;
  if (aiVisibilityProUsage.used !== 7 || aiVisibilityProUsage.limit !== 20 || aiVisibilityProUsage.percentage !== 35) {
    throw new Error(`FAIL: Pro ai-visibility usage incorrect: ${JSON.stringify(aiVisibilityProUsage)}`);
  }

  const entUsages = getWorkspaceUsage("ws-enterprise");
  const techSeoEntUsage = entUsages.find((u) => u.serviceId === "tech-seo")!;
  if (techSeoEntUsage.limit !== null || techSeoEntUsage.percentage !== 0) {
    throw new Error(`FAIL: Enterprise tech-seo usage should be unlimited: ${JSON.stringify(techSeoEntUsage)}`);
  }

  console.log("  ✅ Usage indicators, quota bounds, and unlimited states resolved successfully.");

  // 5. Search filtering matching algorithms
  console.log("▶ TEST: Verifying Marketplace Item retrieval and indexing...");
  const marketplaceData = getMarketplaceData("Tehran HQ Workspace");
  if (marketplaceData.length !== SERVICE_CATALOG.length) {
    throw new Error(`FAIL: Expected ${SERVICE_CATALOG.length} marketplace items, got ${marketplaceData.length}`);
  }

  const item = marketplaceData[0];
  if (!item.service || !item.entitlement || !item.usage) {
    throw new Error("FAIL: MarketplaceItem is missing core separated domains.");
  }
  console.log("  ✅ Full separation of concern (Service Definition vs. Entitlement vs. Usage) validated.");

  // 6. Security Regression: Misleading Workspace ID substring matching
  console.log("▶ TEST: Verifying that misleading workspace IDs do not receive paid plans...");
  const misleadingIds = ["ws-provider", "ws-parent", "ws-entertainment", "agent-ws", "ws-pro", "ws-ent", "my-enterprise-mock"];
  for (const id of misleadingIds) {
    const plan = getWorkspacePlan(id);
    if (plan !== "free") {
      throw new Error(`FAIL: Misleading workspace ID "${id}" was granted "${plan}" plan instead of defaulting to "free".`);
    }

    // Verify entitlements for these are free tier entitlements
    const entitlements = getWorkspaceEntitlements(id);
    const locked = entitlements.find((e) => e.serviceId === "knowledge-graph")!;
    if (locked.status !== "LOCKED") {
      throw new Error(`FAIL: Misleading workspace ID "${id}" got unlocked/premium status for Enterprise service, got status "${locked.status}".`);
    }
  }
  console.log("  ✅ Misleading workspace IDs successfully default to free plan without entitlement escalation.");

  // 7. Explicit Plan Fixtures & Entitlements verify
  console.log("▶ TEST: Verifying explicit plan fixtures and their exact entitlement sets...");
  registerWorkspacePlan("ws-temp-free", "free");
  registerWorkspacePlan("ws-temp-pro", "professional");
  registerWorkspacePlan("ws-temp-ent", "enterprise");

  // Free Tier Entitlements
  const freeEntsTemp = getWorkspaceEntitlements("ws-temp-free");
  const proEntsTemp = getWorkspaceEntitlements("ws-temp-pro");
  const entEntsTemp = getWorkspaceEntitlements("ws-temp-ent");

  // Verify Free Plan entitlements
  for (const ent of freeEntsTemp) {
    const s = SERVICE_CATALOG.find((x) => x.id === ent.serviceId)!;
    if (s.pricingTier === "free") {
      if (ent.status !== "AVAILABLE") throw new Error(`FAIL: Free service "${s.id}" should be AVAILABLE on Free plan`);
    } else if (s.pricingTier === "professional") {
      if (ent.status !== "PREMIUM") throw new Error(`FAIL: Professional service "${s.id}" should be PREMIUM on Free plan`);
    } else if (s.pricingTier === "enterprise") {
      if (ent.status !== "LOCKED") throw new Error(`FAIL: Enterprise service "${s.id}" should be LOCKED on Free plan`);
    }
  }

  // Verify Professional Plan entitlements
  for (const ent of proEntsTemp) {
    const s = SERVICE_CATALOG.find((x) => x.id === ent.serviceId)!;
    if (s.pricingTier === "free" || s.pricingTier === "professional") {
      if (ent.status !== "AVAILABLE") throw new Error(`FAIL: Service "${s.id}" should be AVAILABLE on Professional plan`);
    } else if (s.pricingTier === "enterprise") {
      if (ent.status !== "LOCKED") throw new Error(`FAIL: Enterprise service "${s.id}" should be LOCKED on Professional plan`);
    }
  }

  // Verify Enterprise Plan entitlements
  for (const ent of entEntsTemp) {
    const s = SERVICE_CATALOG.find((x) => x.id === ent.serviceId)!;
    if (s.pricingTier !== "custom") {
      if (ent.status !== "AVAILABLE") throw new Error(`FAIL: Service "${s.id}" should be AVAILABLE on Enterprise plan`);
    }
  }
  console.log("  ✅ Explicit plan fixtures verified for free, professional, and enterprise tiers.");

  // 8. Single Source of Truth: Entitlement & Plan resolution sync
  console.log("▶ TEST: Verifying that plan and entitlement resolution use the same authoritative plan source...");
  const ssotWorkspaceId = "ws-ssot-test";
  registerWorkspacePlan(ssotWorkspaceId, "professional");

  const planFromResolution = getWorkspacePlan(ssotWorkspaceId);
  const entitlementsFromResolution = getWorkspaceEntitlements(ssotWorkspaceId);
  const proServiceEnt = entitlementsFromResolution.find((e) => e.serviceId === "ai-visibility")!;

  if (planFromResolution !== "professional") {
    throw new Error(`FAIL: Plan resolved to "${planFromResolution}" instead of "professional".`);
  }
  if (proServiceEnt.status !== "AVAILABLE") {
    throw new Error(`FAIL: Service entitlement and plan mismatch. Pro plan has "${proServiceEnt.status}" instead of AVAILABLE.`);
  }

  // Change the plan dynamically to free
  registerWorkspacePlan(ssotWorkspaceId, "free");
  const planAfterChange = getWorkspacePlan(ssotWorkspaceId);
  const entitlementsAfterChange = getWorkspaceEntitlements(ssotWorkspaceId);
  const proServiceEntAfterChange = entitlementsAfterChange.find((e) => e.serviceId === "ai-visibility")!;

  if (planAfterChange !== "free") {
    throw new Error(`FAIL: Plan after change resolved to "${planAfterChange}" instead of "free".`);
  }
  if (proServiceEntAfterChange.status !== "PREMIUM") {
    throw new Error(`FAIL: Service entitlement and plan mismatch after change. Free plan has "${proServiceEntAfterChange.status}" instead of PREMIUM.`);
  }
  console.log("  ✅ Single source of truth verified: dynamically changing workspace plan updates entitlements instantly.");

  console.log("=========================================================================");
  console.log("✅ ALL SERVICE MARKETPLACE INTEGRATION TESTS COMPLETED SUCCESSFULLY!");
  console.log("=========================================================================");
}

try {
  runTests();
} catch (error: unknown) {
  const errorMsg = error instanceof Error ? error.message : String(error);
  console.error("❌ TEST RUN FAILED:", errorMsg);
  process.exit(1);
}
