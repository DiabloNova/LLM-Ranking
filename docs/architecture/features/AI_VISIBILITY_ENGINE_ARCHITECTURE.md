# AI Visibility Engine Architecture

This document specifies the technical architecture, domain models, and scoring equations of the production-grade **AI Visibility Audit Engine** (Task 5.0).

---

## 1. Core Distinctions

A key architectural design principle is the strict separation of conversational retrieval indicators. We explicitly differentiate between these five concepts:

1. **Mention:** The simple lexical presence of a brand's name, localized spellings, or aliases within the text block.
2. **Entity Recognition:** Mapped confidence that the conversational AI recognizes the brand as the intended entity in its semantic graph, as opposed to an ambiguous similar-named company or competitor.
3. **Citation:** Structured links, anchors, or URLs referencing the brand's domain or authoritative third-party source publications validating the response claim.
4. **Answer Inclusion:** Mapped indicator determining whether the brand is presented as a meaningful candidate solution answering the user's buyer intent, rather than a passive or passing reference.
5. **Visibility:** The overall composite weight representing how prominent, preferred, or recommended the brand appears within the generative interface.

---

## 2. AI Visibility Domain Model

The domain models are defined in `src/features/ai-intelligence/domain/types/index.ts` and mapped to PostgreSQL tables via `database/schema/ai-visibility-audit.ts`.

### AI Visibility Audit (`AIVisibilityAudit`)
- Represents a single historical run assessing a specific brand.
- Statuses: `PENDING`, `RUNNING`, `ANALYZING`, `COMPLETED`, `FAILED`.
- Tracks overall score, granular dimension metrics, and prompt coverage.

### Audit Prompt (`AuditPrompt`)
- Represents an explicit prompt submitted to the provider.
- Tracks prompt text, buying intent/category, response text, execution latency, and granular parsed analysis results with context evidence.

---

## 3. Provider Abstraction

The domain layer depends on the `IAIVisibilityProvider` interface rather than a direct concrete SDK:
- **`MockAIVisibilityProvider`:** Implements high-fidelity, deterministic lexical and citation simulation in both Persian and English.
- **`GeminiAIVisibilityProvider`:** Integrates with the existing Google Gemini LLM client.

---

## 4. Scoring Formula and Weights

The composite AI Visibility Score is calculated deterministically across 6 core weighted factors:

$$S = (V \times 0.20) + (M \times 0.15) + (E \times 0.15) + (C \times 0.15) + (A \times 0.15) + (I \times 0.20)$$

Where:
- $V$: **Answer Visibility Score** (20% weight) - maps levels: `recommended_preferred` = 100, `prominently_included` = 85, `directly_mentioned` = 65, `indirectly_referenced` = 35, `not_mentioned` = 0.
- $M$: **Brand Mention Score** (15% weight) - maps occurrences: 0 count = 0, 1 count = 60, 2+ count = 100.
- $E$: **Entity Recognition Score** (15% weight) - maps statuses: `strongly_associated` = 100, `correctly_recognized` = 85, `ambiguously_recognized` = 45, `not_recognized` = 0.
- $C$: **Citation Presence Score** (15% weight) - maps occurrences: 0 count = 0, 1 count = 70, 2+ count = 100.
- $A$: **Source Authority Score** (15% weight) - average of resolved citation authority scores. If all citations are `"unknown"`, we redistribute this weight to Citation Presence to prevent unfair penalty.
- $I$: **Answer Inclusion Score** (20% weight) - maps levels: `recommended_preferred` = 100, `prominently_included` = 85, `included` = 65, `mentioned_but_not_included` = 30, `absent` = 0.

### Unknown and Insufficient Data Semantics
If citation authority is missing, it is stored strictly as `"unknown"` (separate from 0 authority), indicating insufficient third-party data rather than low authority.

---

## 5. Audit Lifecycle

```
[PENDING] -> [RUNNING] -> [ANALYZING] -> [COMPLETED] / [FAILED]
```

- **Partial Failure Support:** One failed prompt does not destroy the entire audit. If some prompts fail, their errors are persisted, while the successful prompts are scored, providing a partial audit score.
