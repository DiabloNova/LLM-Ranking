import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

/**
 * Deterministic CI test orchestrator.
 *
 * The repository uses focused TypeScript runners instead of a single test framework.
 * This script makes that implicit convention explicit: suites run in a stable order,
 * fail fast, and return the failing child's exit code. Database-backed integration tests
 * are opt-in and are never silently replaced with mocks.
 */

interface Suite {
  name: string;
  path: string;
  integration?: boolean;
}

const suites: Suite[] = [
  { name: "Acquisition", path: "tests/features/acquisition/run-all.ts" },
  { name: "AI intelligence", path: "tests/features/ai-intelligence/run-all.ts" },
  { name: "Monitoring", path: "tests/features/monitoring/run-all.ts" },
  { name: "Service monitoring isolation", path: "tests/services/monitoring/run-all.ts" },
  { name: "Admin", path: "tests/features/admin/run-all.ts", integration: true },
  { name: "Acquisition integration", path: "tests/features/acquisition/integration/run-all.ts", integration: true },
];

/**
 * Test files that are deliberately NOT executed yet, with the reason.
 *
 * Why this list exists: every suite above is an explicit `run-all.ts` composition root,
 * because 62 of the 70 `*.test.ts` files only *export* a `testX()` function and do nothing
 * when executed directly. That convention is fine, but it silently loses tests -- a file
 * whose composition root was never written simply never runs, and nothing notices.
 * `assertNoUndiscoveredTests()` below turns that silence into a hard failure: a new
 * `*.test.ts` must either be reachable from a registered suite or be listed here on
 * purpose. Entries are a backlog to burn down, not a place to hide failures.
 */
const UNWIRED_TESTS: Record<string, string> = {
  "tests/api/v1/analytics/llm.test.ts": "no composition root; never executed since it was added",
  "tests/features/analysis/competitive.test.ts": "export-only, no run-all in tests/features/analysis",
  "tests/features/analytics/llm-analytics.test.ts": "export-only, no run-all in tests/features/analytics",
  "tests/features/audit/aeo-insight.test.ts": "export-only, no run-all in tests/features/audit",
  "tests/features/audit/free-audit.test.ts": "export-only, no run-all in tests/features/audit",
  "tests/features/audit/premium-audit.test.ts": "export-only, no run-all in tests/features/audit",
  "tests/features/billing/subscription.test.ts": "self-executing, not registered as a suite",
  "tests/features/content/studio.test.ts": "export-only, no run-all in tests/features/content",
  "tests/features/optimization/technical.test.ts": "export-only, no run-all in tests/features/optimization",
  "tests/features/public-api/public-api.test.ts": "self-executing, not registered as a suite",
  "tests/inngest/inngest-integration.test.ts": "self-executing, not registered as a suite",
  "tests/scripts/database/db-push-guard.test.ts": "self-executing, not registered as a suite",
  "tests/services/ai/ai.test.ts": "export-only, no run-all in tests/services/ai",
  "tests/services/ai/graph-extraction.test.ts": "export-only, no run-all in tests/services/ai",
  "tests/services/audit-engine/aeo-content-intelligence.test.ts": "export-only, no run-all in tests/services/audit-engine",
  "tests/services/audit-engine/ai-visibility.test.ts": "export-only, no run-all in tests/services/audit-engine",
  "tests/services/audit-engine/brand-intelligence.test.ts": "export-only, no run-all in tests/services/audit-engine",
  "tests/services/audit-engine/citation-intelligence.test.ts": "export-only, no run-all in tests/services/audit-engine",
  "tests/services/audit-engine/competitive-ai.test.ts": "export-only, no run-all in tests/services/audit-engine",
  "tests/services/audit-engine/competitive-radar.test.ts": "export-only, no run-all in tests/services/audit-engine",
  "tests/services/audit-engine/competitive-seo.test.ts": "export-only, no run-all in tests/services/audit-engine",
  "tests/services/audit-engine/competitor-discovery.test.ts": "export-only, no run-all in tests/services/audit-engine",
  "tests/services/audit-engine/diagnostic-engine.test.ts": "export-only, no run-all in tests/services/audit-engine",
  "tests/services/audit-engine/engine.test.ts": "export-only, no run-all in tests/services/audit-engine",
  "tests/services/audit-engine/intelligence-model.test.ts": "export-only, no run-all in tests/services/audit-engine",
  "tests/services/audit-engine/keyword-intelligence.test.ts": "export-only, no run-all in tests/services/audit-engine",
  "tests/services/audit-engine/prompt-intelligence.test.ts": "export-only, no run-all in tests/services/audit-engine",
  "tests/services/audit-engine/seo-extractor.test.ts": "export-only, no run-all in tests/services/audit-engine",
  "tests/services/audit-engine/site-architecture.test.ts": "export-only, no run-all in tests/services/audit-engine",
  "tests/services/audit-engine/technical-seo-analyzer.test.ts": "export-only, no run-all in tests/services/audit-engine",
  "tests/services/auth/session.test.ts": "export-only, no run-all in tests/services/auth",
  "tests/services/cache/cache.test.ts": "export-only, no run-all in tests/services/cache",
  "tests/services/cost-control/cost-control.test.ts": "export-only, no run-all in tests/services/cost-control",
  "tests/services/crawler/web-crawler.test.ts": "export-only, no run-all in tests/services/crawler",
  "tests/services/dashboard-home.test.ts": "export-only, no run-all in tests/services",
  "tests/services/dashboard-services.test.ts": "module-level assertions, no run-all in tests/services",
  "tests/services/dashboard-shell.test.ts": "export-only, no run-all in tests/services",
  "tests/services/jobs/jobs.test.ts": "export-only, no run-all in tests/services/jobs",
  "tests/services/knowledge-graph/graph-store.test.ts": "export-only, no run-all in tests/services/knowledge-graph",
  "tests/services/knowledge-graph/knowledge-graph-foundation.test.ts": "export-only, no run-all in tests/services/knowledge-graph",
  "tests/services/observability/observability.test.ts": "export-only, no run-all in tests/services/observability",
  "tests/services/workspace/workspace.test.ts": "module-level assertions, no run-all in tests/services/workspace",
};

/** Every `*.test.ts` under tests/, as repo-relative POSIX paths. */
function listTestFiles(dir = "tests"): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(resolve(process.cwd(), dir), { withFileTypes: true })) {
    const rel = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listTestFiles(rel));
    } else if (entry.name.endsWith(".test.ts")) {
      out.push(rel.split("\\").join("/"));
    }
  }
  return out;
}

/** Test files transitively imported by the registered suite entry points. */
function collectReachable(entry: string, seen = new Set<string>()): Set<string> {
  const abs = resolve(process.cwd(), entry);
  if (!existsSync(abs)) return seen;
  const key = relative(process.cwd(), abs).split("\\").join("/");
  if (seen.has(key)) return seen;
  seen.add(key);
  const source = readFileSync(abs, "utf8");
  for (const match of source.matchAll(/from\s+"(\.[^"]+)"|import\s+"(\.[^"]+)"/g)) {
    const spec = match[1] ?? match[2];
    if (!spec) continue;
    const base = resolve(dirname(abs), spec);
    for (const candidate of [base, `${base}.ts`, join(base, "index.ts")]) {
      if (existsSync(candidate)) {
        collectReachable(relative(process.cwd(), candidate), seen);
        break;
      }
    }
  }
  return seen;
}

function assertNoUndiscoveredTests(): void {
  const reachable = new Set<string>();
  for (const suite of suites) {
    for (const file of collectReachable(suite.path)) reachable.add(file);
  }
  const undiscovered = listTestFiles().filter(
    (file) => !reachable.has(file) && !(file in UNWIRED_TESTS)
  );
  if (undiscovered.length > 0) {
    console.error(
      "Test discovery check failed. These *.test.ts files are not reachable from any " +
        "registered suite and are not listed in UNWIRED_TESTS, so they would never run:"
    );
    for (const file of undiscovered) console.error(`  - ${file}`);
    console.error(
      "Either import them from the relevant tests/**/run-all.ts (preferred) or add them " +
        "to UNWIRED_TESTS with a reason."
    );
    process.exit(3);
  }
  const stale = Object.keys(UNWIRED_TESTS).filter((file) => reachable.has(file));
  if (stale.length > 0) {
    console.error("These files are now wired into a suite; remove them from UNWIRED_TESTS:");
    for (const file of stale) console.error(`  - ${file}`);
    process.exit(3);
  }
  console.log(
    `Test discovery: ${reachable.size} file(s) reachable, ${Object.keys(UNWIRED_TESTS).length} known-unwired.`
  );
}

function shouldRunIntegrationSuites(): boolean {
  return process.env.RUN_INTEGRATION_TESTS === "1";
}

function runSuite(suite: Suite): void {
  const absolutePath = resolve(process.cwd(), suite.path);
  if (!existsSync(absolutePath)) {
    throw new Error(`Test suite is missing: ${suite.path}`);
  }

  console.log(`\n▶ ${suite.name}: ${suite.path}`);
  const result = spawnSync("tsx", [absolutePath], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    throw new Error(`Could not start ${suite.name} test runner: ${result.error.message}`);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

assertNoUndiscoveredTests();

const runIntegrations = shouldRunIntegrationSuites();
const selectedSuites = suites.filter((suite) => runIntegrations || !suite.integration);

if (runIntegrations && (!process.env.DATABASE_URL || !process.env.MIGRATION_DATABASE_URL)) {
  console.error("RUN_INTEGRATION_TESTS=1 requires DATABASE_URL and MIGRATION_DATABASE_URL.");
  process.exit(2);
}

console.log(`Running ${selectedSuites.length} test suite(s). Integration suites: ${runIntegrations ? "enabled" : "skipped"}.`);
for (const suite of selectedSuites) {
  runSuite(suite);
}
console.log("\n✅ All selected test suites passed.");
