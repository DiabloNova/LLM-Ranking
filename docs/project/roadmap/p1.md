# SEOrchable: Pragmatic Execution & Stabilization Plan
**Core Principle:** *Strictly No Mocks. Data must flow from real external APIs to the database, and from the database to the UI.*

## Phase 1: Security, Identity & Data Foundation
**Goal:** Establish absolute truth for user identity, workspace isolation, and secure database interactions. We cannot build billing or intelligence without knowing exactly who is requesting it and securely isolating their data.

**Important Note for AI Assistants (Jules):** This phase is broken down into micro-sessions to respect context windows, avoid cascading errors, and ensure production-ready quality. Do NOT execute multiple sessions at once.

---

### Session 1.1: Core Schema Finalization
**Objective:** Define, refine, and connect the core Drizzle ORM tables (Users, Workspaces/Organizations, and API Keys) to establish a solid relational foundation.
*   **Target Files:** `database/schema/` directory (specifically `organization.ts`, `api-keys.ts`, and `index.ts`).
*   **Expected Output:** Type-safe schema definitions, correctly defined relations between tables, and a readiness for migration generation. No mock data structures.

### Session 1.2: PostgreSQL Row Level Security (RLS) Implementation
**Objective:** Implement database-level RLS policies to guarantee tenant isolation, ensuring no workspace data leaks to unauthorized users, regardless of application-layer bugs.
*   **Target Files:** `database/migrations/` (creating a new SQL migration script) and review existing logic in `docs/project/tasks/critical/RLS/`.
*   **Expected Output:** A precise SQL script enabling RLS on sensitive tables (e.g., audits, competitors, api_keys) with robust `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies based on `tenant_id` or `workspace_id`.

### Session 1.3: Server-Side Auth Utility Development
**Objective:** Build definitive server-side utilities to resolve user identity, removing any reliance on client-side state for authorization.
*   **Target Files:** Auth-related utility files (e.g., `src/lib/auth.ts` or relevant sections of `src/components/AuthProvider.tsx`).
*   **Expected Output:** Robust functions (e.g., `verifySession`, `getCurrentUser`) that securely read HTTP-only cookies and return the validated user ID and active workspace context.

### Session 1.4: Middleware & Route Protection
**Objective:** Construct a security perimeter around the dashboard to prevent unauthorized access before any page rendering occurs.
*   **Target Files:** `src/middleware.ts` (or the equivalent Next.js routing middleware).
*   **Expected Output:** An optimized middleware that validates the session cookie. Unauthorized users must be redirected to `/login`. Valid requests should forward necessary tenant headers for downstream layers.

### Session 1.5: Server Actions Security Wrapper
**Objective:** Secure all API endpoints and Server Actions by creating a protective wrapper that enforces authentication and tenant context.
*   **Target Files:** Files within `src/app/actions/` (e.g., `workspace.ts`, `auth.ts`) and a new utility file (e.g., `src/lib/safe-action.ts`).
*   **Expected Output:** A higher-order function (e.g., `authenticatedAction`) that wraps core logic. It must verify the user's identity and inject the correct database context for RLS before executing any database operations.
