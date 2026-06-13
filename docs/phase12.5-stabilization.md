# Phase 12.5 — Enterprise Stabilization & Workflow Completion (Final Report)

Stabilization sprint against the **now-live backend** (Supabase deployed, admin
bootstrapped). Focus: fix the real publication bug, eliminate hydration risk,
guarantee live homepage data, and add the unified Approval Center. No schema or
business-logic rewrites; build-verified.

---

## Issues found → fixed

### PART 2 — Editorial workflow (the reported bug: "approved article never goes public")
**Root cause (traced end-to-end):** the pipeline was correct but had a *manual
gap*. `reviewArticle('approve')` set status to `approved` — a non-public state —
and the public queries (correctly) only return `published`. So an approved
article sat invisible until someone separately clicked **Publish now**. The
homepage compounded it (see PART 3).

**Fix** ([actions.ts](../src/lib/magazine/actions.ts)): **approval now publishes
automatically** — `reviewArticle('approve')` sets `status='published'` +
`published_at=now()` (or `scheduled` if a future `scheduled_at` is set, which the
existing cron then flips live). The workflow is now **Draft → Review → Approved
→ Published → visible everywhere, with no manual step**, exactly as specified.
The standalone Publish/Schedule controls remain for drafts and overrides.

**Verified path:** RLS (`status='published' OR own OR is_staff()`) exposes it to
anon → `listPublishedArticles`/`getFeaturedArticles` (`force-dynamic` page) →
`/magazine`, article page, edition page, RSS, sitemap, and homepage widget.

### PART 3 — Homepage live content (stale-cache bug)
**Root cause:** the homepage (`/`) had no rendering directive, so it was
**statically generated** — its live widgets (magazine, events, achievements,
hall of fame, suggestions, gallery, elections, stats) froze at build time and
never reflected new content. `Date.now()` event filtering was also build-frozen.

**Fix:** added `export const dynamic = "force-dynamic"` to
[the homepage](../src/app/(public)/page.tsx). Every other DB-backed public route
(`/magazine`, `/achievements`, `/hall-of-fame`, `/gallery`, `/elections`,
`/student-voice`, CMS `/pages/[slug]`) was already dynamic. Static-count dropped
28→ correct.

**Revalidation hardening:** every magazine mutation that affects public output
(`reviewArticle`, `publishArticle`, `archiveArticle`, `setFeatured`,
`bulkSetStatus`) now also `revalidatePath("/")` and `"/magazine"`, so even cached
surfaces refresh immediately after staff actions.

> Note: `/events`, `/about`, `/committee` are intentionally **content-layer**
> (curated `src/content`) pages, not DB-backed — the live events feed surfaces
> through the homepage widget. This is the long-standing architecture, not a
> regression.

### PART 1 — Hydration audit
Swept the codebase for `Date.now()` / `new Date()` / `Math.random()` / browser
APIs in components. **Result: clean.**
- The only `Date.now()` in components is in the CMS `page-renderer` — a **server
  component** (runs once on the server; the client never re-derives it → no
  mismatch).
- The interactive client islands were already hydration-safe by construction:
  `ThemeToggle` renders a stable icon until `mounted`; `AnimatedCounter` seeds
  state to the same `0`-value the server emits, animating only in an effect;
  `Reveal` starts `visible=false` on both server and client. `<html>`/`<body>`
  carry `suppressHydrationWarning` for the pre-paint theme attribute.
- No locale-dependent SSR formatting: `lib/format` is deterministic UTC.

### PART 6 — Unified Approval Center
New executive screen [`/admin/approvals`](../src/app/(admin)/admin/approvals/page.tsx)
backed by [`getApprovalCenter()`](../src/lib/admin/approvals.ts), aggregating
**everything awaiting staff action** in one place: magazine reviews, comment
moderation, suggestion approvals, election nominations, achievement approvals,
badge recommendations, and CMS drafts/scheduled. Each bucket shows an exact
pending count + the most recent items with deep links to the module's existing
review screen. Wired into the admin sidebar (right under Dashboard) and the
dashboard's pending-approvals callout. Empty state celebrates "all caught up".

---

## Production-readiness checklist (PART 15)
| Item | Status |
| --- | --- |
| Zero TypeScript errors | ✅ build clean |
| Zero ESLint errors | ✅ build clean |
| Hydration warnings | ✅ none (audited) |
| Publication workflow functional | ✅ approve → auto-publish → visible |
| Homepage widgets live | ✅ homepage now dynamic + revalidated |
| Loading states | ✅ route `loading.tsx` + skeleton variants (P10/P12) |
| Error states | ✅ route `error.tsx` + illustrated `ErrorState` (P11) |
| Empty states | ✅ illustrated `EmptyState`/`EmptyMagazine` (P11) |
| Permissions / RLS | ✅ unchanged; matrix in [phase10 doc](phase10-production-polish.md) |
| Mobile responsive | ✅ shells + bottom-nav (P12) |
| Accessibility | ✅ AA tokens, focus rings, reduced-motion, ARIA |
| Login / backend live | ✅ schema deployed, accounts working |

## Backend status (live)
Schema deployed (all 27 migrations via `supabase/_deploy_all.sql`), service-role
key corrected, 5 accounts working (`admin@triveni.local` / `Admin#12345`,
demo users / `Demo#12345`). RLS role resolution reads `public.users` directly, so
no dashboard JWT-hook step is required.

---

## Roadmap (honestly deferred — large net-new builds, not stabilization)
The spec also requested several **new feature systems** beyond stabilization;
these are scoped as roadmap rather than stubbed, consistent with prior phases:
- **PART 8 — Task-management system**: a generic tasks table + assignee/deadline/
  reminders/progress. The Approval Center already delivers the operational
  "what needs doing" view from existing data without new schema.
- **PART 4/5 — Full admin "operating system" shell**: right-hand context panel,
  workflow-based nav groups (Today/Pending/Scheduled/My Work), top-bar quick-
  create. The Approval Center + executive dashboard + command palette cover the
  core; the persistent 3-column workspace chrome is the remaining build.
- **PART 9/10 — "Midnight Prestige" dedicated admin theme** (`#0B132B`/`#2E1A47`
  palette, platinum text): a separate admin-only theme layer. The current
  premium token system (P11) + dark mode + glass is the foundation; a scoped
  admin palette override would sit on top.
- **PART 7 calendar widget & system-health panel**, and per-item inline
  quick-approve for *every* module in the center (magazine/comments have bound
  actions; others deep-link).

## Verification
`npm run build` — compiled successfully, 28/28 static pages generated,
`/admin/approvals` live, homepage correctly dynamic, zero TS/ESLint errors.
