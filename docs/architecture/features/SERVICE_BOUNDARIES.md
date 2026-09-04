# Service Boundaries & Use Cases

This document describes the clear responsibilities, inputs, and outputs of the service layer interfaces.

---

## 1. Boundary Matrix

Every Service has a singular, unified domain of responsibility. Cross-domain actions are handled through composition or event-driven listeners.

| Service Name | Primary Boundary | Dependencies | Key Use Cases |
| :--- | :--- | :--- | :--- |
| **ObservationService** | AI response ingestion & prompt tracking | `IObservationRepository`, `IPromptRepository`, `IRecommendationRepository` | Process search runs, register tracking prompts, trigger low-visibility mitigation actions. |
| **VisibilityService** | Analytical telemetry compilation | `IVisibilityScoreRepository`, `IAIEngineRepository` | Prepares charts, aggregates metrics per platform, generates grade ratings for the command center. |
| **EntityService** | Concept index & knowledge graph | `IEntityRepository` |CLAIM wikidata profiles, establish relationships (e.g. competes_with), manage confidence scores. |
| **CitationService** | Citation parsing & authority scoring | `IObservationRepository` | Parse reference links, evaluate publisher trust levels, assess link topical relevance. |

---

## 2. Core Service Methods

### 2.1 EntityService
* `getEntityById(orgId, id)`: Fetches an entity inside organization boundaries.
* `createEntity(orgId, brandId, name, type, ...)`: Claims a semantic footprint node.
* `addRelationship(orgId, sourceId, targetId, relationType)`: Links concepts together.

### 2.2 CitationService
* `analyzeCitations(orgId, observationId)`: Evaluates citations reference links.
* `calculateAuthorityScore(url)`: Applies heuristics to score a publisher domain from 0 to 100.

### 2.3 VisibilityService
* `prepareDashboardData(orgId, brandId)`: Pulls and compiles all metric categories to feed the Command Center UI.
* `aggregateEnginePerformance(orgId, brandId)`: Breaks down performance ratings (A, B, C, D, F) across ChatGPT, Claude, Gemini, and Perplexity.

### 2.4 ObservationService
* `registerPrompt(orgId, brandId, text, category, intent, ...)`: Subscribes query tracks.
* `processObservation(orgId, promptId, engineId, responseText, ...)`: Coordinates the ingestion pipeline.
