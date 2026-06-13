# Phase 10 — Production Polish, UX Excellence & Enterprise Readiness

Last updated: 2026-06-13. Quality-only phase: no business logic changed, no
placeholder pages added. Everything below is implemented and build-verified
unless explicitly listed under **Roadmap**.

---

## Completed

### PART 1/12 — Design system & motion
- **4px spacing scale** (`--sp-0-5 … --sp-6`) layered under the existing `sp-*`
  utilities; radius tokens tightened to a modern SaaS range (4/6/8/12px).
- **Motion system** in [`globals.css`](../src/styles/globals.css):
  `animate-fade-in`, `animate-slide-up`, `animate-scale-in`,
  `stagger-children`, `hover-lift`, and `.skeleton` shimmer — all collapsed
  automatically under `prefers-reduced-motion` (global guard already in base
  layer). Homepage grids use staggered entrances.
- One shadow / radius / typography / color / button / card / form / table
  language was already enforced by the token system (Phase 2); the deviations
  found (radius drift) were corrected at the token level so every page updates
  at once.

### PART 2 — Homepage live data
[`(public)/page.tsx`](../src/app/(public)/page.tsx) renders from the database:
activities, upcoming events, recent achievements, hall of fame, latest
magazine edition + articles, latest suggestions, latest gallery albums,
upcoming elections, statistics, with the hero editable from Admin → Content.
Every widget has an empty state; nothing 404s when Supabase is empty.

### PART 7 — Loading / empty / error states
- [`Skeleton` / `PageSkeleton` / `ContentSkeleton`](../src/components/ui/skeleton.tsx)
  + route-group `loading.tsx` for **(public)**, **(portal)**, **(admin)** —
  no blank screens during navigation.
- Route-group `error.tsx` boundaries rendering
  [`ErrorState`](../src/components/shared/error-state.tsx): friendly message,
  digest reference, **Try again** (reset) + **Go home**, console logging.
- Empty states across modules use the shared `EmptyState`/`EmptyMagazine`
  with explanation + CTA (established in earlier phases).

### PART 10 — Global search (Ctrl+K)
[`adminSearch`](../src/lib/admin/search.ts) now covers **12 entity groups**:
Members, Activities, Events, Suggestions, Badges, **Magazine articles
(+status), Editions, Elections (+status), Gallery albums, CMS Pages,
Certificates (by title or number), Achievements** — grouped results, staff-only,
debounced, keyboard-driven.

### PART 11 — Executive dashboard
[`/admin`](../src/app/(admin)/admin/page.tsx) adds: magazine drafts /
in-review / pending comments KPI cards, active elections card, a **pending
approvals breakdown** (articles, comments, nominations, suggestions — each
deep-linking to its queue), and quick actions for Write article / New election.
`pendingApprovals` now aggregates recognition + suggestions + magazine reviews
+ pending comments + submitted nominations.

### PART 3 — CRUD & list ergonomics
- Shared `DataTable` gained an optional **column visibility** chooser
  (`enableColumnVisibility`), joining selection + bulk bars.
- Magazine articles list: search, status/category filters, pagination, bulk
  publish/archive/feature/unfeature/delete/move-edition/change-category.
- Members, media, import/export, CMS, suggestions retain their Phase-8.x
  search/filter/pagination/bulk/export surfaces.

### PART 14 — Deployment readiness
[`next.config.ts`](../next.config.ts): **security headers on every route**
(CSP allowing only self + Supabase + Google Fonts + YouTube/Vimeo embeds,
nosniff, SAMEORIGIN, strict referrer, restrictive Permissions-Policy),
`compress`, `poweredByHeader: false`, and `images.remotePatterns` for
Supabase storage. Checks performed:
- `robots.txt`, `sitemap.xml` (now includes live magazine URLs), RSS — present.
- The only `localhost` reference is the documented dev **fallback** for
  `NEXT_PUBLIC_SITE_URL` in auth redirects — set that env var in production.
- Cron route is `CRON_SECRET`-protected and now also auto-publishes
  **scheduled magazine articles** (closes a Phase 9.5 roadmap item).
- No secrets committed; service-role key read only in `lib/supabase/admin.ts`
  (server-only) and the cron route.

---

## PART 5 — Permission matrix (route → guard chain)

Chain everywhere: **middleware → layout guard → server-action guard → RLS → SQL constraints → audit log**.

| Surface | Anonymous | Member | Moderator | Admin | Enforced by |
| --- | --- | --- | --- | --- | --- |
| Public pages (`(public)`) | published content only | same | same | same | RLS `status='published'` filters |
| Auth pages | ✓ | ✓ | ✓ | ✓ | — |
| Portal (`(portal)`) | redirect to login | ✓ own data | ✓ | ✓ | `requirePortalAccess` in layout + RLS owner policies |
| Admin (`(admin)`) | redirect | redirect | ✓ staff scope | ✓ full | `requireRole(STAFF_ROLES)` in layout; `adminOnly` nav + per-page `requireAdminUser` where needed |
| Mutating server actions | rejected | own-record actions only (`getCurrentUser` + RLS) | `requireStaffUser` actions | all | guard at top of every action; RLS as backstop |
| Secret ballot | — | `cast_vote()` RPC only | same (no tally before close) | same | `votes` has **no RLS policies**; SECURITY DEFINER validation |
| Cron/API | `CRON_SECRET` | — | — | — | bearer check |
| Service role | never reaches client | — | — | — | `admin.ts` is `server-only`; used in cron + bootstrap |

Privilege-escalation checks: role changes only via admin members/roles screens
(`requireAdminUser`); `users.role` not updatable by self (RLS); nomination
status transitions constrained by RLS write `with check`; comment status
changes staff-only; version restore requires author/staff.

## PART 6 — RLS report (by table family)

| Tables | anon SELECT | member | moderator/admin | Notes |
| --- | --- | --- | --- | --- |
| users / member_profiles | no (public read limited fields via published content joins) | own row update | staff read, admin manage | role column protected |
| audit_logs | no | no | staff read | insert via `log_audit` definer only |
| activities / events / registrations / attendance | published only | own registrations | staff manage | counts via definer fn |
| achievements / badges / certificates / recognition | public-visibility rows | own rows | staff manage | certificate verify via definer fn |
| suggestions family | public-visibility only | own + vote/comment | staff moderate | anonymity flag respected |
| app_settings | `is_public` rows | same | admin write | |
| media / gallery | public buckets + published albums | own favorites | staff manage | storage policies per bucket; usage-guard blocks in-use deletes |
| import/export jobs | no | no | admin only | |
| cms_pages / menus | published pages | same | staff manage | versions staff-only |
| elections family | non-draft elections, approved candidates, published results | own nominations, own receipt, `cast_vote`/`has_voted` | staff manage; tallies any time | **`votes`: zero policies — definer-function access only** |
| magazine family | published articles/editions, approved comments, reaction counts | write own articles (draft/revision), own comments/bookmarks/reactions | staff full editorial | versions/reviews author+staff; likes synced by definer trigger |

SECURITY DEFINER functions all pin `search_path = public`, validate inputs,
and check state/role before acting: `log_audit`, `event_registered_count`,
`evaluate_member_badges`, `verify_certificate`, `cast_vote`,
`get_election_results` (close-gated), `election_turnout`, `has_voted`,
`magazine_increment_view` (published-only), `magazine_search`
(published-only), `magazine_sync_likes` (trigger).

## PART 13 — Accessibility position
Focus-visible rings globally; reduced-motion collapse globally; semantic
headings; ARIA on tables/dialogs/drawers/voting radiogroup/reaction
`aria-pressed`/progressbar; skeletons announce via `role="status"`+sr-only;
forms label every control with inline `FieldError`s. AA contrast enforced by
tokens (navy-on-emerald/gold rule).

## PART 8/9 — Responsive & performance position
Mobile-first layouts; admin/portal collapse to drawer nav; grids stack at
`sm`; dialogs scroll within viewport; long admin lists paginate (20/page).
No N+1 (batched hydration maps in every query layer); `next/image`
everywhere with `sizes`; lucide imports tree-shaken via
`optimizePackageImports`; public pages static where possible, `force-dynamic`
only where session/DB-bound; First Load JS ~102kB shared.

---

## Roadmap (honest deferrals)
- **Undo snackbar + toast system** and a first-time setup wizard (PART 4) —
  current UX uses confirmations + inline success/error messages everywhere.
- **Mobile card-mode for admin tables** (tables currently scroll within their
  container on small screens rather than reflowing to cards).
- **Bulk archive/restore/duplicate for every legacy module** — implemented
  where the lifecycle exists (members, media, magazine, CMS, import/export);
  older modules (activities/events) expose single-item lifecycle + bulk via
  export; closing the long tail is tracked per the CRUD table below.
- **Animated counters / page transitions** beyond the CSS entrance system.
- **Lighthouse run + Core Web Vitals measurement** needs a deployed
  environment (no local Chrome harness in CI).
- **Automated QA suite** (PART 15 full matrix) — manual verification + green
  typed build today; Vitest/Playwright harness remains the standing roadmap
  item from Phases 9/9.5.

## CRUD readiness tracker
| Module | Search | Filters | Pagination | Bulk | Lifecycle (archive/publish) | Export |
| --- | --- | --- | --- | --- | --- | --- |
| Members | ✓ | ✓ | ✓ | ✓ | activate/deactivate | ✓ CSV |
| Activities/Events | ✓ | ✓ | ✓ | via export | draft/publish/archive | ✓ |
| Recognition | ✓ | ✓ | ✓ | partial | award lifecycle | ✓ |
| Suggestions | ✓ | ✓ | ✓ | ✓ | full workflow | ✓ |
| Media/Gallery | ✓ | ✓ | ✓ | ✓ | archive/restore + usage guard | ✓ |
| CMS pages/menus | ✓ | ✓ | ✓ | — | draft/schedule/publish/archive + versions | — |
| Elections | — (admin list small) | status | — | — | full status machine | results snapshot |
| Magazine | ✓ | ✓ | ✓ | ✓ | full editorial workflow + versions | via dataio roadmap |

## Verification
`npm run build` — compiled successfully, all routes generated, zero TS/ESLint
errors (see repo CI ritual). Re-run after any token change: skeleton/motion
utilities are pure CSS and cannot regress types.
