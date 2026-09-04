# AI Prompt Intelligence Architecture

This document specifies the technical design, state transitions, variable rendering, and competitor position analysis implemented by the **AI Prompt Intelligence Layer** (Task 5.1).

---

## 1. Core Architecture & Alignment

The Prompt Intelligence Layer extends Task 5.0 (AI Visibility Core) to provide persistent, multi-tenant isolated prompt parameterization, execution, cron-scheduling, and side-by-side model comparison.

The data pipeline operates as follows:
```
Prompt Library -> Parameterized Template -> Resolved Prompt -> Prompt Execution -> Model Execution -> Position & Citation Extractor -> Evidence Snapshot
```

---

## 2. Variables and Templating Contract

Prompts support curly brace parameters: `Who are the best {service} providers in {location}?`.
- **Resolution Safety:** If any variable value is missing or left empty, and no default value exists, the system throws a strict `Validation Error` at runtime.
- **Historical Immutability:** Resolved prompt texts used during execution are persisted as **immutable snapshots** inside `prompt_executions`. This guarantees that future template edits do not corrupt historical execution records.

---

## 3. Scheduled Auditing Invariants

- **Scheduler Mapping:** Scheduled audits map onto the system's underlying transactional queue, executing under active `TenantContextManager` bounds.
- **Unique Execution Identity:** Scheduled executions are enforced with a unique deterministic database constraint on `(prompt_id, prompt_version, scheduled_for)` to guarantee zero duplicate scheduled runs under distributed workers.

---

## 4. Execution State Machine

A prompt execution transitions through defined states:
```
[queued] -> [running] -> [succeeded] / [failed] / [timed_out] / [cancelled]
```

- **Transitions Enforcement:** Illegal state transitions (e.g., trying to run an execution that is already marked `succeeded`) are rejected with `Illegal State Transition` errors.

---

## 5. Brand & Competitor Position Observations

The system extracts conversational positioning and layouts semantically without guessing:
- **`ranked`:** Position parsed when numerical ranking (1-based index) is identified in lists.
- **`recommended`:** Position parsed when recommendation, prose preference, or table highlights are detected.
- **`mentioned`:** Position parsed when a prose/paragraph mention is found.
- **`not_present`:** Mapped when the brand/competitor is entirely absent.
- **`unknown`:** Mapped when analysis is aborted or cannot determine presence.

Every position observation persists its exact matching quote as evidence, preserving full auditable tracebacks.
