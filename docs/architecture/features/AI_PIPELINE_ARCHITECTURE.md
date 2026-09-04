# AI processing Pipeline Architecture

This document describes the design and abstract contracts created to coordinate multi-model scraping, sanitization, and metric calculation.

---

## 1. Pipeline Stages

Ingesting and evaluating Generative engine search results operates in six decoupled abstract stages:

```
  [Stage 1: IAIEngineAdapter]
            │ Dispatches queries to ChatGPT / Claude / Gemini / Perplexity
            ▼
  [Stage 2: IPromptExecutionPipeline]
            │ Schedules cron tracks & priority levels
            ▼
  [Stage 3: IObservationProcessingPipeline]
            │ Sanitizes raw body text, masking credentials
            ▼
  [Stage 4: ICitationExtractionPipeline]
            │ Resolves reference link lists, calculating Domain Authority
            ▼
  [Stage 5: IEntityResolutionPipeline]
            │ Links entity mentions with Wikidata items (Q-codes)
            ▼
  [Stage 6: IConfidenceScoringPipeline]
            │ Rates accuracy probability of parsed blocks
```

---

## 2. Pluggable Adapters Strategy

By creating strict interfaces under `src/features/ai-intelligence/pipeline/`, the platform can support any future models (OpenAI, Anthropic, Google Gemini, or local Llama LLMs) simply by writing a concrete wrapper adapter. Handlers do not depend on the specific API schemas, but purely on these pipeline contracts.
