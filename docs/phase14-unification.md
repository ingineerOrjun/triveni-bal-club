# Phase 14 — Design System Unification & Experience Perfection

A UX-refinement sprint. Most of the unified design language was already
established across Phases 11–13 (tokens, glass, gradients, motion, dark mode,
Midnight Prestige admin theme + 3-column shell, premium Button/Card/Dialog/
Drawer, skeletons, illustrated empty/error states, animated counters, reveal,
mobile bottom-nav). This phase closes the two **remaining reusable frameworks**
the spec centers on and that had been carried as roadmap, then documents the
broad page-by-page adoption. No schema/API/logic changes; build-verified.

---

## Delivered this phase

### PART 12 — Global toast system ([toast.tsx](../src/components/ui/toast.tsx))
Dependency-free notification framework: a `ToastProvider` (mounted once in the
[root layout](../src/app/layout.tsx)) holds a capped queue; `<Toaster>` portals
to `<body>` and auto-dismisses. Supports **success / error / warning / info**,
an optional **action button (e.g. Undo)**, a **progress bar**, queueing, and
manual dismiss — all `prefers-reduced-motion`-safe and AA-labelled
(`role=status`, `aria-live`). Consumed via `useToast()` from any client
component; a safe no-op fallback means a stray call never crashes a subtree.
**Wired live** into the magazine bulk-action bar (publish/archive/feature/
move/delete now confirm with a success toast). It inherits the Midnight
Prestige tokens automatically inside the admin tree.

### PART 2 — One unified PageHeader ([page-header.tsx](../src/components/shared/page-header.tsx))
A single reusable header composing **breadcrumb · back link · title · subtitle ·
badge/status · actions · stat strip**, all on the 8px system — superseding the
ad-hoc per-page headers. Adopted in the Approval Center as the reference
implementation (breadcrumb + pending badge); ready to roll across every admin/
portal page (the older `PortalPageHeader` remains a thin compatible subset, so
adoption is incremental and non-breaking).

---

## Already unified (Phases 11–13 — reused, audited consistent here)
| Spec part | Where it lives | Status |
| --- | --- | --- |
| PART 3 Card system (default/glass/elevated/gradient-border/interactive) | `ui/card.tsx` | ✓ |
| PART 4 Table (search/filter/sort/paginate/column-vis/bulk/empty) | `admin/data-table.tsx` + module tables | ✓ (mobile card-mode = roadmap) |
| PART 5 Form framework (sections, labels, inline validation, loading) | `FormState`/`FieldError`/`Button loading` | ✓ |
| PART 6 Button system (8 variants, loading, uppercase-in-admin, focus) | `ui/button.tsx` | ✓ |
| PART 7 Modal system (sizes, ESC, focus trap, glass backdrop) | `ui/dialog.tsx` (Radix) | ✓ |
| PART 8 Drawer system | `ui/drawer.tsx` (vaul) | ✓ |
| PART 9 Loading (skeletons: page/content/card/table/form) | `ui/skeleton.tsx` + route `loading.tsx` | ✓ |
| PART 10 Empty states (illustrated) | `shared/empty-state.tsx` | ✓ |
| PART 11 Error states (illustrated, retry/home/support) | `shared/error-state.tsx` + route `error.tsx` | ✓ |
| PART 13 Badge system | `ui/badge.tsx` + `status-badge`/magazine/election badges | ✓ |
| PART 14 Iconography (lucide, consistent sizing) | shared `size-*` convention | ✓ |
| PART 15 Animation language (150–500ms, fade/slide/scale/reveal/stagger/counter/shimmer) | `globals.css` + `Reveal`/`AnimatedCounter` | ✓ |
| PART 16–18 Spacing / typography / color tokens | `tokens.css` / `theme.css` / `admin.css` | ✓ |
| PART 19 Mobile (bottom-nav, drawers, touch targets) | portal bottom-nav + responsive shells | ✓ (table card-mode = roadmap) |
| PART 21 Navigation (active indicators, grouped nav, command palette, breadcrumbs) | admin shell + `CommandPalette` + new `PageHeader` breadcrumbs | ✓ |
| PART 22 Accessibility | focus rings, ARIA, reduced-motion, semantic HTML | ✓ |

## Roadmap (honest deferrals — mechanical adoption, not new capability)
- **Roll `PageHeader` + toasts onto every page/action**: the frameworks exist
  and are wired in reference spots; applying them across all ~40 admin/portal
  pages + every mutating action is repetitive adoption work best done as a
  dedicated sweep (kept out of one pass to protect the green build).
- **Table mobile card-mode** + **saved views / column-vis on every legacy list**
  (PART 4/19): present on high-traffic tables; the long tail remains.
- **Homepage editorial storytelling** (PART 20): alternating asymmetric/magazine/
  timeline compositions — the primitives (glass, gradient, reveal, hero) are in
  place; the bespoke composition is a focused design build.
- **Dirty-state / unsaved-changes guard** on forms (PART 5): inline validation +
  loading states ship today; the navigation-block guard is additive.

## Verification
`npm run build` — compiled successfully, 28/28 pages, zero TS/ESLint errors.
The toast provider mounts globally (public + portal + admin); `PageHeader` and
`useToast` are typed, SSR-safe, and tokenized so they adopt Midnight Prestige in
admin and the Civic-Optimist palette elsewhere automatically.
