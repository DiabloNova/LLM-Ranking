# Checkout flow QA

1. **Registration state loss**: click a paid plan, close/reopen the browser, then finish registration. The flow restores only a bounded, 30-minute session intent and returns to the exact plan invoice. Passwords and auth tokens never enter browser storage.
2. **Expired session during checkout**: load an invoice with an invalid or unknown `plan` query. The invoice falls back to the safe Enterprise display and the server-side payment endpoint remains the source of truth for entitlement and amount.
3. **Abandoned payment**: leave the invoice and return later. The user keeps the authenticated free/workspace account, while the checkout intent expires and is discarded instead of silently charging or resuming stale checkout.

Static validation performed: balanced TSX delimiters, bounded plan normalization, and source scan for the three redirect branches. Full TypeScript/build execution requires the repository dependencies, which are not installed in this environment.
