# Seorchable — Dashboard Shell Architecture & Specification

This document details the production-grade architectural design of the unified authenticated Dashboard Shell implemented in **Task 3.0**. The shell serves as the layout foundation for all authenticated sub-modules, establishing strict client-server component boundaries, unified configuration-driven navigation, multi-tenant workspace context integration, and comprehensive LTR/RTL bidirectional layout controls.

---

## 1. Directory Structure & Layout Flow

To prevent layout duplication and ensure standard performance practices, Next.js nested layouts are utilized. The global workspace shell resides at:
`src/app/[locale]/dashboard/layout.tsx`

This layout wraps all authenticated sub-routes conceptually as follows:

```
<DashboardShell>
  <DashboardSidebar />
  <div className="flex flex-col flex-1 min-h-screen overflow-x-hidden">
    <DashboardTopbar />
    <main className="flex-1 p-6">
      {children}
    </main>
  </div>
</DashboardShell>
```

### Files Created & Key Locations:
1. **Shell Configuration:** `src/config/dashboardNavigation.ts`
   - Defines a single authoritative source of truth for all dashboard navigation menu blocks (Overview, SEO, AI Visibility, Content, Competitors, Citations, Entities, Analytics, Administration, Support) mapping to their respective icons, keys, and relative links.
2. **Sidebar Navigation Menu:** `src/components/navigation/DashboardSidebar.tsx`
   - Interactive, theme-aware navigation panel displaying nested options, supporting persistent expand/collapse states, transition durations, keyboard tab-indices, and RTL mirroring.
3. **Topbar Header:** `src/components/navigation/DashboardTopbar.tsx`
   - Holds the current Workspace Select dropdown, command search modal hook, unread notification counts, and profile dropdown menu.
4. **Interactive Overlays:**
   - Command palette modal, notification popover drawer, help guide sliding drawer, and theme toggles.

---

## 2. Configuration-Driven Navigation Tree

To support role-based visibility, permission gates, and route-matching validation, navigation items are driven by a typed schema in `src/config/dashboardNavigation.ts`:

```typescript
export interface NavigationItem {
  id: string;
  labelEn: string;
  labelFa: string;
  href: string;
  icon: string; // Lucide icon lookup string
  requiredPermission?: string;
  children?: NavigationItem[];
}
```

This prevents hardcoding navigation lists inside visual templates. Every sidebar, breadcrumb locator, and mobile drawer derives active indicators from this single object.

---

## 3. Client vs. Server Component Boundaries

* **Server Components (Default):**
  - All page endpoints under `/[locale]/dashboard/` are server components.
  - Server actions resolve user identity and transacted tenant context.
  - Dynamic parameters are pre-fetched server-side, reducing layout shifts and first-contentful-paint (FCP) duration.
* **Client Components (Interactive Islands):**
  - Interactive elements (collapsible toggles, workspace dropdown state, popovers, and dialog overlays) are isolated inside client wrapper scopes.
  - Sidebar state handles responsive transitions using small state flags, with client-side indicators safely loading to prevent hydration mismatches during static site generation (SSG).

---

## 4. Multi-Tenant Workspace & Identity Integration

Unauthenticated sessions are strictly isolated via the system's `<ProtectedRoute>` controls. When active:
* **Workspace Context:** The `DashboardTopbar` mounts a type-safe `WorkspaceSelector` displaying active workspace metadata (e.g., *Tehran HQ Workspace*).
* **Identity Context:** The `UserMenu` resolves real user data (e.g., *Faramarz Yazdani - faramarz@brandgraph.ai*) instead of utilizing static mocked entities.
* **Sign-Out Operations:** Sign-out controls integrate directly with the canonical authentication provider `invalidateSession` API to clear active secure HTTPOnly cookies and reset state parameters.

---

## 5. Bidirectional (RTL/LTR) & Responsive Design

### Direction-Aware Design Primitives:
* Directionality is determined by the Next.js locale: `fa` maps to `rtl`, and `en` maps to `ltr`.
* Layout margins, padding, absolute borders, and slide-in offsets utilize CSS logical properties (such as `ms-*`, `me-*`, `border-inline-start`, `text-start`) instead of absolute horizontal parameters.
* Directional UI icons (e.g., expansion chevrons) mirror dynamically according to the active locale.

### Responsive Breakpoints:
* **Desktop ($> 1024px$):** Persistence sidebar is pinned to the side.
* **Tablet ($768px \le \text{width} \le 1024px$):** Sidebar can be collapsed into a compact icon-only representation.
* **Mobile ($< 768px$):** The sidebar transitions into an absolute, slide-in overlay drawer with an explicit close trigger, focus trap management, and backdrop overlay click-handlers.

---

## 6. Verification & Automated Test Suites

Three dedicated test suites exist under `tests/services/` to verify continuous structural integrity:
1. `dashboard-shell.test.ts` — Validates sitemap paths, active state resolution, and localizations.
2. `dashboard-home.test.ts` — Asserts transacted RLS database aggregations, preventing unauthorized or unauthenticated queries.
3. `dashboard-services.test.ts` — Asserts that plan features (Free, Pro, Enterprise) map correctly to marketplace items without permission leakage.

Developers mounting future dashboard modules need only add their corresponding page path under `src/app/[locale]/dashboard/` to automatically inherit the global workspace layout and responsive telemetry bounds.
