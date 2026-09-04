import { testWebsiteMonitoringFoundation } from "./website-monitoring.test";

async function runAll() {
  await testWebsiteMonitoringFoundation();
}

runAll().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
import { testRepositoryBehaviors } from "./repository.test";

async function runRepoTests() {
    await testRepositoryBehaviors();
}
runRepoTests().catch(err => {
    console.error("Repository Test failed:", err);
    process.exit(1);
});
import { testTenantIsolationBehaviors } from "./tenant-isolation.test";

async function runIsolationTests() {
    await testTenantIsolationBehaviors();
}
runIsolationTests().catch(err => {
    console.error("Tenant Isolation Test failed:", err);
    process.exit(1);
});

import { runAIVisibilityMonitoringTests } from "./ai-visibility-monitoring.test";

async function runAiVisibilityTests() {
    await runAIVisibilityMonitoringTests();
}
runAiVisibilityTests().catch(err => {
    console.error("AI Visibility Monitoring Test failed:", err);
    process.exit(1);
});
