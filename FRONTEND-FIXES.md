# Frontend remediation manifest

This package contains the frontend fixes applied to the uploaded repository and a rewritten Jules roadmap.

## Fixed now

- **Auth hydration flash:** server-resolved session is passed from the locale layout to `AuthProvider`; the provider no longer re-fetches on mount when the session is available.
- **Broken protected redirects:** unauthenticated and forbidden redirects now preserve the active locale (`/fa/login`, `/en/login`, `/fa/dashboard`, `/en/dashboard`) and use `replace` so users do not get trapped in browser history.
- **Fake frontend latency:** removed artificial 800ms login/register and 400ms logout delays. The UI now reflects the real server operation.
- **Auth action wiring:** the provider sends password values to the server action contract and registration uses the password argument.
- **Keyboard accessibility:** global `:focus-visible` treatment added with a high-contrast ring.
- **Touch accessibility:** interactive links and buttons receive a 44px minimum target.
- **Mobile overflow:** document-level horizontal overflow is blocked while opt-in `.mobile-scroll-x` supports intentional tables and horizontal panels.
- **Reduced motion:** all CSS transitions and animations are disabled when the user requests reduced motion, not only a small allowlist of class names.

## Important dependency

`AuthProvider` now expects `loginAction(email, password)` and `registerAction(name, email, password)`. The package includes the matching server action file from the previous security remediation so the frontend and backend contracts stay aligned. Apply the database migration from that remediation before exercising registration or login against a real database.

## Not silently changed

The marketing pages are still client components, OAuth buttons still do not connect to a provider, and several dashboard pages still need route-specific loading, error and empty states. Those are deliberately split into single-task Jules prompts in `docs/JULES-FRONTEND-ROADMAP.md` instead of hiding a large refactor inside this pass.
