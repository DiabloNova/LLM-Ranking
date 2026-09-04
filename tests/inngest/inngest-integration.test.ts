import assert from "node:assert/strict";
import { inngest } from "../../src/lib/inngest/client";
import { helloWorld, scheduledMonitoring } from "../../src/lib/inngest/functions";
import { GET, POST, PUT } from "../../src/app/api/inngest/route";

async function runTests() {
  console.log("Running Inngest integration tests...");

  // 1. Verify Inngest client is initialized
  assert.ok(inngest, "Inngest client should be initialized");
  assert.equal(inngest.id, "SEOrchable", "Inngest client ID should match src/lib/inngest/client.ts");
  console.log("✅ Inngest client initialization verified");

  // 2. Verify functions exist
  assert.ok(helloWorld, "helloWorld function should exist");
  assert.equal(helloWorld.name, "hello-world", "Function name should be hello-world");
  assert.ok(scheduledMonitoring, "scheduledMonitoring function should exist");
  assert.equal(
    scheduledMonitoring.name,
    "scheduled-ai-visibility-monitoring",
    "Function id should match src/lib/inngest/functions.ts",
  );
  console.log("✅ Inngest functions verification passed");

  // 3. Verify Route handlers exist
  assert.ok(GET, "GET handler should exist");
  assert.ok(POST, "POST handler should exist");
  assert.ok(PUT, "PUT handler should exist");
  console.log("✅ Inngest Next.js route handlers verified");

  console.log("All Inngest integration tests passed!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
