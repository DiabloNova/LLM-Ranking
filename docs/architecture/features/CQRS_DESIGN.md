# Command Query Responsibility Segregation (CQRS) Design

This document details the CQRS design pattern used to separate writes (State Mutation) from reads (State Materialization).

---

## 1. Segregation Concept

To scale search visibility ingestion separately from rich analytics dashboards, we divide use-cases into:

1. **Commands (Write Store)**:
   - Optimized for safety, constraints, and relational consistency.
   - Triggers state shifts and emits events.
   - Executed via `ApplicationCommandHandler`.

2. **Queries (Read / Analytics View)**:
   - Optimized for dashboard rendering speed, aggregation, and analytical throughput.
   - Bypasses rich state locks.
   - Executed via `ApplicationQueryHandler`.

---

## 2. Command Index

* **CreateBrandCommand**: Registers a brand profile.
* **DiscoverEntityCommand**: Claims a semantic knowledge graph node.
* **CaptureAIObservationCommand**: Ingests an LLM search run run and triggers alerts.
* **CalculateVisibilityScoreCommand**: Updates engine visibility indices.
* **GenerateRecommendationCommand**: Proposes optimization tasks.
* **RegisterPromptCommand**: Adds trackable queries.
* **LinkSemanticEntitiesCommand**: Connects entity nodes with semantic edges.

---

## 3. Query Index

* **GetBrandIntelligenceQuery**: Materializes the Brand Command Center dashboard.
* **GetVisibilityReportQuery**: Gathers historical score coordinates for timeline charts.
* **GetEntityGraphQuery**: Resolves knowledge graph nodes and edges.
* **GetCitationAnalysisQuery**: Inspects citations and computes Domain Authority details.
