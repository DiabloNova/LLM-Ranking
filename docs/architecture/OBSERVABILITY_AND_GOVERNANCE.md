# Observability & Cost Governance Architecture Reference

This document defines the architectural specification, environment configurations, and security/isolation properties established for request-scoped context propagation, trace sampling, decoupled latency metrics, and AI cost warning thresholds on the **seorchable** platform.

---

## 1. Request Context & Async Context Propagation

For advanced request-scoped context tracing without manually prop-drilling identifiers through business services, the system introduces `ObservabilityContextManager`.

### 1.1 Multi-Runtime Compatibility

Runtimes like Edge and serverless isolates do not natively support or allow Node's `node:async_hooks` module. To prevent compile-time import leaks and support Edge functions, the context propagation layer detects and wraps runtimes behind a unified abstraction:

```
                  ObservabilityContextManager
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
      Node.js Runtime                    Edge / Browser fallback
    (AsyncLocalStorage)                       (In-Memory Map)
```

- **Node.js Environment:** Utilizes `AsyncLocalStorage` to securely carry `requestId`, `traceId`, `spanId`, `jobId`, `tenantId`, and `operation` across asynchronous scopes.
- **Edge/V8 Isolate Environment:** Falls back gracefully to structured request tracking, ensuring no compile/execution failure occurs in browser or isolate-based runtimes.

---

## 2. Trace Sampling & Metric Decoupling

Trace storage is highly expensive. To optimize database resources, the platform supports configurable probabilistic trace sampling while ensuring critical telemetry remains statistically meaningful and completely preserved.

### 2.1 Configurable Trace Sampling Rate

Traces are sampled dynamically based on the environment variable:

```
OBSERVABILITY_TRACE_SAMPLE_RATE=0.1
```

- **Format:** Float values between `0.0` (0%) and `1.0` (100%).
- **Development/Test defaults:** Defaults to `1.0` (100%) to facilitate local debugging and integration validation.
- **Production defaults:** Defaults to `0.1` (10%) to minimize infrastructure costs.

### 2.2 Error Preservation Invariant

Probabilistic sampling **must never** result in the loss of critical error logs or crash reports.
- **Rule:** If an operation terminates with an error or failure, the `ObservabilityTracker` ALWAYS bypasses sampling rules and retains the trace, guaranteeing 100% visibility for troubleshooting.

### 2.3 Decoupled Metrics

Distributed traces are separate from latency measurements. Latitude metric aggregations (e.g. histographic latency observations) are recorded **independently** of trace sampling rates. Even if a successful trace is not sampled, its execution duration is registered in the metrics catalog, safeguarding the statistical accuracy of performance dashboards.

---

## 3. High-Cost AI Operation Thresholds

To identify unusually expensive operations easily, the observability system tracks LLM usage records and evaluates them against configurable token warning thresholds.

```
OBSERVABILITY_LLM_TOKEN_WARNING_THRESHOLD=5000
```

- **Default:** 5000 total tokens (Input + Output).
- **Behavior:** When an LLM operation exceeds this limit, the tracker produces a distinguishable structured warning event (`llm.cost.threshold_exceeded`).
- **Security Check:** To protect user privacy and proprietary IP, **the prompt content and completion responses are never logged** or stored in telemetry metadata.
- **Warning-Only Boundary:** The threshold operates strictly as a warning trigger; it **MUST NOT** terminate or reject the LLM request.

---

## 4. Runtime Capabilities Matrix

The supported capabilities vary dynamically across application environments:

| Capability | Node.js Server | Edge Runtime / V8 Isolates | Browser / Client |
| :--- | :--- | :--- | :--- |
| **AsyncLocalStorage** | Yes (Native) | No (Map Fallback) | No (Map Fallback) |
| **Request Correlation** | Yes (Automatic) | Yes (Manual Map) | Yes (Manual Map) |
| **Structured Logging** | Yes | Yes | Yes |
| **Latency Metrics** | Yes | Yes | Yes |
| **Trace Sampling** | Yes (Configurable) | Yes (Configurable) | Yes (Configurable) |
| **Error Preservation**| Yes (100% kept) | Yes (100% kept) | Yes (100% kept) |
| **Cost Threshold Warning**| Yes | Yes | Yes |
