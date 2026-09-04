# AI Citation Intelligence Architecture

This document specifies the technical design, entity-relationship structures, classification rules, quality evaluation algorithms, and trend telemetry metrics implemented by the **AI Citation Intelligence Layer** (Task 5.2).

---

## 1. Citation Occurrence vs. Citation Source

To prevent historical overwrites and compile precise temporal metrics, the architecture maintains a strict separation between individual occurrences and their unique normalized source domain profiles:

- **`citation_sources`:** Tracks normalized domain identities (e.g. `wikipedia.org`). Maintains aggregate statistics including `occurrence_count`, `first_seen_at`, `last_seen_at`, and independently evaluated `quality_score` and `authority_score`.
- **`citation_occurrences`:** Tracks specific appearances of a citation source within an AI observation run. Captures precise metadata: exact matching `url`, surrounding `snippet` excerpt as evidence, `position` index index, and `confidence`.

---

## 2. Extensible Classification & Attribution

The `CitationIntelligenceService` contains an explainable rule-based classifier that maps domains to standard categories:
- **`owned`:** Mapped dynamically when domain matches the active monitored brand's domain.
- **`competitor`:** Mapped dynamically when domain matches any of the tenant's active competitors.
- **`government` / `academic_research`:** Mapped for `.gov`, `.mil`, `.edu`, and region-specific equivalents (e.g. `.ac.ir`).
- **`reference_encyclopedia`:** Mapped for `wikipedia.org`, `britannica.com`, etc.
- **`social` / `forum_community` / `publisher_media` / `documentation`:** Categorizes popular communities and publishers.

---

## 3. Quality vs. Authority Evaluation

The domain models treat quality and authority as separate independent factors to avoid false precision and provide transparent diagnostics:

### Citation Quality
Quality represents the completeness and relevance of the matched citation. Evaluated deterministically out of 100 points:
- Protocol is secure HTTPS: +35 points
- Response text explicitly mentions target brand: +35 points
- URL has deep path (more complete than home page): +30 points

### Domain Authority
Authority represents the established trust level of the publisher. Evaluated separately:
- Government / Academic domains: 95
- Encyclopedia/Wikipedia: 88
- Owned domain baseline: 75
- Other known communities: 50-70
- Unknown domains: 40

---

## 4. Idempotency & Tenant Safety

- **Discovery Idempotency:** A pre-save check is run before saving occurrences. If the exact `(source_id, observation_id, url)` combination already exists, the discovery pipeline gracefully continues without duplicate insertions.
- **Tenant Isolation:** All operations are partitioned on `organization_id`, and fully enforced via database RLS policies.
