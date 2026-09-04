import { ObservabilityContextManager } from "../../../src/services/observability/context";
import { ObservabilityTracker } from "../../../src/services/observability/tracker";
import { ObservabilityContext } from "../../../src/services/observability/types";

export async function runObservabilityTests() {
  console.log("=========================================================================");
  console.log("SEORCHABLE — SECURE OBSERVABILITY & TELEMETRY INTEGRATION SUITE");
  console.log("=========================================================================");

  // ----------------------------------------------------
  // Test 1: Concurrent Context Isolation (AsyncLocalStorage)
  // ----------------------------------------------------
  console.log("▶ Testing Async Context Propagation and Isolation...");

  const contextA: ObservabilityContext = {
    requestId: "req-alice-111",
    traceId: "trace-alice-222",
    tenantId: "ws-alice-tenant",
    operation: "SEO_crawl"
  };

  const contextB: ObservabilityContext = {
    requestId: "req-bob-333",
    traceId: "trace-bob-444",
    tenantId: "ws-bob-tenant",
    operation: "RAG_query"
  };

  // Run alice and bob concurrently and verify that their context remains strictly isolated!
  const aliceWork = async () => {
    return ObservabilityContextManager.runWithContext(contextA, async () => {
      // Small artificial delay to let concurrent bobWork interleave
      await new Promise((resolve) => setTimeout(resolve, 50));
      const activeCtx = ObservabilityContextManager.get();
      if (!activeCtx || activeCtx.requestId !== "req-alice-111" || activeCtx.tenantId !== "ws-alice-tenant") {
        throw new Error(`Context Isolation Leak: Alice retrieved Bob context! Found: ${JSON.stringify(activeCtx)}`);
      }
      return "alice-success";
    });
  };

  const bobWork = async () => {
    return ObservabilityContextManager.runWithContext(contextB, async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      const activeCtx = ObservabilityContextManager.get();
      if (!activeCtx || activeCtx.requestId !== "req-bob-333" || activeCtx.tenantId !== "ws-bob-tenant") {
        throw new Error(`Context Isolation Leak: Bob retrieved Alice context! Found: ${JSON.stringify(activeCtx)}`);
      }
      return "bob-success";
    });
  };

  const [resA, resB] = await Promise.all([aliceWork(), bobWork()]);
  if (resA !== "alice-success" || resB !== "bob-success") {
    throw new Error("Context isolation workers failed.");
  }
  console.log("  ✅ Concurrent request context isolation verified successfully.");

  // ----------------------------------------------------
  // Test 2: Probabilistic Trace Sampling & Decoupled Latency Metrics
  // ----------------------------------------------------
  console.log("▶ Testing Probabilistic Trace Sampling and Metric Decoupling...");
  ObservabilityTracker.clear();

  // Force sample rate to 0% (always discard successful requests)
  process.env.OBSERVABILITY_TRACE_SAMPLE_RATE = "0.0";

  // Emit successful request
  ObservabilityTracker.trackEvent({
    name: "crawl.success",
    durationMs: 120,
    metadata: { pages: 5 }
  });

  const events = ObservabilityTracker.getEvents();
  const metrics = ObservabilityTracker.getMetrics();

  // Successful request should be discarded by 0% sample rate (events should be empty)
  if (events.length !== 0) {
    throw new Error(`Sampling Failure: Successful request was not discarded under 0% sample rate! Events: ${events.length}`);
  }

  // Decoupled Metrics: Metric latency observations must STILL exist!
  const hasLatencyMetric = metrics.some(m => m.name === "crawl.success.latency" && m.value === 120);
  if (!hasLatencyMetric) {
    throw new Error("Metrics Failure: Latency metrics were discarded due to trace sampling!");
  }
  console.log("  ✅ Sampling rate respected and latency metrics decoupled successfully.");

  // ----------------------------------------------------
  // Test 3: Error Preservation Invariant
  // ----------------------------------------------------
  console.log("▶ Testing Error Preservation Invariant under 0% Sampling...");
  ObservabilityTracker.clear();

  // Emit failed request under 0% sample rate
  ObservabilityTracker.trackEvent({
    name: "crawl.failed",
    durationMs: 45,
    error: { code: "CRAWL_TIMEOUT", message: "Target site took too long to respond." }
  });

  const errorEvents = ObservabilityTracker.getEvents();
  // Error events must ALWAYS be preserved, bypassing trace sampling!
  if (errorEvents.length !== 1 || errorEvents[0].error?.code !== "CRAWL_TIMEOUT") {
    throw new Error(`Error Preservation Failure: Critical error event was lost due to trace sampling! Events: ${errorEvents.length}`);
  }
  console.log("  ✅ Error preservation verified successfully (100% of error traces kept).");

  // ----------------------------------------------------
  // Test 4: High-Cost AI Token Warning Thresholds
  // ----------------------------------------------------
  console.log("▶ Testing High-Cost AI Token Threshold Warnings...");
  ObservabilityTracker.clear();

  // Force warning threshold to 1000 tokens
  process.env.OBSERVABILITY_LLM_TOKEN_WARNING_THRESHOLD = "1000";
  // Force sample rate to 100% so we receive the events
  process.env.OBSERVABILITY_TRACE_SAMPLE_RATE = "1.0";

  // 4.1 Under threshold -> Normal logging only
  ObservabilityTracker.trackLlmUsage({
    provider: "google",
    model: "gemini-2.5-flash",
    operation: "brief",
    inputTokens: 300,
    outputTokens: 200 // Total: 500 tokens (< 1000 threshold)
  });

  const normalEvents = ObservabilityTracker.getEvents();
  if (normalEvents.some(e => e.name === "llm.cost.threshold_exceeded")) {
    throw new Error("Threshold Failure: Threshold exceeded event produced when tokens were under threshold!");
  }

  // 4.2 Over threshold -> Triggers distinct threshold exceeded warning event
  ObservabilityTracker.clear();
  ObservabilityTracker.trackLlmUsage({
    provider: "google",
    model: "gemini-2.5-flash",
    operation: "audit",
    inputTokens: 800,
    outputTokens: 500 // Total: 1300 tokens (> 1000 threshold)
  });

  const warningEvents = ObservabilityTracker.getEvents();
  const hasWarningEvent = warningEvents.some(e => e.name === "llm.cost.threshold_exceeded");
  if (!hasWarningEvent) {
    throw new Error("Threshold Failure: Expected warning event 'llm.cost.threshold_exceeded', none found!");
  }

  // Security Check: Prompt and completion MUST never be logged
  const warningEvent = warningEvents.find(e => e.name === "llm.cost.threshold_exceeded");
  if (warningEvent && (warningEvent.metadata?.prompt || warningEvent.metadata?.completion)) {
    throw new Error("Security Leak Failure: Telemetry logged sensitive prompts or completion values!");
  }
  console.log("  ✅ High-cost warnings triggered safely and prompt/completion logs excluded.");

  console.log("=========================================================================");
  console.log("✅ ALL OBSERVABILITY & CONTEXT PROPAGATION SCENARIOS PASSED!");
  console.log("=========================================================================");
}

if (require.main === module) {
  runObservabilityTests().catch((err) => {
    console.error("❌ Test Suite Failed with Error:", err);
    process.exit(1);
  });
}
