# Domain Model Design Specification

This document details the Domain-Driven Design (DDD) model established for the **AI Visibility Intelligence Engine (Phase 7C.1)**.

---

## 1. Domain Architectural Paradigms

This domain operates on strict **Domain-Driven Design (DDD)** principles to separate technical details (database, controllers, API) from the underlying core business rules of Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO).

```
   ┌────────────────────────────────────────────────────────┐
   │                  ObservationAggregate                  │
   │                    (Aggregate Root)                    │
   │                                                        │
   │  ┌───────────────┐   ┌────────────────┐   ┌─────────┐  │
   │  │ AIObservation │   │  BrandMention  │   │Citation │  │
   │  │   (Entity)    │   │    (Entity)    │   │(Entity) │  │
   │  └───────┬───────┘   └───────┬────────┘   └───┬─────┘  │
   └──────────┼───────────────────┼────────────────┼────────┘
              │                   │                │
              ▼                   ▼                ▼
       ┌─────────────┐     ┌─────────────┐  ┌─────────────┐
       │Sentiment VO │     │TextContextVO│  │Confidence VO│
       │(Value Object)     │(Value Object)  │(Value Object)
       └─────────────┘     └─────────────┘  └─────────────┘
```

---

## 2. Core Domain Entities & Aggregates

### 2.1 Aggregates and Roots
* **Organization**: The primary tenant aggregate root representing the subscription tier holding monitored brands.
* **ObservationAggregate**: A composite aggregate combining an **AIObservation**, its extracted **BrandMention** list, and reference **Citation** links.
  - **Aggregate Root**: `AIObservation`
  - **Invariants**: All brand mentions and citations inside this aggregate must share the same `organizationId` and `observationId` as the parent observation.

### 2.2 Entities (With Lifecycle Identity)
1. **Organization**: Defined by its slug, plan, and ID. Holds subscription configuration.
2. **Brand**: Represents a corporate brand or product namespace being optimized.
3. **Entity**: Semantic knowledge graph node matching real-world Wikidata properties.
4. **Prompt**: The exact question executed on generative engine platform models.
5. **AIObservation**: Response body metadata including raw metrics and execution time.
6. **BrandMention**: The explicit presence and layout position of a brand inside a response text.
7. **Citation**: References or URLs extracted from a response.
8. **VisibilityScore**: Log of historical scores tracked per engine for trend visualization.
9. **Recommendation**: Targeted actions suggested to recover/boost search visibility.

### 2.3 Value Objects (Immutable, Attribute-Defined)
1. **AuditMetadata**: Captures tracking headers (`createdBy`, `updatedBy`, `createdAt`, `updatedAt`), soft deletion state, and version sequence for auditing.
2. **SentimentVO**: Encapsulates decimal sentiment scores (`-100` to `100`), semantic labels (`positive`, `negative`, `neutral`), and evaluation confidence.
3. **ConfidenceVO**: Standardizes classification probability score (`0.0` to `1.0`) and qualitative ranks (`high`, `medium`, `low`).
4. **TextContextVO**: Pinpoints exact coordinates of mentions, enclosing context snippets, character offset starts, and character ends.

---

## 3. Core Domain Invariants & Rules

The domain enforces the following business logic invariants:
1. **Dynamic Visibility Ranges**: All calculated visibility ratings must fall between `0` and `100` inclusive.
2. **Confidence Normalization**: All confidence level scores must range between `0.0` and `1.0`.
3. **Domain Authority Range**: Domain Authority metrics for citations must fall strictly within `0` and `100` index intervals.
4. **Tenant Isolation Invariant**: Tenant-owned data elements cannot link with objects owned by other organization IDs.
