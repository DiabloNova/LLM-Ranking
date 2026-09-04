# SEOrchable Frontend Productization Roadmap

## Mission

Move the current frontend from a visually ambitious prototype to a dependable, accessible, fast product surface without changing product scope or inventing backend behaviour.

**Point A:** 49 locale page files, 46 client components, a 947-line client homepage, client-side auth bootstrap with a visible loading flash, locale-breaking protected redirects, artificial auth delays, alert-based OAuth placeholders, inconsistent loading/error/empty states, weak keyboard affordances, and no systematic frontend quality gates.

**Point B:** public marketing pages server-rendered with page-specific metadata, authenticated surfaces protected without flashes or redirect loops, every async screen has loading/error/empty/success states, all forms are accessible and localized, mobile layouts work at 320px, visual regressions are tested, and bundle/interaction budgets are enforced in CI.

## Jules rules

`AGENTS.md` is loaded automatically. Keep prompts single-purpose. One prompt changes one concern. One session produces one reviewable PR. Never approve a plan that touches files outside the prompt scope. Never let Jules add fake API data, fake loading delays, placeholder success messages, or unimplemented OAuth behaviour.

Run tasks strictly in order. Merge each PR before the next task. When a task exposes a dependency, stop and add the dependency as a new micro-task instead of letting Jules widen scope.

## Verified frontend baseline

From the uploaded repository:

- 49 `page.tsx` files exist under `src/app/[locale]`.
- 46 start with `"use client"`.
- The homepage is 947 lines and client-rendered.
- `AuthProvider` starts in `loading`, fetches the session in `useEffect`, and introduces a hard-navigation flash.
- `ProtectedRoute` redirects to `/` and `/dashboard`, dropping `fa` or `en` from the URL.
- `AuthProvider` contains artificial 800ms login/register and 400ms logout delays.
- The login and register screens use `alert()` for OAuth placeholders.
- Global CSS has a reduced-motion allowlist but no universal focus-visible rule or 44px target baseline.
- The dashboard shell reads `localStorage` after mount, so sidebar state is intentionally hydration-sensitive.

---

## Phase 0: stabilize the shared shell

### F0.1, already applied: server session hydration

```text
TASK
Pass the authoritative session from the locale layout into AuthProvider and remove the hard-navigation auth flash.

CONTEXT
src/app/[locale]/layout.tsx is an async server component and can call getServerSessionAction().
src/components/AuthProvider.tsx currently starts every browser session with status "loading" and
calls getServerSessionAction() in useEffect. This flashes unauthenticated/loading UI on every hard
navigation and performs a duplicate request.

REQUIREMENTS
1. Add an optional initialSession prop to AuthProvider.
2. Resolve the session in the locale layout and pass it to AuthProvider.
3. Initialise state from initialSession and skip the mount fetch when initialSession exists.
4. Preserve the fetch fallback when AuthProvider is rendered without initialSession in tests.
5. Do not pass cookies, tokens, hashes or secrets to the client. Only the existing User/Session fields
   may cross the boundary.
6. Do not change the Session or User types.

SCOPE
src/app/[locale]/layout.tsx, src/components/AuthProvider.tsx only.

DONE WHEN
pnpm typecheck and pnpm lint pass. A hard reload of an authenticated dashboard shows no loading or
unauthenticated flash. Report the exact fields crossing the server/client boundary.
```

### F0.2, already applied: locale-safe protected redirects

```text
TASK
Make ProtectedRoute redirects locale-aware and history-safe.

CONTEXT
src/components/ProtectedRoute.tsx redirects unauthenticated users to "/" and users without a
required role to "/dashboard". The app is routed under /fa and /en, so both destinations can 404
or lose the user's language.

REQUIREMENTS
1. Read language from useTheme().
2. Redirect unauthenticated users to /{language}/login using router.replace.
3. Redirect insufficient-role users to /{language}/dashboard using router.replace.
4. Preserve null rendering while navigation is pending and preserve requiredRole checks.
5. Do not add a new redirect loop or use window.location.

SCOPE
src/components/ProtectedRoute.tsx only.

DONE WHEN
The three cases are tested manually in both locales. No protected redirect points to an unlocalized path.
```

### F0.3, already applied: remove fake auth latency

```text
TASK
Remove artificial authentication delays from AuthProvider.

CONTEXT
src/components/AuthProvider.tsx waits 800ms before login/register and 400ms before logout. These
delays do not represent network work and make the product feel broken on fast connections.

REQUIREMENTS
1. Delete only the artificial setTimeout-based delays.
2. Keep status="loading" while the real server action is pending.
3. Preserve all success and failure state transitions.
4. Do not replace the delay with a spinner or fake progress percentage.

SCOPE
src/components/AuthProvider.tsx only.

DONE WHEN
Login, registration and logout wait only for their real server action. Typecheck and lint pass.
```

### F0.4: baseline interaction accessibility

```text
TASK
Add the shared keyboard-focus and touch-target baseline without changing the visual theme.

CONTEXT
src/app/globals.css has no universal focus-visible rule. Several controls rely on hover-only
feedback. The app serves keyboard users and touch users in both RTL and LTR locales.

REQUIREMENTS
1. Add a visible :focus-visible rule for links, buttons, form controls, summary and role=button.
2. Use the existing sky-blue design token. Do not use outline:none.
3. Give interactive controls a 44px minimum target without forcing text inputs to become visually
   oversized. Use padding/min-height where appropriate.
4. Add html/body max-width:100% and overflow-x:hidden to stop page-level horizontal drift.
5. Add a reusable .mobile-scroll-x class for intentional horizontal tables/panels.
6. Add a universal prefers-reduced-motion rule that disables animation and transition durations and
   restores scroll-behaviour. Preserve existing specific rules.
7. Do not alter colors, typography, spacing or component markup in this task.

SCOPE
src/app/globals.css only.

DONE WHEN
Keyboard focus is visible on every interactive control, tab navigation remains usable, and reduced
motion removes non-essential motion. Test at 320px, 768px and 1440px widths.
```

### F0.5: OAuth placeholders must be honest

```text
TASK
Replace alert()-based OAuth placeholder buttons with an inline unavailable state.

CONTEXT
src/app/[locale]/login/page.tsx and register/page.tsx call alert() when Google or Microsoft buttons
are clicked. The integrations do not exist in the repository. Browser alerts are inaccessible,
block the UI thread and look like a broken product.

REQUIREMENTS
1. Remove alert() and console.log() from both pages.
2. Keep the buttons available but render a localized inline status message in the form after click:
   "This sign-in method is not available yet" in English and the equivalent native Persian copy.
3. Add role=status and aria-live=polite to the message.
4. Do not claim that a provider connection occurred. Do not add a fake OAuth endpoint.
5. Preserve both themes, RTL/LTR, and button layout.

SCOPE
src/app/[locale]/login/page.tsx, src/app/[locale]/register/page.tsx only.

DONE WHEN
Clicking either provider produces no alert and gives an accessible inline message. No fake network
request is made.
```

---

## Phase 1: forms that behave like a product

### F1.1: password policy alignment

```text
TASK
Align login and registration client validation with the server password policy.

CONTEXT
The server password policy is 12 to 200 characters with at least one lowercase, one uppercase and
one digit. The login and register pages still advertise a six-character minimum. Registration has
no confirm-password field.

REQUIREMENTS
1. Update localized validation copy to match the actual policy.
2. Add confirmPassword state and a confirm-password input to register.
3. Validate confirmation before any server action call.
4. Render each server violation code as localized copy without exposing credential details.
5. Add autocomplete="current-password" to login and autocomplete="new-password" to registration
   fields. Email fields use autocomplete="email".
6. Preserve existing visual structure and do not log passwords.

SCOPE
src/app/[locale]/login/page.tsx, src/app/[locale]/register/page.tsx, existing locale message files only.

DONE WHEN
A policy-invalid password never calls the server. A mismatch never calls the server. Both locales
show correct localized errors and typecheck passes.
```

### F1.2: form semantics and error association

```text
TASK
Make login and registration errors accessible and correctly associated with their controls.

CONTEXT
The forms already track field errors but the frontend audit shows inconsistent aria wiring and
error announcements. Screen-reader users must know which field failed and whether submission failed.

REQUIREMENTS
1. Every Input has a stable id, matching label htmlFor and autocomplete.
2. Each field error uses an id and the input references it via aria-describedby only when present.
3. Invalid fields receive aria-invalid=true.
4. Submission errors use role=alert and aria-live=assertive.
5. The submit button exposes aria-busy while the real action is pending.
6. Do not change server contracts or error wording.

SCOPE
src/app/[locale]/login/page.tsx, src/app/[locale]/register/page.tsx, src/components/Input.tsx,
src/components/Button.tsx only if needed for aria-busy support.

DONE WHEN
Keyboard-only and screen-reader review can identify every field error and the pending state.
```

### F1.3: password visibility control

```text
TASK
Add an accessible show/hide password control to login and registration.

CONTEXT
Long passwords are error-prone, especially in Persian RTL layouts, but the current fields cannot
reveal the value for review.

REQUIREMENTS
1. Add a button inside each password field that toggles type=password/text.
2. Give it a 44px target, localized aria-label and aria-pressed state.
3. Ensure it does not submit the form.
4. Preserve password autocomplete, no-store behaviour and RTL alignment.
5. Do not create a reusable component in this task; keep the diff local and reviewable.

SCOPE
src/app/[locale]/login/page.tsx, src/app/[locale]/register/page.tsx only.

DONE WHEN
The control works with mouse and keyboard in both locales and does not lose the current input.
```

---

## Phase 2: public rendering and SEO without visual regressions

### F2.1: metadata helper

```text
TASK
Create a server-only metadata helper for localized public pages.

CONTEXT
Only services/[slug]/page.tsx exports metadata. The other public pages are client components and
inherit generic metadata. siteConfig is in src/config/site.ts.

REQUIREMENTS
1. Create src/lib/seo/metadata.ts with buildPageMetadata({locale,path,title,description,...}).
2. Return localized title/description, absolute canonical, fa/en hreflang alternates, Open Graph,
   Twitter summary_large_image and optional noIndex.
3. Read the domain from siteConfig. Never hardcode it.
4. Keep the helper free of client imports.
5. Refactor services/[slug]/page.tsx to use it without changing rendered UI.

SCOPE
src/lib/seo/metadata.ts, src/app/[locale]/services/[slug]/page.tsx only.

DONE WHEN
Built English and Persian service pages contain distinct title, description, canonical and both
hreflang links.
```

### F2.2: robots and sitemap

```text
TASK
Add robots.txt and sitemap.xml route handlers for public localized pages.

CONTEXT
The repository has neither. Public routes are under src/app/[locale]/. Service slugs come from
servicesData and docs slugs from DOCS_INDEX.

REQUIREMENTS
1. Create src/app/robots.ts using MetadataRoute.Robots.
2. Disallow all preview/non-production environments. In production disallow /api and all
   authenticated/transactional routes in both locales.
3. Create src/app/sitemap.ts using MetadataRoute.Sitemap.
4. Enumerate both locales, public static routes, Object.keys(servicesData) and DOCS_INDEX slugs.
5. Add fa/en alternates to every entry. Exclude dashboard, settings, profile, invoice, login,
   register, forgot-password and verify-email.
6. Read siteConfig.url. Do not invent routes.

SCOPE
src/app/robots.ts, src/app/sitemap.ts only.

DONE WHEN
Build emits both route files. The report states exact URL count and confirms excluded paths are absent.
```

### F2.3: server-render the homepage

```text
TASK
Convert src/app/[locale]/page.tsx into a server page while preserving the current UI exactly.

CONTEXT
The homepage is 947 lines, starts with "use client", and owns state, refs, tab switching, charts,
animations and marketing markup. This blocks page metadata and ships too much hydration.

REQUIREMENTS
1. Remove "use client" from the page.
2. Extract each hook/event/chart region into small client islands under
   src/components/marketing/home/.
3. Keep DOM structure, copy, class names, animations, themes and RTL/LTR output unchanged.
4. Add generateMetadata using the metadata helper with distinct fa/en homepage copy.
5. Pass static data from the server page into islands instead of duplicating it.
6. Do not refactor unrelated components or change product copy.

SCOPE
src/app/[locale]/page.tsx and new files under src/components/marketing/home/ only.

DONE WHEN
Build passes, homepage HTML contains localized metadata, and First Load JS is lower than the
pre-change baseline. Report every extracted island and before/after build figures.
```

### F2.4 to F2.8: remaining public page groups

Run each row as a separate Jules session. Use the same single-task prompt, replacing `<PAGES>`.

| Task | Pages |
|---|---|
| F2.4 | pricing |
| F2.5 | features, about, contact, privacy |
| F2.6 | solutions and solutions/* |
| F2.7 | industries, resources, blog |
| F2.8 | docs and docs/[slug] |

```text
TASK
Convert only <PAGES> into server-rendered public pages with page-specific localized metadata.

CONTEXT
The listed pages are client components, so they cannot export metadata. The homepage conversion
is the reference. Use the existing metadata helper and preserve the rendered UI exactly.

REQUIREMENTS
1. Remove "use client" from listed page files only.
2. Extract only required hooks, browser APIs and event handlers into colocated client islands.
3. Add page-specific fa/en metadata, canonical and hreflang.
4. For dynamic pages use resolved params and valid slugs from repository data.
5. Preserve copy, themes, RTL/LTR and visual output.
6. Do not convert dashboard, auth or transactional pages in this task.

SCOPE
Only <PAGES> and new colocated client-island files.

DONE WHEN
Every listed route builds with distinct metadata and no public route in the group remains a client
page unless the report proves it requires a client boundary.
```

---

## Phase 3: dashboard state quality

### F3.1: shared loading skeletons

```text
TASK
Add route-level loading.tsx skeletons for the authenticated dashboard groups.

CONTEXT
Dashboard pages perform client fetches and currently show inconsistent spinners, blank gaps or
nothing while data loads. The repository uses Tailwind and has existing card/table primitives.

REQUIREMENTS
1. Inspect the actual dashboard route groups and add loading.tsx only where a loading boundary is
   missing.
2. Skeleton structure must match the page shape: title block, KPI/table/chart regions.
3. Use aria-busy=true and an accessible localized status label.
4. Respect light/dark themes and RTL/LTR direction.
5. Do not add fake metrics or real-looking data.
6. Do not alter page success states.

SCOPE
Only new loading.tsx files under src/app/[locale]/dashboard/ and the minimum shared skeleton
component if reuse is proven.

DONE WHEN
Navigating between dashboard routes shows stable skeletons, not blank screens or misleading values.
```

### F3.2: route-level error boundaries

```text
TASK
Add localized error.tsx boundaries to the dashboard and public data-fetching route groups.

CONTEXT
A failed fetch currently often becomes console.error plus an empty panel. Users need an actionable
retry state, and errors must not look like zero data.

REQUIREMENTS
1. Add error boundaries only to groups that perform client/server data fetching.
2. Use the Next.js error boundary contract for the installed version. Read its local docs first.
3. Show localized title, explanation and retry button using reset().
4. Never include raw exception messages, stack traces or credentials.
5. Preserve a link back to the localized dashboard/home where appropriate.
6. Cover light/dark themes and RTL/LTR.

SCOPE
New error.tsx files under the affected route groups only.

DONE WHEN
A forced fetch failure shows a clear localized error and retry action, not a false empty state.
```

### F3.3: honest empty states

```text
TASK
Replace ambiguous empty dashboard panels with actionable empty states.

CONTEXT
Several dashboard panels render zero values or empty containers when the user has no audits,
competitors, citations or content. Empty data is not an error and should teach the next action.

REQUIREMENTS
1. Inventory panels that can legitimately have zero records.
2. Add a localized empty title, one-sentence explanation and one next-step CTA per panel.
3. Keep zero as zero. Do not insert sample data.
4. Use existing Button/Link components and preserve theme/direction.
5. Do not touch error or loading state logic in this task.

SCOPE
Only the identified dashboard panel components and existing localization files.

DONE WHEN
Every zero-record panel has a distinct empty state that takes the user to a real existing action.
Report the panel-to-CTA mapping.
```

### F3.4: mobile dashboard navigation

```text
TASK
Make the dashboard sidebar and topbar usable at 320px through 767px.

CONTEXT
src/app/[locale]/dashboard/layout.tsx uses a fixed sidebar/topbar composition, localStorage state
and a help drawer. Dashboard pages also contain wide tables and chart panels.

REQUIREMENTS
1. Test at 320, 375, 414, 768 and 1024 CSS pixels.
2. On mobile, the sidebar must not permanently consume content width; use the existing mobileOpen
   state as a drawer with a visible close path.
3. Lock background interaction while the drawer is open and close it on Escape.
4. Preserve focus visibility and return focus to the menu trigger on close.
5. Intentional wide content gets an accessible horizontal scroll wrapper; the document itself must
   not overflow horizontally.
6. Do not redesign desktop layout or change navigation destinations.

SCOPE
src/app/[locale]/dashboard/layout.tsx, src/components/navigation/DashboardSidebar.tsx,
src/components/navigation/DashboardTopbar.tsx and only directly necessary CSS.

DONE WHEN
At 320px there is no page-level horizontal scroll, the drawer is keyboard usable, and all links remain reachable.
```

### F3.5: localStorage-safe sidebar persistence

```text
TASK
Harden sidebar collapse persistence against malformed localStorage and cross-tab updates.

CONTEXT
src/app/[locale]/dashboard/layout.tsx calls JSON.parse(localStorage.getItem(...)) without a
try/catch. A corrupted value can crash the dashboard shell. State is not synchronised across tabs.

REQUIREMENTS
1. Parse the stored value defensively and accept only boolean true/false.
2. On malformed data, remove the key and use the default expanded state.
3. Listen for the storage event and update collapse state when another tab changes it.
4. Remove the listener on unmount.
5. Keep the current key and desktop behaviour.

SCOPE
src/app/[locale]/dashboard/layout.tsx only.

DONE WHEN
Malformed storage cannot crash the shell, and two tabs converge after a sidebar toggle.
```

---

## Phase 4: performance and quality gates

### F4.1: memoize high-cost client islands

```text
TASK
Memoize only measured high-cost client islands.

CONTEXT
The homepage and dashboard contain Recharts, Framer Motion, graph visualisations and derived data
arrays. Memoization must follow profiling, not superstition.

REQUIREMENTS
1. Use React DevTools or a repeatable render counter to identify components rerendering without
   relevant prop changes.
2. Memoize derived arrays/objects passed to chart and graph children with correct dependencies.
3. Use useCallback for handlers passed into memoized children.
4. Wrap pure presentational children in React.memo only when prop stability is demonstrated.
5. Do not change output, animation timing or state semantics.
6. Report candidates rejected and why.

SCOPE
Only measured files under src/components/marketing/home/, src/components/visualization/ and
src/components/features/dashboard-home/.

DONE WHEN
Typecheck/lint pass, render counts improve in the recorded scenario, and the report includes the
measurement before and after.
```

### F4.2: image and alt audit

```text
TASK
Complete the frontend image and alternative-text audit.

CONTEXT
The repository has minimal next/image usage and inconsistent alt coverage. Images must reserve
layout space and be understandable to assistive technology.

REQUIREMENTS
1. Inventory raster images referenced by src/ and public/.
2. Use next/image for raster content with explicit dimensions or fill inside a sized parent.
3. Decorative images use alt="" and aria-hidden=true. Informative images get meaningful localized
   alt text where the localization system supports it.
4. Do not convert SVG icons that are already components.
5. Do not add remote hosts or dependencies.
6. Fix only image/alt violations in this task.

SCOPE
Image-referencing component files and existing localization files only.

DONE WHEN
No raster image causes a layout shift through missing dimensions, and every image has deliberate
alt semantics. Report the inventory.
```

### F4.3: frontend lint gate

```text
TASK
Enable the repository's existing accessibility lint rules and fix only frontend violations.

CONTEXT
eslint.config.mjs currently does not enforce a complete JSX accessibility baseline. The project
already depends on eslint-config-next, so do not add a new linter package.

REQUIREMENTS
1. Inspect the installed eslint-config-next version and its available jsx-a11y rules.
2. Enable alt-text, anchor-is-valid, aria-props and role-has-required-aria-props as errors if
   supported by the installed config.
3. Run lint and fix violations in touched frontend files only.
4. Do not weaken rules or add eslint-disable comments except for a verified third-party limitation.
5. Do not mix in unrelated formatting refactors.

SCOPE
eslint.config.mjs and the frontend files required to clear the new violations.

DONE WHEN
pnpm lint exits 0 with the rules active. Report every rule enabled and violation class fixed.
```

### F4.4: visual regression harness

```text
TASK
Add a deterministic frontend smoke-test harness using only tooling already installed.

CONTEXT
The repository has no browser test configuration visible in package.json. Before adding a browser
framework, inspect package.json, lockfiles and existing tests. The goal is to catch route 404s,
console errors, auth redirects, mobile overflow and form regressions.

REQUIREMENTS
1. Inventory installed test/browser tooling before choosing an approach.
2. If no browser runner exists, create a documented manual smoke script using existing Node tools
   rather than silently adding a dependency.
3. Cover /fa, /en, /fa/login, /en/register, /fa/dashboard and /en/dashboard with an authenticated
   test seam if one already exists.
4. Record console errors, HTTP status, redirect destination, and horizontal overflow checks.
5. Do not use fake backend data in production code.
6. Document how the check runs locally and in CI.

SCOPE
tests/frontend/**, package.json script if required, docs/FRONTEND-SMOKE-TESTS.md.

DONE WHEN
A repeatable command checks the critical routes and reports failures with route-level detail.
```

### F4.5: performance budget

```text
TASK
Record and enforce the frontend performance budget from the real production build.

CONTEXT
The current homepage is a large client component and dashboard charts add heavy client bundles.
No budget exists. The budget must come from measured output, not guesses.

REQUIREMENTS
1. Run pnpm build after all preceding frontend tasks.
2. Record First Load JS for every public route and the shared chunk size in docs/PERFORMANCE_BUDGET.md.
3. Set each route budget to measured value plus 10 percent, with a hard review flag above 250KB.
4. Add a CI check that fails when a measured public route exceeds its recorded budget.
5. Do not hide a regression by raising the budget in the same task.

SCOPE
docs/PERFORMANCE_BUDGET.md, scripts/frontend/check-budget.* and CI file only.

DONE WHEN
The build produces measured numbers, CI rejects a deliberate over-budget fixture, and the report
contains the baseline and budget table.
```

---

## Phase 5: final frontend acceptance

### F5.1: frontend coverage audit

```text
TASK
Create docs/FRONTEND_COVERAGE.md with a verified route-by-route acceptance audit.

CONTEXT
This roadmap changes rendering, auth hydration, forms, mobile navigation, async states, SEO and
performance. There is no single source showing which route has which guarantee.

REQUIREMENTS
1. Enumerate every page.tsx under src/app/[locale].
2. Record for each route: public/authenticated, server/client, metadata, canonical, hreflang,
   loading boundary, error boundary, empty state where data can be empty, RTL/LTR check, mobile
   check and smoke-test coverage.
3. Mark PASS, FAIL or UNVERIFIED from code or executed tests only.
4. Add a Blocking before release section ordered by severity.
5. Change no source file.

SCOPE
docs/FRONTEND_COVERAGE.md only.

DONE WHEN
Every route appears and every PASS has a file citation or test output.
```

### F5.2: final frontend release gate

```text
TASK
Run the final frontend release gate and create docs/FRONTEND_RELEASE_GATE.md.

CONTEXT
All frontend implementation tasks and the route coverage audit are complete. This task changes no
application code.

REQUIREMENTS
1. Run pnpm typecheck, pnpm lint, pnpm build and every frontend smoke command documented by the repo.
2. Verify 320px, 768px and 1440px screenshots or equivalent layout measurements for /fa, /en,
   login, register and dashboard shell.
3. Verify keyboard navigation, visible focus, reduced motion, localized redirects, no browser
   alert(), no artificial auth delays, and no page-level horizontal overflow.
4. Verify all public metadata and sitemap/robots outputs.
5. Mark every criterion PASS, FAIL or UNVERIFIED. Never upgrade UNVERIFIED to PASS.
6. Include blockers only. Do not fix code in this task.

SCOPE
docs/FRONTEND_RELEASE_GATE.md only.

DONE WHEN
The document is an evidence-backed go/no-go decision for the frontend release.
```

## Dependency ledger

| Task | Depends on | Status |
|---|---|---|
| F0.1 | existing server action | applied in current patch |
| F0.2 | existing ThemeProvider | applied in current patch |
| F0.3 | F0.1 | applied in current patch |
| F0.4 | none | applied in current patch |
| F0.5 | none | next |
| F1.1 | backend password policy | next |
| F1.2 | F1.1 | next |
| F1.3 | F1.1 | next |
| F2.1 | none | next |
| F2.2 | F2.1 | next |
| F2.3 | F2.1 | next |
| F2.4-F2.8 | F2.3 | next, one session each |
| F3.1-F3.5 | F0.1 | next, one session each |
| F4.1-F4.5 | F2 and F3 complete | next, one session each |
| F5.1 | all implementation tasks | next |
| F5.2 | F5.1 | final |

## Definition of done

Frontend is release-ready only when `FRONTEND_RELEASE_GATE.md` has no FAIL, no critical UNVERIFIED item, and the real CI checks pass. A page that looks polished but has fake success, an inaccessible form, a redirect loop or a false empty state is not done.
