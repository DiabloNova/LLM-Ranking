# SEOrchable: Consolidated Jules Roadmap

## Purpose

This is the replacement for the earlier backend and frontend roadmaps. It removes prompts whose work has already been completed in the remediation passes and keeps only work that still needs Jules. Every prompt is intentionally single-purpose: one session, one focused diff, one PR.

## Work already completed and therefore removed

The following items are done and must not be scheduled again:

- Password hashing and password-aware `loginAction` / `registerAction` contract.
- `SESSION_SECRET` production enforcement.
- Server-side session hydration wiring in `AuthProvider` and the locale layout.
- Locale-safe protected redirects.
- Removal of artificial authentication delays.
- The missing `src/app/actions/audit.ts` file restoration.
- Firecrawl response normalization for the `Document[]` type mismatch.
- Removal of the fabricated premium-audit `competitorComparison` UI.
- Initial keyboard-focus, touch-target, reduced-motion and page-overflow CSS baseline.
- Homepage copy cleanup, product naming cleanup, removal of unsupported compliance claims, honest static-preview labelling, corrected login CTA, and removal of placeholder social destinations.

The homepage is still a large client component, and that is intentionally retained for the dedicated extraction tasks below. Do not re-add removed mock data or unsupported claims while refactoring it.

## Jules operating rules

`AGENTS.md` is loaded automatically. Prompts below only contain task scope and acceptance criteria. Reject any Jules plan that touches files outside `SCOPE`. Merge each PR before the next task. Never let Jules invent API responses, demo metrics, compliance certifications, customer results, SDKs, integrations or media assets.

Before every task: select the repository and `main`, paste exactly one prompt, review the plan, approve only an in-scope plan, review the diff, run the stated checks, then merge.

---

## Phase 1: Homepage architecture and conversion quality

### H1.1: Homepage evidence inventory, read-only

```text
TASK
Create a read-only inventory of the homepage's actual UI and content risks.

CONTEXT
The homepage is src/app/[locale]/page.tsx, 947 lines, and currently owns state, refs, mock product
panels, a free-audit funnel, a product lifecycle section, trust content, module overview, ecosystem
flow, comparison table, documentation preview, resource center, pricing and final CTA. Header is
src/components/marketing/Header.tsx. Footer is src/components/marketing/LandingFooter.tsx. Hero is
src/components/marketing/Hero.tsx.

REQUIREMENTS
1. Create docs/HOMEPAGE-AUDIT.md only. Change no source code.
2. Inventory every section in DOM order and record its purpose, primary CTA, secondary CTA, and
   whether its content is real product data, illustrative UI, or a static marketing claim.
3. Record every link destination and flag broken, duplicate, unlocalized, placeholder or
   misleading destinations. Verify every destination against the actual route tree.
4. Record every heading, paragraph and badge that makes a quantified, compliance, integration,
   "live", "real", "guaranteed", customer-result or capability claim. Mark each as verified or
   requiring product evidence. Do not guess.
5. Record every interactive control: keyboard focus, accessible name, loading, error, disabled and
   success state as observed in code.
6. Record desktop and mobile layout risks from the actual class names: overflow, fixed elements,
   dense grids, tiny text, nested buttons/links and touch targets.
7. End with exactly three sections: Keep, Change, Remove. Prioritise conversion clarity, trust and
   accessibility.

SCOPE
docs/HOMEPAGE-AUDIT.md only.

DONE WHEN
Every homepage section, link, claim and interactive control is accounted for with a file citation.
No source file changes.
```

### H1.2: Extract the homepage stateful product preview

```text
TASK
Extract the homepage product-preview tab state into a dedicated client island without changing the visual output.

CONTEXT
src/app/[locale]/page.tsx owns activeDashboardTab, scroll refs and six large conditional preview
panels: visibility, authority, citation, competitor, graph and timeline. The page is 947 lines and
starts with "use client". The section is a visual product preview, not a live customer dashboard;
its values must remain explicitly illustrative.

REQUIREMENTS
1. Create src/components/marketing/home/ProductPreview.tsx with "use client".
2. Move only the activeDashboardTab state and the six conditional preview panels into it.
3. Preserve the exact visible copy, layout, direction, theme and tab behaviour, including the
   existing illustrative-data notice.
4. Keep one stable accessible tablist/tab pattern: each tab has an accessible name, selected state,
   keyboard activation and controls the correct panel.
5. Keep tab identifiers typed as a union. Do not use `any` for the tab id.
6. The server page passes locale and any static data needed by props; do not duplicate data in the
   island if it can be passed down.
7. Do not add a chart library, fetch, fake loading state or new visual system.

SCOPE
src/app/[locale]/page.tsx, new src/components/marketing/home/ProductPreview.tsx only.

DONE WHEN
Typecheck and lint pass. Product preview behaviour is unchanged. Report the before/after line count
of the page and the exact state moved.
```

### H1.3: Extract homepage scroll CTAs and refs

```text
TASK
Move homepage scroll refs and scroll handlers into a small client island boundary.

CONTEXT
src/app/[locale]/page.tsx owns freeAuditRef, platformOverviewRef, dashboardsRef and scrollToRef.
The page should become a server component, but scrollIntoView and useRef are browser-only. Product
Preview state was extracted in H1.2.

REQUIREMENTS
1. Identify every useRef, useState, useEffect, browser API and event handler still remaining in
   src/app/[locale]/page.tsx.
2. Create the smallest possible client island under src/components/marketing/home/ that owns only
   the remaining scroll interactions.
3. Preserve section ids, anchor destinations, smooth scrolling and RTL behaviour.
4. Do not move static markup merely for convenience.
5. Do not change styling or copy.

SCOPE
src/app/[locale]/page.tsx and new client-island files under src/components/marketing/home/ only.

DONE WHEN
The report lists every browser-only dependency removed from the server page. Typecheck/lint/build
pass and every existing homepage CTA still lands on the same section.
```

### H1.4: Convert homepage to a server page

```text
TASK
Convert src/app/[locale]/page.tsx to a Server Component and add localized metadata.

CONTEXT
After H1.2 and H1.3, the homepage should contain only server-safe markup plus imported client
islands. It currently cannot export metadata because of "use client". The app uses fa RTL and en
LTR. Use the existing metadata pattern from src/app/[locale]/services/[slug]/page.tsx. Do not
reintroduce gradient text, unsupported claims or fake live-data language removed in the homepage
polish pass.

REQUIREMENTS
1. Remove "use client" from the page.
2. Await locale params in the server page.
3. Add generateMetadata with genuinely different fa/en title and description for the homepage,
   canonical URL, both locale alternates and Open Graph data.
4. Pass locale to client islands; do not read locale from localStorage in page markup.
5. Preserve section order, ids, links, content, themes and RTL/LTR output.
6. Do not convert Header, Hero, Footer or dashboard pages in this task.
7. Do not change any backend contract.

SCOPE
src/app/[locale]/page.tsx only, plus imports of islands already created in H1.2/H1.3.

DONE WHEN
The homepage builds as a server page, has unique fa/en metadata and no hooks. The visible output
is unchanged except for metadata and the already-approved copy polish.
```

### H1.5: Honest Hero preview and conversion path

```text
TASK
Finish the Hero conversion surface so it clearly distinguishes a static product preview from a live result.

CONTEXT
src/components/marketing/Hero.tsx contains the homepage hero, an email capture form, and a static
workspace preview. It must not imply a live sandbox, guaranteed uplift, real-time data or a video
when no video asset/player is wired. The form redirects to the localized registration route.

REQUIREMENTS
1. Preserve the current product-first visual composition and both themes.
2. Ensure the headline says what the product measures and who it helps, not a vague promise of
   becoming the first choice.
3. Keep one primary CTA: start the free audit or registration path. Remove competing equal-weight
   actions from the hero.
4. Label the static preview as illustrative/static in both locales.
5. Remove unsupported quantified chips, "live", "guarantee", "military-grade", certification or
   integration claims from this component. Do not replace them with new unsupported claims.
6. The email input has a label or accessible name, email autocomplete, invalid state and pending
   state. It must not expose the email in logs.
7. Do not add a video or external media asset in this task.

SCOPE
src/components/marketing/Hero.tsx only.

DONE WHEN
A first-time visitor can answer what SEOrchable does, who it is for and what the next click does
within five seconds. Typecheck/lint/build pass.
```

### H1.6: Navigation and footer integrity

```text
TASK
Make the homepage Header and LandingFooter accurate, compact and route-safe.

CONTEXT
Header is src/components/marketing/Header.tsx and Footer is src/components/marketing/LandingFooter.tsx.
The current surfaces contain deeply nested navigation, a login button that must not point to a
protected dashboard, internal docs opened in a new tab, and social links that may be placeholders.
The footer also contains claims that must match implemented features.

REQUIREMENTS
1. Verify every internal destination against src/app/[locale] and preserve locale prefixes.
2. Login points to /{locale}/login. Protected dashboard links remain clearly labelled as workspace
   links.
3. Internal documentation opens in the same tab. External links use target/rel only when the
   destination is verified and real in repository configuration.
4. Keep the header within a single 44px+ touch-friendly navigation system at mobile widths.
5. Preserve the existing menu drawer but ensure Escape closes it, background interaction is blocked
   while open, and focus returns to the menu trigger.
6. Remove unsupported claims, duplicate nav paths and placeholder external destinations. Do not
   invent social profiles.
7. Keep light/dark, fa/en and RTL/LTR behaviour.

SCOPE
src/components/marketing/Header.tsx, src/components/marketing/LandingFooter.tsx and only the
minimum directly-required CSS.

DONE WHEN
Every internal link resolves, mobile drawer keyboard behaviour is verified, and the report lists
removed or corrected links and claims.
```

### H1.7: Homepage visual QA and responsive fixes

```text
TASK
Fix only the responsive layout defects found in the homepage audit at 320px, 375px, 768px and 1440px.

CONTEXT
The homepage has dense tab panels, tables, eight-step timelines, twelve module tiles, pricing
columns, decorative absolute layers and a fixed header. It must not create page-level horizontal
scroll or unreadable controls. Intentional tables may scroll inside their own wrapper.

REQUIREMENTS
1. Use the actual browser or available local visual check to inspect the four widths.
2. Fix overflow, clipped text, controls below 44px, unreadable contrast, fixed-header overlap and
   broken RTL ordering only where observed.
3. Do not redesign sections or change copy, route structure, data or component architecture.
4. Use intrinsic grids and an intentional horizontal wrapper for wide comparison tables.
5. Verify light and dark themes and both locales after each layout fix.
6. Respect prefers-reduced-motion.

SCOPE
Homepage-related files only: src/app/[locale]/page.tsx, src/components/marketing/Hero.tsx,
src/components/marketing/Header.tsx, src/components/marketing/LandingFooter.tsx, extracted home
islands and directly-required CSS.

DONE WHEN
No page-level horizontal scroll at all four widths. Report each defect, file and fix, with screenshots
or measured evidence for fa/en and light/dark.
```

---

## Phase 2: Public page rendering and discoverability

### P2.1: Metadata helper

```text
TASK
Create one server-only helper for localized public-page metadata.

CONTEXT
The service detail page contains the only complete metadata pattern. Public pages under
src/app/[locale] mostly start with "use client" and inherit generic metadata. siteConfig is in
src/config/site.ts.

REQUIREMENTS
1. Create src/lib/seo/metadata.ts with buildPageMetadata({locale,path,title,description,ogImage?,noIndex?}).
2. Return localized title/description, absolute canonical, fa/en hreflang, Open Graph and Twitter
   summary_large_image.
3. Read the domain from siteConfig. Do not hardcode it.
4. Keep imports server-safe.
5. Refactor only src/app/[locale]/services/[slug]/page.tsx to use the helper as proof.

SCOPE
src/lib/seo/metadata.ts and src/app/[locale]/services/[slug]/page.tsx only.

DONE WHEN
Both locale service pages build with distinct title, description, canonical and alternates.
```

### P2.2: Robots and sitemap

```text
TASK
Add production-safe robots.txt and a complete public sitemap.

CONTEXT
The repository has no src/app/robots.ts or src/app/sitemap.ts. Public routes are under
src/app/[locale]. Service slugs come from servicesData; docs slugs come from DOCS_INDEX.

REQUIREMENTS
1. Add MetadataRoute.Robots and MetadataRoute.Sitemap handlers using the installed Next.js version.
2. Disallow all non-production deployments.
3. In production exclude /api/, dashboard, settings, profile, invoice, login, register,
   forgot-password and verify-email for both locales.
4. Include both locales, all public static routes, servicesData keys and DOCS_INDEX slugs.
5. Add fa/en alternates to every sitemap entry and read the domain from siteConfig.

SCOPE
src/app/robots.ts, src/app/sitemap.ts only.

DONE WHEN
Build emits both routes, exact URL count is reported, and no excluded route appears.
```

### P2.3 to P2.6: Public page conversion batches

Run each row as a separate Jules session.

| Task | Pages |
|---|---|
| P2.3 | pricing, features |
| P2.4 | solutions, solutions/aeo, solutions/geo, solutions/protection, solutions/radar |
| P2.5 | about, contact, privacy, industries, resources |
| P2.6 | blog, docs, docs/[slug] |

```text
TASK
Convert only <PAGES> to server-rendered public pages with page-specific localized metadata.

CONTEXT
The listed pages are client components even where their content is static. Use the metadata helper
from P2.1 and the homepage conversion as the reference. Extract only browser-dependent behaviour.

REQUIREMENTS
1. Remove "use client" from listed pages where possible and export generateMetadata.
2. Extract hooks, browser APIs and event handlers into small colocated client islands.
3. Add distinct fa/en title and description, canonical and hreflang for every listed route.
4. Use real repository content only. Do not invent FAQs, prices, certifications, case studies,
   customers, integrations or metrics.
5. Preserve copy, section order, themes, responsive layout and RTL/LTR output.
6. Do not touch dashboard/auth/transactional pages or pages outside <PAGES>.

SCOPE
Only <PAGES> and their new colocated client islands.

DONE WHEN
Every listed public route builds with unique metadata. Report routes that remain client components
and the actual browser dependency requiring it.
```

---

## Phase 3: Dashboard reliability and accessibility

### D3.1: Loading boundaries

```text
TASK
Add route-level loading skeletons only where dashboard data currently has no loading state.

CONTEXT
Dashboard routes under src/app/[locale]/dashboard and src/app/[locale]/(dashboard) mix client
fetching with blank gaps and spinners. Inspect every target before editing.

REQUIREMENTS
1. Inventory the target routes and their actual loading behaviour.
2. Add loading.tsx only to groups that need a boundary.
3. Skeleton shape must match the real page structure without real-looking metrics.
4. Add localized accessible status and aria-busy.
5. Respect light/dark and RTL/LTR.

SCOPE
Only new loading.tsx files and a shared skeleton component if reuse is demonstrated.

DONE WHEN
No target route shows a blank or misleading zero state while loading. Report each boundary.
```

### D3.2: Error boundaries

```text
TASK
Add localized error boundaries for dashboard data failures.

CONTEXT
Several data-fetching components catch errors and render empty or partial content. Errors must be
distinguishable from a legitimate empty dataset.

REQUIREMENTS
1. Add error.tsx only to affected route groups.
2. Use the installed Next.js error boundary contract.
3. Render localized retry via reset(), a safe explanation and a route-appropriate navigation link.
4. Never render raw exception text, stack traces or secrets.
5. Preserve existing success states.

SCOPE
New error.tsx files under affected dashboard route groups only.

DONE WHEN
A forced data failure shows a retryable localized error instead of false empty content.
```

### D3.3: Empty-state audit

```text
TASK
Give every legitimate zero-record dashboard panel a useful localized empty state.

CONTEXT
Panels for audits, citations, competitors, entities and content may have no records. A zero is not
an error and should explain the next action without inserting sample data.

REQUIREMENTS
1. Inventory only panels that can legitimately be empty.
2. Add one localized title, one concise explanation and one real next-step CTA per panel.
3. Keep zero as zero and do not add demo metrics.
4. Use existing design primitives and preserve themes/direction.
5. Do not change loading/error state logic.

SCOPE
Only identified panel components and existing localization files.

DONE WHEN
Every inventoried empty panel teaches a next action. Report panel-to-CTA mapping.
```

### D3.4: Mobile dashboard shell

```text
TASK
Make the dashboard shell usable at 320px through 1024px without changing desktop information architecture.

CONTEXT
src/app/[locale]/dashboard/layout.tsx contains a sidebar, topbar, help overlay, fixed ambient layers
and a scrollable main viewport. Dashboard pages contain wide tables and charts.

REQUIREMENTS
1. Test 320, 375, 414, 768 and 1024px.
2. Mobile sidebar is a drawer, does not consume permanent content width, closes via close button and
   Escape, blocks background interaction and returns focus to its trigger.
3. Use intentional inner overflow for wide tables. No document-level horizontal scroll.
4. Preserve navigation destinations, themes, locale and RTL/LTR ordering.

SCOPE
src/app/[locale]/dashboard/layout.tsx, DashboardSidebar.tsx, DashboardTopbar.tsx and required CSS only.

DONE WHEN
Keyboard and touch review passes at all widths. Report measured overflow and focus behaviour.
```

### D3.5: Form accessibility audit

```text
TASK
Make login, registration, forgot-password and free-audit forms fully accessible without changing their server contracts.

CONTEXT
Forms exist under src/app/[locale]/login, register and forgot-password, plus
src/components/features/audit/FreeAuditPanel.tsx. They use shared Input and Button primitives but
error association and pending announcements are inconsistent.

REQUIREMENTS
1. Every input has a stable id, associated label or accessible name, autocomplete and invalid state.
2. Field errors have stable ids and aria-describedby only when present.
3. Submission errors use role=alert; pending submitters expose aria-busy.
4. Password controls use correct autocomplete and never log or persist plaintext values.
5. Render Persian and English validation copy through the existing localization pattern.
6. Preserve the current visual design and server action/API contracts.

SCOPE
The four form surfaces, shared Input/Button only if required, and existing localization files.

DONE WHEN
Keyboard and screen-reader review identifies every field, error and pending state in both locales.
```

---

## Phase 4: Performance and release gates

### Q4.1: Measured memoization

```text
TASK
Memoize only the homepage/dashboard components proven to rerender unnecessarily.

CONTEXT
The product preview, graph visualisations, Recharts panels and dashboard home contain derived arrays,
objects and handlers. Memoization should follow a measured scenario, not blanket wrapping.

REQUIREMENTS
1. Measure render counts before editing with React DevTools or an equivalent repeatable counter.
2. Memoize derived chart/graph props and stable handlers with correct dependencies.
3. Use React.memo only where props are stable and the child is presentational.
4. Do not change output, animation timing or state semantics.
5. Report rejected candidates and the before/after render counts.

SCOPE
Only measured files under src/components/marketing/home, src/components/visualization and
src/components/features/dashboard-home.

DONE WHEN
Typecheck/lint pass and the report contains reproducible measurements.
```

### Q4.2: Image and alt semantics

```text
TASK
Audit and fix raster image layout stability and alt semantics on public surfaces.

CONTEXT
next/image usage is sparse and the public directory contains raster assets. SVG icon components do
not need conversion. The goal is no layout shift from unknown dimensions and deliberate assistive
semantics.

REQUIREMENTS
1. Inventory raster references from src/ and public/.
2. Use next/image with explicit dimensions or fill inside a sized parent.
3. Informative images have meaningful localized alt; decorative images have alt="" and aria-hidden.
4. Do not add remote hosts or dependencies.
5. Fix only image/alt issues in this task.

SCOPE
Image-referencing components and existing localization files only.

DONE WHEN
Inventory is complete and every raster asset has deliberate dimension and alt behaviour.
```

### Q4.3: Frontend lint gate

```text
TASK
Enable supported JSX accessibility rules as build-blocking errors and clear the resulting frontend violations.

CONTEXT
eslint.config.mjs uses eslint-config-next. The frontend needs enforced alt-text, anchor validity,
ARIA property validity and required role properties.

REQUIREMENTS
1. Verify rule names supported by the installed eslint-config-next.
2. Enable alt-text, anchor-is-valid, aria-props and role-has-required-aria-props as errors when supported.
3. Fix violations in frontend files without unrelated formatting refactors.
4. Do not add broad eslint-disable comments or weaken the rules.

SCOPE
eslint.config.mjs and frontend files required to clear these rules.

DONE WHEN
pnpm lint exits 0 with the rules active. Report rules and violations fixed.
```

### Q4.4: Smoke and visual regression checks

```text
TASK
Add a repeatable frontend smoke check for critical localized routes.

CONTEXT
The repo has no verified browser test setup in package.json. Inspect installed tooling before adding
anything. Critical routes: /fa, /en, /fa/login, /en/register, /fa/dashboard and /en/dashboard.

REQUIREMENTS
1. Inventory current test/browser tooling first.
2. If no browser runner exists, use existing tooling or add a documented manual check; do not add a
   dependency without explicit evidence it is needed.
3. Check HTTP status, redirect destination, console errors, page-level horizontal overflow and the
   presence of a visible focus ring on critical controls.
4. Use a safe authenticated test seam only if one already exists. Do not add production bypasses.
5. Document the command and expected output.

SCOPE
tests/frontend/**, package.json script only if required, docs/FRONTEND-SMOKE-TESTS.md.

DONE WHEN
The check is repeatable and reports failures by route and criterion.
```

### Q4.5: Performance budget

```text
TASK
Record and enforce measured First Load JS budgets for public routes.

CONTEXT
Homepage server rendering, client-island extraction and dashboard boundaries are complete. No budget
currently blocks bundle regressions.

REQUIREMENTS
1. Run pnpm build and record real First Load JS and shared chunk sizes.
2. Create docs/PERFORMANCE_BUDGET.md with measured baseline and per-route budget equal to baseline
   plus 10 percent.
3. Flag routes above 250KB for review.
4. Add a CI check that fails when measured output exceeds the recorded budget.
5. Do not raise budgets to hide a regression in the same task.

SCOPE
docs/PERFORMANCE_BUDGET.md, scripts/frontend/check-budget.* and CI file only.

DONE WHEN
The report contains measured values and CI rejects a deliberate over-budget fixture.
```

### Q4.6: Final frontend release gate

```text
TASK
Create an evidence-backed frontend go/no-go release gate.

CONTEXT
All preceding frontend tasks are merged. This task changes no application code.

REQUIREMENTS
1. Run typecheck, lint, build and every frontend smoke command documented by the repository.
2. Verify 320, 768 and 1440px for fa/en and light/dark on homepage, login, register and dashboard shell.
3. Verify no alert(), no artificial authentication delay, no page-level horizontal overflow, visible
   focus, reduced motion, localized redirects and honest static-preview labels.
4. Verify public metadata, robots and sitemap output.
5. Mark every item PASS, FAIL or UNVERIFIED. Never upgrade UNVERIFIED to PASS.
6. Create docs/FRONTEND-RELEASE-GATE.md with blockers ordered by severity.

SCOPE
docs/FRONTEND-RELEASE-GATE.md only.

DONE WHEN
The document makes a defensible go/no-go decision. No source file changes.
```

## Execution ledger

| Task | Depends on | Status |
|---|---|---|
| H1.1 | current repo | next |
| H1.2 | H1.1 | next |
| H1.3 | H1.2 | next |
| H1.4 | H1.3 | next |
| H1.5 | H1.1 | completed in current homepage pass, verify in H1.1 |
| H1.6 | H1.1 | next |
| H1.7 | H1.2-H1.6 | next |
| P2.1 | H1.4 | next |
| P2.2 | P2.1 | next |
| P2.3-P2.6 | P2.2 | next, one batch per session |
| D3.1-D3.5 | H1.4 | next, one task per session |
| Q4.1-Q4.5 | P2 and D3 complete | next, one task per session |
| Q4.6 | all previous | final |

## Definition of done

The frontend is product-ready only when the final gate has no FAIL, no critical UNVERIFIED item, all public routes have truthful content and metadata, every async surface distinguishes loading/error/empty/success, and the real CI checks pass.
