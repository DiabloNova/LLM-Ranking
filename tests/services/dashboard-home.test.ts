import { dashboardHomeService } from "../../src/services/dashboard-home";
import { PostgresClient } from "../../src/features/admin/infrastructure/persistence/postgres";
import { setCookiesMock, createSession, invalidateSession } from "../../src/services/auth/session";
import { User } from "../../src/types/auth";

class MockCookieStore {
  private store: Map<string, unknown> = new Map();

  get(name: string) {
    return this.store.get(name);
  }

  set(name: string, value: unknown, options?: Record<string, unknown>) {
    this.store.set(name, { name, value, ...options });
    return this;
  }

  delete(name: string) {
    this.store.delete(name);
    return this;
  }

  clear() {
    this.store.clear();
  }
}

const mockCookieStore = new MockCookieStore();

export async function runDashboardHomeTests() {
  console.log("=========================================================================");
  console.log("SEORCHABLE — DASHBOARD HOME INTEGRATION TEST SUITE");
  console.log("=========================================================================");

  // Set up mock cookies store for tests
  setCookiesMock(async () => mockCookieStore);
  const pg = PostgresClient.getInstance();

  // Test 1: Deny unauthenticated access
  console.log("▶ TEST: SEC-DASH-001: Denying unauthenticated access to aggregator...");
  mockCookieStore.clear();
  await invalidateSession();

  try {
    await dashboardHomeService.getDashboardSummary("en");
    throw new Error("Expected dashboard aggregation to throw Unauthorized error, but it succeeded!");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (!errorMsg.includes("Unauthorized")) {
      throw err;
    }
    console.log("  ✅ Unauthenticated access successfully rejected (Fail-closed).");
  }

  // Test 2: Resolve N/A baseline metrics when no audits exist
  console.log("▶ TEST: SEC-DASH-002: Resolving N/A baseline metrics when no audits exist...");
  mockCookieStore.clear();
  const emptyUser: User = {
    id: "usr-test-01",
    name: "Sohrab",
    email: "sohrab@brandgraph.ir",
    role: "workspace_admin",
    workspaceId: "ws-test-empty-tenant",
  };
  await createSession(emptyUser);

  // Mock postgres query to return empty list
  const originalQuery = pg.query;
  pg.query = async () => {
    return { rowCount: 0, rows: [] } as unknown as ReturnType<typeof pg.query>;
  };

  try {
    const summary = await dashboardHomeService.getDashboardSummary("fa");

    if (summary.seoHealth !== "N/A") throw new Error("Expected seoHealth to be N/A!");
    if (summary.aiVisibility !== "N/A") throw new Error("Expected aiVisibility to be N/A!");
    if (summary.brandAuthority !== "N/A") throw new Error("Expected brandAuthority to be N/A!");
    if (summary.citationVisibility !== "N/A") throw new Error("Expected citationVisibility to be N/A!");
    if (summary.technicalHealth !== "N/A") throw new Error("Expected technicalHealth to be N/A!");
    if (summary.contentHealth !== "N/A") throw new Error("Expected contentHealth to be N/A!");
    if (summary.competitivePosition !== "N/A") throw new Error("Expected competitivePosition to be N/A!");

    if (summary.visibilityTrends.length !== 0) throw new Error("Expected trends to be empty!");
    if (summary.criticalIssues.length !== 0) throw new Error("Expected criticalIssues to be empty!");
    if (summary.recommendedActions.length !== 0) throw new Error("Expected recommendedActions to be empty!");
    if (summary.recentAudits.length !== 0) throw new Error("Expected recentAudits to be empty!");
    if (summary.recentActivity.length !== 0) throw new Error("Expected recentActivity to be empty!");

    console.log("  ✅ All empty/unavailable states resolved beautifully without fake metric inflation.");
  } finally {
    pg.query = originalQuery;
  }

  // Test 3: Correctly extract and map active metrics when audits exist
  console.log("▶ TEST: SEC-DASH-003: Correctly map active metrics when premium audits exist...");
  mockCookieStore.clear();
  const activeUser: User = {
    id: "usr-test-02",
    name: "Tina",
    email: "tina@brandgraph.ir",
    role: "workspace_admin",
    workspaceId: "ws-test-active-tenant",
  };
  await createSession(activeUser);

  const mockAuditRow = {
    id: "aud-active-99",
    url: "https://optimus-ai.com",
    score: 87,
    grade: "B",
    pages_analyzed: 14,
    metrics: JSON.stringify({
      contentQuality: 92,
      technicalHealth: 88,
      internalLinking: 80,
      semanticCoverage: 79
    }),
    issues: JSON.stringify([
      { severity: "critical", category: "technical", description: "SSL domain mismatch error" }
    ]),
    recommendations: JSON.stringify([
      { priority: "high", insight: "Optimize schema attributes for service descriptions", estimatedImpact: "+20% visibility" }
    ]),
    created_at: new Date().toISOString()
  };

  pg.query = async () => {
    return { rowCount: 1, rows: [mockAuditRow] } as unknown as ReturnType<typeof pg.query>;
  };

  try {
    const summary = await dashboardHomeService.getDashboardSummary("en");

    if (summary.seoHealth !== 87) throw new Error("Expected seoHealth to match mock score!");
    if (summary.technicalHealth !== 88) throw new Error("Expected technicalHealth to match mock metrics!");
    if (summary.contentHealth !== 92) throw new Error("Expected contentHealth to match mock metrics!");
    if (summary.aiVisibility !== 79) throw new Error("Expected aiVisibility to match mock metrics!");

    if (summary.criticalIssues.length !== 1) throw new Error("Expected exact 1 critical issue!");
    if (summary.criticalIssues[0].resolvedByRoute !== "/dashboard/seo/technical") {
      throw new Error("Critical issue routed to incorrect resolving tool!");
    }

    if (summary.recommendedActions.length !== 1) throw new Error("Expected exact 1 recommended action!");
    if (summary.recommendedActions[0].toolRoute !== "/dashboard/seo/technical") {
      throw new Error("Action routed to incorrect resolving tool!");
    }

    if (summary.recentAudits.length !== 1) throw new Error("Expected recentAudits list length 1!");
    if (summary.recentAudits[0].url !== "https://optimus-ai.com") throw new Error("Audit url mismatch!");

    console.log("  ✅ Aggregated summary matched with full fidelity and proper routing mapping.");
  } finally {
    pg.query = originalQuery;
  }

  console.log("=========================================================================");
  console.log("✅ ALL DASHBOARD HOME INTEGRATION TESTS PASSED SUCCESSFULLY!");
  console.log("=========================================================================");
}

if (require.main === module) {
  runDashboardHomeTests().catch((err) => {
    console.error("❌ Test Suite Failed with Error:", err);
    process.exit(1);
  });
}
