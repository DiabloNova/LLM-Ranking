import { ObservabilityContext, TraceEvent } from "./types";
import { ObservabilityContextManager } from "./context";

export class ObservabilityTracker {
  private static events: TraceEvent[] = [];
  private static metrics: { name: string; value: number; timestamp: number }[] = [];

  /**
   * Configurable trace sample rate from environment variables
   */
  public static getTraceSampleRate(): number {
    const rateStr = process.env.OBSERVABILITY_TRACE_SAMPLE_RATE;
    if (rateStr) {
      const rate = parseFloat(rateStr);
      if (!isNaN(rate) && rate >= 0 && rate <= 1) {
        return rate;
      }
    }
    // Default: 100% in development/test, 10% in production
    return process.env.NODE_ENV === "production" ? 0.1 : 1.0;
  }

  /**
   * Configurable LLM token threshold warnings from environment variables
   */
  public static getLlmTokenWarningThreshold(): number {
    const thresholdStr = process.env.OBSERVABILITY_LLM_TOKEN_WARNING_THRESHOLD;
    if (thresholdStr) {
      const threshold = parseInt(thresholdStr, 10);
      if (!isNaN(threshold) && threshold > 0) {
        return threshold;
      }
    }
    return 5000; // Default: 5000 tokens
  }

  /**
   * Emits a structured telemetry trace event.
   * Ensures that error telemetry is NEVER discarded by sampling (Error Preservation Invariant).
   */
  public static trackEvent(options: {
    name: string;
    durationMs?: number;
    error?: { code: string; message: string };
    metadata?: Record<string, unknown>;
  }): void {
    const context = ObservabilityContextManager.get() || {};
    const sampleRate = this.getTraceSampleRate();

    // Probabilistic trace sampling
    const isSampled = Math.random() < sampleRate;

    // ERROR PRESERVATION INVARIANT: If the request failed with an error, ALWAYS preserve it
    const shouldKeep = isSampled || !!options.error;

    if (shouldKeep) {
      const event: TraceEvent = {
        id: `evt-${Math.random().toString(36).substring(2, 11)}`,
        name: options.name,
        context,
        sampled: isSampled,
        error: options.error,
        durationMs: options.durationMs,
        metadata: options.metadata || {},
        timestamp: Date.now()
      };
      this.events.push(event);
    }

    // Accumulate metrics independently of trace sampling to preserve statistical validity
    if (options.durationMs !== undefined) {
      this.metrics.push({
        name: `${options.name}.latency`,
        value: options.durationMs,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Tracks LLM costs and checks for configured thresholds.
   * Produces a distinguishable warning event if thresholds are exceeded, without terminating execution.
   */
  public static trackLlmUsage(options: {
    provider: string;
    model: string;
    operation: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCost?: number;
  }): void {
    const totalTokens = options.inputTokens + options.outputTokens;
    const warningThreshold = this.getLlmTokenWarningThreshold();

    this.trackEvent({
      name: "llm.token.usage_recorded",
      metadata: {
        provider: options.provider,
        model: options.model,
        operation: options.operation,
        inputTokens: options.inputTokens,
        outputTokens: options.outputTokens,
        totalTokens,
        estimatedCost: options.estimatedCost
      }
    });

    if (totalTokens > warningThreshold) {
      // Structured high-cost warning event (llm.cost.threshold_exceeded)
      this.trackEvent({
        name: "llm.cost.threshold_exceeded",
        metadata: {
          provider: options.provider,
          model: options.model,
          operation: options.operation,
          inputTokens: options.inputTokens,
          outputTokens: options.outputTokens,
          totalTokens,
          threshold: warningThreshold,
          estimatedCost: options.estimatedCost
        }
      });
    }
  }

  public static getEvents(): TraceEvent[] {
    return [...this.events];
  }

  public static getMetrics() {
    return [...this.metrics];
  }

  public static clear() {
    this.events = [];
    this.metrics = [];
  }
}
