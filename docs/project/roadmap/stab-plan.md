# SEOrchable: Pragmatic Execution & Stabilization Plan

**Core Principle:** Strictly No Mocks. Data must flow from real external APIs to the database, and from the database to the UI.

---

## Phase 1: Security, Identity & Data Foundation

**Goal:** Establish absolute truth for user identity, workspace isolation, and secure database interactions. We cannot build billing or intelligence without knowing exactly who is requesting it and securely isolating their data.

### Execution Steps:
1. **Auth & Session Enforcement:** Implement authoritative server-side session validation. Remove any reliance on client-side state for authorization.
2. **Tenant Isolation (RLS):** Implement PostgreSQL Row Level Security (RLS) policies. Ensure no query can accidentally leak data between workspaces.
3. **ORM Schema Finalization:** Solidify the Drizzle ORM schema for users, workspaces, organizations, and API keys.

### Requirements:
* **Hardware/Infra:** Managed PostgreSQL Database with connection pooling (e.g., Supabase, Neon, or your custom VPS Linux infrastructure).
* **Software/Services:** 
  * Drizzle ORM for schema and migrations.
  * Authentication Provider (e.g., Supabase Auth, Clerk, or NextAuth with secure HTTP-only cookies).

---

## Phase 2: Asynchronous Engine & Cost Control (The "No Mocks" Core)

**Goal:** Long-running tasks (like crawling a website or analyzing content with AI) will timeout on standard serverless functions. We must build a robust background job system before making real API calls.

### Execution Steps:
1. **Background Job Setup:** Implement the queue system for handling web scraping and AI processing asynchronously.
2. **Rate Limiting & Cost Tracking:** Before turning on real LLMs and crawlers, implement strict API request budgets and token usage tracking in the database to prevent budget overruns.
3. **Caching Layer:** Implement a caching mechanism for external API responses to avoid hitting paid endpoints for duplicate queries.

### Requirements:
* **Hardware/Infra:** Redis instance for caching and rate-limiting (e.g., Upstash or self-hosted Redis on your Linux VPS).
* **Software/Services:** 
  * Inngest (or similar durable execution engine) for managing async jobs, retries, and failures.
  * Upstash Redis SDK / standard Redis client.

---

## Phase 3: Real Data Acquisition & Intelligence Pipelines

**Goal:** Replace all hardcoded JSON and mock responses with actual live data from target websites and Language Models.

### Execution Steps:
1. **Crawler Integration:** Integrate the real web scraping/crawling API. Build pipelines to extract exact SEO signals (Headers, Meta, Schema, Core Web Vitals).
2. **LLM Integration:** Connect to real AI APIs (Gemini, Claude, OpenAI, DeepSeek). Feed the crawled data into the LLM prompts for AEO/GEO analysis.
3. **Data Persistence:** Save the raw crawled data and the AI-generated insights directly into your PostgreSQL database.

### Requirements:
* **Hardware/Infra:** Sufficient outbound network bandwidth and stable DNS resolution (Cloudflare routing is beneficial here).
* **Software/Services:** 
  * Web Crawling/Scraping API (e.g., Firecrawl, Apify, or custom Python/Playwright scrapers deployed on your servers).
  * LLM API Accounts with loaded credits (e.g., Google Gemini API, OpenAI API).
  * Proxy services/IP rotators (if you are running custom scrapers to avoid getting blocked).

---

## Phase 4: Billing, Credits & Access Control

**Goal:** Now that the engine works and costs money to run, we must implement the financial gates.

### Execution Steps:
1. **Credit System Implementation:** Create the database logic to deduct credits for every real audit, crawl, or AI request.
2. **Payment Gateway Integration:** Implement secure webhooks to handle successful payments, subscription upgrades, and credit top-ups.
3. **Service Locking:** Block access to Phase 3 engines if a user/workspace has insufficient credits.

### Requirements:
* **Hardware/Infra:** Secure, exposed API endpoint for receiving payment webhooks.
* **Software/Services:** 
  * Payment Gateway (e.g., Stripe, LemonSqueezy, or local Iranian gateways depending on your target market).
  * Webhook signature verification libraries.

---

## Phase 5: UI Reconciliation & Dashboard Integration

**Goal:** Connect the beautiful frontend (Phases 11-14) you have already built to the newly stabilized backend.

### Execution Steps:
1. **Remove Mocks:** Systematically go through `app/[locale]/dashboard/` and replace all static data with server-side database fetches using Drizzle. 
2. **Real-time Updates:** Connect the UI to the background job engine (Inngest) so users can see a real loading state while their site is being audited.
3. **Error Handling:** Implement proper UI error states for when a crawl fails or an AI API is down.

### Requirements:
* **Hardware/Infra:** Vercel or your current hosting environment (Next.js server environments).
* **Software/Services:** 
  * React Server Components / Server Actions for secure data fetching.
  * WebSockets or Polling mechanisms for real-time audit progress updates.

---

## Phase 6: Production Hardening & Observability

**Goal:** Ensure the system doesn't break under load and you have full visibility into errors.

### Execution Steps:
1. **E2E Testing:** Write end-to-end tests for the critical path: User logs in -> Buys credits -> Runs an AI Audit -> Views real results.
2. **Error Tracking:** Implement a service to catch unhandled exceptions in both the Next.js app and the background workers.
3. **Final Security Audit:** Re-verify RLS policies, CSRF protection, and ensure no API keys are exposed in the frontend bundle.

### Requirements:
* **Hardware/Infra:** Production-grade hosting with auto-scaling capabilities.
* **Software/Services:** 
  * Observability Platform (e.g., Sentry, Datadog, or self-hosted GlitchTip).
  * Testing Framework (Playwright or Cypress).
  * CI/CD Pipeline (GitHub Actions) to prevent deploying broken code.
