# Homepage Audit: UI and Content Risks

This document contains a read-only forensic audit of the homepage's actual UI, content, links, claims, interactive controls, and responsive-layout risks based on repository evidence.

## Phase 1 — Full Homepage Inventory

| Order | Section/Component Name | Source File | Purpose | Primary CTA | Secondary CTA | Content Classification |
|---|---|---|---|---|---|---|
| 1 | `Header` | `src/components/marketing/Header.tsx` | Global navigation and configuration (locale, theme). | "Free Audit" / "آنالیز رایگان" | "Login" / "ورود" | Real product data (links/toggles) |
| 2 | `AppSidebar` (Drawer) | `src/components/marketing/Header.tsx` (imported) | Mobile/Slide-out navigation menu. | None (Navigation) | None | Real product data |
| 3 | `Hero` | `src/components/marketing/Hero.tsx` | Value proposition and entry to the free audit funnel or dashboard access. | "Start free audit" / "شروع بررسی رایگان" (if unauthenticated) or "Enter admin console" (if authenticated) | None | Mixed (Marketing claims & illustrative UI video placeholder) |
| 4 | `FreeAuditPanel` | `src/app/[locale]/page.tsx` -> `src/components/features/audit/FreeAuditPanel.tsx` | Interactive tool to submit a domain for a simulated/real audit. | "Analyze Brand Visibility" | Inline Tab "Sign In" or "Register" if auth required | Real product data (Interactive forms, logs, data panels) |
| 5 | High-Fidelity Mock Dashboards | `src/app/[locale]/page.tsx` | Previews the product's workspace across 6 modules. | "Start Technical Scan" | None | Illustrative UI ("Illustrative data" badge present) |
| 6 | `LiveKnowledgeGraph` | `src/app/[locale]/page.tsx` -> `src/components/features/graph/LiveKnowledgeGraph.tsx` | Visualizes semantic discoverability and tracking. | None | None | Illustrative UI (Values fluctuate randomly via `Math.random()`) |
| 7 | Product Lifecycle Story | `src/app/[locale]/page.tsx` | Explains the step-by-step workflow (8 steps). | None | None | Static marketing claim |
| 8 | Enterprise Trust Layer | `src/app/[locale]/page.tsx` | Highlights security, privacy, and payment infrastructure. | None | None | Static marketing claim |
| 9 | Platform Overview (12 Modules) | `src/app/[locale]/page.tsx` | Grid describing 12 distinct capabilities. | "Explore module" (implied via UI, no actual link wrapper) | None | Static marketing claim |
| 10 | Product Ecosystem | `src/app/[locale]/page.tsx` | Explains how the pipeline stages connect. | None | None | Static marketing claim |
| 11 | Traditional SEO vs. GEO (Table) | `src/app/[locale]/page.tsx` | Compares classic SEO features against GEO features. | None | None | Static marketing claim |
| 12 | Documentation Hub Preview | `src/app/[locale]/page.tsx` | Grid of links to technical documentation. | "Read docs" for each card | None | Mixed (Real links, Marketing descriptions) |
| 13 | Enterprise Resource Center | `src/app/[locale]/page.tsx` | Grid of links to blog, case studies, roadmap. | "Read resource" | None | Mixed (Real links, Marketing descriptions) |
| 14 | Flexible Enterprise Pricing | `src/app/[locale]/page.tsx` | Displays three pricing tiers. | "Choose Growth Plan" | "Select Starter Plan", "Contact Sales" | Static marketing claim |
| 15 | Enterprise CTA Area | `src/app/[locale]/page.tsx` | Final bottom page call to action. | "Start Free Audit Scanner" | "Contact Sales Unit" | Static marketing claim |
| 16 | `LandingFooter` | `src/components/marketing/LandingFooter.tsx` | Standard enterprise footer with 6 groups of links and social channels. | None | None | Real product data (Navigation) |

## Phase 2 — Complete Link Inventory

| Visible Label | Source File | Destination | Internal/External | Locale-Aware | Actual Route Existence | Status |
|---|---|---|---|---|---|---|
| Platform Items (Dropdown) | `src/components/marketing/Header.tsx` | `/{language}/features`, `/{language}/industries`, `/{language}/#ecosystem`, `/{language}/#overview`, `/{language}/#story` | Internal | Yes | `features`, `industries` exist. Anchors exist on `page.tsx`. | Valid |
| Solutions Items (Dropdown) | `src/components/marketing/Header.tsx` | `/{language}/solutions/geo`, `/{language}/solutions/aeo`, `/{language}/solutions/protection`, `/{language}/solutions/radar`, `/{language}/solutions` | Internal | Yes | All routes exist under `solutions/`. | Valid |
| Why Us | `src/components/marketing/Header.tsx` | `/{language}/#why-different` | Internal | Yes | Anchor exists. | Valid |
| Pricing | `src/components/marketing/Header.tsx` | `/{language}/#pricing` | Internal | Yes | Anchor exists. | Valid |
| Documentation | `src/components/marketing/Header.tsx` | `/{language}/docs` | Internal | Yes | Route exists. | Valid |
| Resources | `src/components/marketing/Header.tsx` | `/{language}/resources` | Internal | Yes | Route exists. | Valid |
| About | `src/components/marketing/Header.tsx` | `/{language}/about` | Internal | Yes | Route exists. | Valid |
| Contact | `src/components/marketing/Header.tsx` | `/{language}/contact` | Internal | Yes | Route exists. | Valid |
| Invoice Payment | `src/components/marketing/Header.tsx` | `/{language}/invoice` | Internal | Yes | Route exists. | Valid |
| Login | `src/components/marketing/Header.tsx` | `/{language}/login` | Internal | Yes | Route exists. | Valid |
| Free Audit | `src/components/marketing/Header.tsx` | `/{language}/#free-audit` | Internal | Yes | Anchor exists. | Valid |
| Enter admin console | `src/components/marketing/Hero.tsx` | `/{language}/dashboard` | Internal | Yes | Route exists. | Valid |
| Start free audit | `src/components/marketing/Hero.tsx` | Triggers function to redirect to `/{language}/register?email=...` | Internal | Yes | Route exists. | Valid |
| Start Technical Scan | `src/app/[locale]/page.tsx` | Triggers scroll to `#free-audit` | Internal | N/A | Anchor exists. | Valid |
| Read docs (8x cards) | `src/app/[locale]/page.tsx` | `/{locale}/docs/[slug]` (e.g. `introduction-to-brandgraph`, `infrastructure-architecture`, `ai-pipeline-architecture`, `multi-tenant-isolation`, `knowledge-graph-design`) | Internal (target="_blank") | Yes | `docs/[slug]` route structure exists. | Valid (Though multiple cards link to the same duplicated slugs like `ai-pipeline-architecture`) |
| Blog / Case Studies | `src/app/[locale]/page.tsx` | `/{locale}/blog` | Internal | Yes | Route exists. | Valid |
| Changelog & Roadmap | `src/app/[locale]/page.tsx` | `/{locale}/dashboard` | Internal | Yes | Route exists. | Misleading (Dashboard is not a public roadmap) |
| Starter/Growth Plans | `src/app/[locale]/page.tsx` | Triggers scroll to `#free-audit` | Internal | N/A | Anchor exists. | Misleading (Pricing CTAs lead to the free audit funnel instead of checkout/registration). |
| Contact Sales | `src/app/[locale]/page.tsx` | `/{locale}/contact` | Internal | Yes | Route exists. | Valid |
| Start Free Audit Scanner | `src/app/[locale]/page.tsx` | Triggers scroll to `#free-audit` | Internal | N/A | Anchor exists. | Valid |
| Footer Products (6 items) | `src/components/marketing/LandingFooter.tsx` | `/{language}/dashboard`, `/{language}/dashboard/audits`, `/{language}/dashboard/entities`, `/{language}/dashboard/query` | Internal | Yes | Dashboard routes exist. | Valid |
| Footer Services (5 items) | `src/components/marketing/LandingFooter.tsx` | `/{language}/solutions/geo`, `aeo`, `protection`, `radar`, `contact` | Internal | Yes | Routes exist. | Valid |
| Footer Docs (5 items) | `src/components/marketing/LandingFooter.tsx` | `/{language}/docs/[slug]` | Internal (target="_blank") | Yes | Routes exist. | Valid |
| Footer Resources (7 items)| `src/components/marketing/LandingFooter.tsx` | `resources`, `#free-audit`, `blog`, `docs/[slug]` | Internal | Yes | Routes exist. | Valid |
| Footer Company (7 items) | `src/components/marketing/LandingFooter.tsx` | `features`, `industries`, `solutions`, `about`, `contact`, `dashboard` | Internal | Yes | Routes exist. | Valid (Roadmap links to dashboard again, misleading) |
| Footer Legal (3 items) | `src/components/marketing/LandingFooter.tsx` | `/{language}/privacy` | Internal | Yes | Route exists. | Valid |
| Social channels | `src/components/marketing/LandingFooter.tsx` | `/{language}`, `mailto:info@seorchable.ir` | Mixed | Yes | Route exists. | Valid |

## Phase 3 — Complete Claim Inventory

| Claim | Source File | Category | Repository Evidence | Verification Status |
|---|---|---|---|---|
| "SSO & MFA Ready" / "Access is scoped to the authenticated workspace" | `src/app/[locale]/page.tsx` | Compliance/Security | Uses session authentication via `src/components/AuthProvider.tsx`. Evidence of workspaces exists. | Verified by repository evidence |
| "Audit-ready workflows" | `src/app/[locale]/page.tsx` | Compliance/Security | Dashboard routes exist, but detailed audit logs cannot be verified from the homepage context. | Requires product evidence |
| "Workspace privacy" / "Privacy controls are designed around workspace-level data boundaries." | `src/app/[locale]/page.tsx` | Compliance/Security | Mentioned in context (TenantContextManager), but cannot be fully verified from UI alone. | Requires product evidence |
| "Iran Payment Support" / "پشتیبانی کامل از درگاه‌های پرداخت عضو شبکه شتاب" | `src/app/[locale]/page.tsx` | Integrations/Payments | `src/app/[locale]/invoice` route exists, webhooks referenced in system instructions. | Verified by repository evidence |
| "Twelve Specialized AI Modules" | `src/app/[locale]/page.tsx` | Product Capabilities | Lists 12 modules in UI. The dashboard has some corresponding routes (audits, competitors, entities, query), but 12 fully distinct modules cannot be verified from static code. | Requires product evidence |
| "Traditional SEO vs. Generative Engine Optimization" Comparison | `src/app/[locale]/page.tsx` | Competitive Superiority | Marketing table. | Not verifiable from repository |
| Pricing: Starter ($49), Growth ($149), Enterprise (Custom) | `src/app/[locale]/page.tsx` | Quantified/Pricing | Static marketing claims. Clicking buy loops back to the free audit funnel. | Not verifiable from repository |
| Pricing Features: "Track up to 50 brand keywords", "Crawl up to 3,000 pages/mo" | `src/app/[locale]/page.tsx` | Quantified/Capabilities | Static marketing text in pricing cards. | Requires product evidence |
| "LIVE TELEMETRY STREAM" / "60 FPS rendering | Real-time continuous analysis synced" | `src/components/features/graph/LiveKnowledgeGraph.tsx` | "Live"/Performance | The graph renders at 60 FPS using RequestAnimationFrame, but data is simulated via `Math.random()` and `setInterval`, not actual live telemetry. | Not verifiable from repository (Actually false based on source) |
| Free Audit: "This multi-stage process takes approximately 4 seconds." | `src/components/features/audit/FreeAuditPanel.tsx` | Performance | Hardcoded marketing string during the processing state. | Requires product evidence |

## Phase 4 — Interactive Control Inventory

| Control | Source File | Accessible Name / Label | Focus Behavior | States |
|---|---|---|---|---|
| Header Mobile Menu | `src/components/marketing/Header.tsx` | `aria-label="Open navigation menu"` | Observable standard focus ring. | Implemented: Focus. Not applicable: Loading, Error, Disabled, Success. |
| Header Dropdowns | `src/components/marketing/Header.tsx` | Uses visible text "Platform", "Solutions" | Custom dropdown component logic (requires runtime check). | Implemented: Hover. Not verifiable from static code: Keyboard nav inside dropdowns. |
| Language Toggle | `src/components/marketing/Header.tsx` | `aria-label` provided (e.g. "Switch to English") | Focusable `<button>`. | Implemented: Focus. Not applicable: Loading, Error, Disabled. |
| Theme Toggle | `src/components/marketing/Header.tsx` | `aria-label` provided | Focusable `<button>`. | Implemented: Focus. Not applicable: Loading, Error, Disabled. |
| Hero Email Input | `src/components/marketing/Hero.tsx` | `aria-label="Business email"` | Standard input focus. | Implemented: Focus. Not implemented: Disabled state when loading is true (only button disables). |
| Hero Submit Button | `src/components/marketing/Hero.tsx` | "Start free audit" | Standard button focus. | Implemented: Loading (text changes to "Opening audit"), Disabled (when `isLoading` is true). |
| Dashboard Tabs | `src/app/[locale]/page.tsx` | Visible text (e.g., "Visibility Score Dashboard") | Focusable `<button>`. Active state handled via custom classes. | Implemented: Focus, Active (Success/Selected). Not applicable: Loading, Error, Disabled. |
| Free Audit Input | `src/components/features/audit/FreeAuditPanel.tsx` | No `aria-label`, relies on `placeholder`. | Standard input focus. | Implemented: Focus, Error (displays banner). |
| Free Audit Submit | `src/components/features/audit/FreeAuditPanel.tsx` | "Analyze Brand Visibility" | Standard button focus. | Implemented: Disabled (when url is empty). |
| Free Audit Auth Tabs | `src/components/features/audit/FreeAuditPanel.tsx` | "Sign In", "Register Workspace" | Focusable `<button>`. | Implemented: Active state. |
| Free Audit Auth Inputs | `src/components/features/audit/FreeAuditPanel.tsx` | Labels provided via `<Input label="..." />`. | Handled by `Input` component. | Implemented: Disabled (during loading). |
| Free Audit Auth Submit | `src/components/features/audit/FreeAuditPanel.tsx` | "Authenticate & Run Audit" / "Create Account..." | Standard button focus. | Implemented: Loading (spinner, text change), Disabled, Error (banner above form). |
| Live Graph Legend Items| `src/components/features/graph/LiveKnowledgeGraph.tsx` | Visible metric names | `<div onClick=...>` Used for hover. Lacks `tabIndex`, `role="button"`, and keyboard handlers. | Not implemented: Keyboard focus, accessibility roles. |

## Phase 5 — Responsive and Layout Risk Inventory

### Desktop Risks

*   **Free Audit Auth Gate (`src/components/features/audit/FreeAuditPanel.tsx`)**: Modal-like card has `max-w-lg mx-auto`. Safe on desktop.
*   **Live Knowledge Graph Tooltip (`src/components/features/graph/LiveKnowledgeGraph.tsx`)**: Absolute positioning based on mouse coordinates. Risk of clipping on the right or bottom edges if the cursor is near the edge of the canvas, as there is no boundary-checking logic implemented in `handleMouseMove`.
*   **Module Overview Grid (`src/app/[locale]/page.tsx`)**: `grid sm:grid-cols-2 lg:grid-cols-4`. Safe wrapping.
*   **Comparison Table (`src/app/[locale]/page.tsx`)**: Contains `<div className="overflow-x-auto">`. Safe, prevents desktop overflow.
*   **Product Ecosystem Grid (`src/app/[locale]/page.tsx`)**: `grid md:grid-cols-7 gap-4`. Extremely dense 7-column layout on medium/large screens. High risk of text truncation or overlap inside cards, especially in Persian where words can be longer.

### Mobile Risks

*   **Header Navigation (`src/components/marketing/Header.tsx`)**: Floating nav container has limited space. It relies on the `AppSidebar` drawer, which handles overflow gracefully. Toggles are hidden/shown using `sm:inline` and `hidden sm:inline-block`. Safe.
*   **Hero Dashboard Showcase (`src/components/marketing/Hero.tsx`)**: Uses `aspect-video`, scales down safely.
*   **High-Fidelity Mock Dashboards (`src/app/[locale]/page.tsx`)**: `grid lg:grid-cols-[280px_1fr]`. On mobile, it stacks. The mock dashboard viewport has a fixed minimum height (`min-h-[460px]`) and contains complex inner grids (`grid grid-cols-1 sm:grid-cols-3`). Safe stacking.
*   **Product Lifecycle Timeline (`src/app/[locale]/page.tsx`)**: `grid md:grid-cols-4 lg:grid-cols-8 gap-6`. On mobile, it stacks in 1 column. Safe, though very tall.
*   **Product Ecosystem Grid (`src/app/[locale]/page.tsx`)**: `grid md:grid-cols-7`. Stacks into a single column on mobile. Arrows between steps are hidden on mobile (`hidden md:block`). Safe.
*   **Comparison Table (`src/app/[locale]/page.tsx`)**: Uses `overflow-x-auto`. Requires horizontal scrolling on mobile, which is standard, but the container relies on user discovery of scrollability.
*   **Live Knowledge Graph Canvas (`src/components/features/graph/LiveKnowledgeGraph.tsx`)**: Uses `w-full h-[280px] sm:h-[400px]`. Scales safely. Tooltips on mobile touch devices may trigger erratically due to relying solely on `onMouseMove` rather than explicit touch events (`onTouchStart`, `onTouchMove`).

## Keep

*   **Form States**: The `FreeAuditPanel` effectively handles complex state transitions (idle, auth-required, processing, completed, error) and properly disables forms/buttons during loading states. (Evidence: `src/components/features/audit/FreeAuditPanel.tsx`).
*   **Desktop/Mobile Layout Strategies**: The usage of `overflow-x-auto` for the large comparison table and the stacking grids for 12-module features prevents catastrophic page-level horizontal scrolling. (Evidence: `src/app/[locale]/page.tsx`).
*   **Theme and Locale Integrations**: The `Header` implements immediate toggles that are accessible and functional. (Evidence: `src/components/marketing/Header.tsx`).

## Change

*   **Trust/Product-vs-Marketing Clarity (High Priority)**: The "Live Knowledge Graph" claims to be a "REAL-TIME SEMANTIC VISIBILITY ENGINE" with "60 FPS rendering | Real-time continuous analysis synced", but the data is explicitly driven by `Math.random()` simulation. This is highly misleading. It must be clearly labeled as an illustrative simulation, similar to the mock dashboards section. (Evidence: `src/components/features/graph/LiveKnowledgeGraph.tsx`).
*   **Conversion Clarity (High Priority)**: The "Changelog & Roadmap" link points back to the `/dashboard`. Pricing plan "Purchase/Select" buttons (Starter, Growth) scroll the user back to the `#free-audit` funnel instead of taking them to a checkout or registration flow. This breaks the conversion path. (Evidence: `src/app/[locale]/page.tsx`).
*   **Accessibility (Medium Priority)**: The `LiveKnowledgeGraph` legend items are `<div>` elements with `onMouseEnter` handlers. They lack `tabIndex={0}`, `role="button"`, and keyboard event handlers (`onKeyDown`), making them inaccessible to keyboard users. (Evidence: `src/components/features/graph/LiveKnowledgeGraph.tsx`).
*   **Accessibility (Medium Priority)**: The main `FreeAuditPanel` input field lacks an explicit `aria-label` or associated `<label>`, relying solely on the visual placeholder. (Evidence: `src/components/features/audit/FreeAuditPanel.tsx`).

## Remove

*   **Misleading Navigation Destinations**: Remove or correct the duplicated/placeholder documentation slugs (e.g., `ai-pipeline-architecture` is used twice for different cards). (Evidence: `src/app/[locale]/page.tsx` Documentation Grid).
*   **7-Column Grid Layout**: The `md:grid-cols-7` layout in the Product Ecosystem section should be removed or restructured for medium screens, as it poses a severe risk of text truncation and layout breakage on tablet-sized displays. (Evidence: `src/app/[locale]/page.tsx`).
