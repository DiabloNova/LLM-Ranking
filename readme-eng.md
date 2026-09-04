# SEOrchable

> **Languages:** English (this file) · [فارسی](./readme.md)

Brand visibility intelligence for answer engines and large language models.

---

## What this project is

Search engines are no longer the only destination. A large and growing share of queries now get answered directly inside ChatGPT, Gemini, Claude and Perplexity: the user reads the answer and never clicks a link. In that world, traditional SEO tooling answers the wrong question. It tells you where you rank on Google. It does not tell you whether, when someone asks a language model about your category, **your brand gets named at all, how it gets described, and which competitors get named alongside it.**

SEOrchable exists to answer that question.

The platform covers three interlocking layers:

- **AEO (Answer Engine Optimization)** — measuring how, and how accurately, your brand appears in LLM-generated answers.
- **GEO (Generative Engine Optimization)** — analysing your position in generative search results and identifying semantic gaps against competitors.
- **Technical SEO and knowledge graph** — auditing technical infrastructure, structured data and entity relationships: the substrate that determines how correctly a model can understand your content in the first place.

---

## Why we are building it

The SEO tooling market is full of products that measure one metric and call it done. The real problem for marketing and SEO teams is not a shortage of data. It is that their data is scattered across several disconnected tools, none of which produces a complete picture of how the brand is perceived in the AI layer.

The goal is a single source of truth for brand visibility: site crawling and entity extraction, LLM citation monitoring, competitive analysis, and actionable content recommendations, all in one product on one shared data model.

Three design principles the project is built on:

1. **Hard tenant isolation.** Every organization is an independent data boundary, enforced by PostgreSQL Row Level Security rather than by application-layer filtering.
2. **Fail loud, never silent.** Every infrastructure failure must surface as a failure. No path in the product is permitted to present absent data as real data.
3. **Persian-first, genuinely bilingual.** The interface and analysis output were designed for Persian (RTL) and English (LTR) from the start, not retrofitted as a translation layer.

---

## Core capabilities

| Area | Description |
|---|---|
| SEO & AEO audits | Fast free audit plus a deep premium audit with full-site crawling |
| Citation monitoring | Tracks where and how your brand is mentioned in LLM answers |
| Competitive intelligence | Compares your semantic coverage and positioning against identified competitors |
| Knowledge graph | Extracts entities and relationships from site content into an explorable graph |
| Content studio | Generates and optimizes content against identified semantic gaps |
| Technical SEO | Analyses structured data, technical health and internal link structure |
| RAG query | Natural-language querying over your organization's crawled corpus |

---

## Architecture

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.11 (App Router) · React 19.2.4 · TypeScript |
| Database | PostgreSQL with Drizzle ORM · tenant isolation via RLS |
| Job queue | Inngest for long-running work (crawls, LLM calls) |
| Cache & rate limiting | Upstash Redis |
| Web crawling | Firecrawl |
| LLM | Google Generative AI SDK |
| Validation | Zod |
| UI | Tailwind CSS v4 · Framer Motion · Recharts |

### Directory layout

```
src/app/[locale]/     Marketing and dashboard pages (fa, en)
src/app/api/          HTTP route handlers
src/app/actions/      Server Actions
src/services/         Cross-cutting services (auth, crawler, AI)
src/features/         Vertical product modules (domain / application / infrastructure)
src/core/             Database, cache, container, tenant context
database/schema/      Drizzle table definitions (source of truth)
database/migrations/  Hand-written SQL migrations
docs/                 Product and architecture documentation
tests/                Test suites
```

---

## Getting started

**Prerequisites:** Node.js 20+ · pnpm · access to a PostgreSQL instance

```bash
pnpm install
cp .env.example .env.local
# fill in the environment variables in .env.local
pnpm db:migrate
pnpm dev
```

The app comes up on `http://localhost:3000`.

### Environment variables

The full list with per-variable explanations lives in `.env.example`. Variables that are **mandatory in production**:

| Variable | Role |
|---|---|
| `DATABASE_URL` | Runtime PostgreSQL connection |
| `SESSION_SECRET` | Session cookie signing key; minimum 32 characters |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Cache and rate limiting |
| `FIRECRAWL_API_KEY` | Web crawling |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Semantic analysis |

> **Warning:** `MIGRATION_DATABASE_URL` is for running migrations only. It must never be referenced from runtime code, API routes, or client-side code. Migrations never run during `next build` or at application startup.

---

## Commands

```bash
pnpm dev                # development server
pnpm build              # production build
pnpm start              # serve the production build
pnpm lint               # ESLint
pnpm exec tsc --noEmit  # type check
pnpm db:generate        # generate a migration with drizzle-kit
pnpm db:migrate         # apply migrations
pnpm test:acquisition   # acquisition module tests
```

---

## Working with AI coding agents

This repository ships an [`AGENTS.md`](./AGENTS.md) at the root defining the mandatory rules for any coding agent (Jules, Codex, Copilot, Cursor): security boundaries, an absolute prohibition on fabricated data, the permitted file-change scope, and the required report format.

If you are working on this repository with an agent, read that file first. Agents read it automatically at the start of every session.

---

## Project status

The project is transitioning from prototype to production-ready product. The phased execution roadmap for that transition, with explicit acceptance criteria per step, is maintained in `docs/ROADMAP.md`.

Documentation in this repository describes **implemented functionality only**. Where documentation and code disagree, the code is the source of truth.
