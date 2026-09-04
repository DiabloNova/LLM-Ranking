/**
 * Phase 7C.1 — AI Visibility Intelligence Engine
 * Observability Foundation Contracts
 * Standardizes structured logging, metric tracking, and OpenTelemetry-ready distributed tracing.
 */

export interface LogContext {
  organizationId?: string;
  actorId?: string;
  correlationId?: string;
  causationId?: string;
  [key: string]: unknown;
}

export interface ILogger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}

export interface IMetricsTracker {
  /**
   * Increment a monotonic counter (e.g., total ingested observations)
   */
  incrementCounter(name: string, value?: number, tags?: Record<string, string>): void;

  /**
   * Record a gauge metric value (e.g., overall visibility score index)
   */
  recordGauge(name: string, value: number, tags?: Record<string, string>): void;

  /**
   * Measure execution durations (e.g., LLM query API execution latency)
   */
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void;
}

export interface ITraceSpan {
  /**
   * Set dynamic tagging attributes on the trace span context
   */
  setAttribute(key: string, value: string | number | boolean): void;

  /**
   * Signal completed operation span tracking
   */
  end(): void;
}

export interface ITracer {
  /**
   * Start a new operation trace span tracking context
   */
  startSpan(name: string, parentSpanId?: string): ITraceSpan;
}

/**
 * Concrete Lightweight Console Logger Implementation (production-ready fallback)
 */
export class StructuredConsoleLogger implements ILogger {
  private formatLog(level: string, message: string, context?: LogContext): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context || {}
    });
  }

  public info(message: string, context?: LogContext): void {
    console.log(this.formatLog("INFO", message, context));
  }

  public warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog("WARN", message, context));
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...(context || {}),
      errorMessage: error?.message,
      errorStack: error?.stack
    };
    console.error(this.formatLog("ERROR", message, errorContext));
  }

  public debug(message: string, context?: LogContext): void {
    console.debug(this.formatLog("DEBUG", message, context));
  }
}
