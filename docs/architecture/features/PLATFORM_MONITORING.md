# Platform Monitoring and Telemetry Design

This document describes how our system tracks operational health, background worker status, and external AI adapters.

## Health Probes

The `SystemOperationsConsole` runs real-time diagnostic checks across four core infrastructural vectors:

1. **Transactional DB Latency**: Check connection pool response times.
2. **Redis Message Queue**: Evaluate backlog and processing queue sizes.
3. **ElasticSearch Indexes**: Check hybrid and full-text search availability.
4. **S3 Storage Tiering**: Check object bucket reachability.

## Worker & Queue Telemetry

The monitor tracks:

- Active processing rates (observations processed per second).
- Monotonic worker-failed job counts.
- Backlog length across the `ai-observation-pipeline` and `crawler-target-jobs` queues.

## Integration with Existing Observability

Diagnostics integrate seamlessly with the existing Core Observability module (`src/features/ai-intelligence/observability/`):

- **Structured Logging**: Outputs system logs in JSON formats with trace correlation headers.
- **Metrics Tracking**: Increments monotonic counters and records latency metrics.
- **Distributed Tracing**: Envelops diagnostic runs inside OpenTelemetry trace spans.
