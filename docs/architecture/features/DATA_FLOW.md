# Data Flow & Pipelines

This document maps the sequential lifecycles and pipelines of the AI Visibility Intelligence Engine.

---

## 1. AI Observation Ingestion Lifecycle

This pipeline details how incoming LLM query captures flow into calculated analytics and triggers autonomous recovery actions.

```
 [AI Agent Engine]
        │ Executes Search Query
        ▼
 [Raw JSON Payload]
        │
        ▼
 [ObservationService.processObservation()]
        │
        ├─► 1. Save Raw Observation
        │
        ├─► 2. Extract Brand Mentions (Create BrandMention Entities)
        │
        ├─► 3. Extract Cite URLs (Create Citation Entities)
        │
        ▼
 [ObservationAggregate Constructed]
        │
        ├─► calculateDynamicVisibility()
        │
        ▼
 [Score Metric Logged to VisibilityScoreRepository]
        │
        ├─► Dynamic Threshold Evaluation (< 70%?)
        │         │
        │         └─► YES ──► [Auto Recommendation Raised]
        ▼
 [Dispatch ObservationCapturedEvent]
```

---

## 2. Ingestion Pipeline Details

1. **Query Execution**: An automated runner executes a trackable `Prompt` against a designated `AIEngine` (e.g. Claude).
2. **Payload Receipt**: Raw content is sent to `ObservationService.processObservation(...)` under strict organization scoping.
3. **Extraction & Linking**:
   - Mentions: Identifies brand context snippets and matches them to Wikidata `Entity` profiles, computing sentiment and location positions.
   - Citations: Extracts reference hyperlinks, parsing domains to resolve Domain Authority ratings using the `CitationService`.
4. **Metric Logging**: Compiles an `ObservationAggregate` that computes a weighted overall score. This score is persisted as a `VisibilityScore` series entry.
5. **Threshold Evaluators**: If the computed visibility falls below `70%`, the platform generates a high-priority `Recommendation` task warning of a potential search decline, preparing corrective indexing actions.
