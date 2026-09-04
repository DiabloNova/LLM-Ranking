export interface ObservabilityContext {
  requestId?: string;
  traceId?: string;
  spanId?: string;
  jobId?: string;
  tenantId?: string;
  operation?: string;
}

export interface TraceEvent {
  id: string;
  name: string;
  context: ObservabilityContext;
  sampled: boolean;
  error?: {
    code: string;
    message: string;
  };
  durationMs?: number;
  metadata?: Record<string, unknown>;
  timestamp: number;
}
