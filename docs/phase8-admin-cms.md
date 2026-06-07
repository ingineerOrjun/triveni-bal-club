# Phase 8 — Admin CMS & Management Platform

Extends the existing system (auth, RBAC, RLS, audit, design system). Nothing was
rewritten. This phase delivers the **platform core** of the admin CMS plus a
documented roadmap for the remaining domain modules (which follow the exact same
patterns established here and in Phases 5–7).

---

## 1. Admin architecture

```
Browser
  │  Ctrl+K command palette · sidebar nav · breadcrumbs
  ▼
Middleware  ── blocks /admin for non-authenticated users
  ▼
(admin) layout ── requireRole([moderator, admin]) (server gate)
  ▼
Admin pages (Server Components) ── per-page admin-only redirect where needed
  ▼
Server Actions / Route Handlers ── requireStaffUser / requireAdminUser, Zod
  ▼
RLS + DB constraints ── the real security boundary
  ▼
audit_logs ── every privileged action recorded
```

- **Shell**: [`admin-shell.tsx`](../src/components/admin/admin-shell.tsx) — collapsible-friendly sticky sidebar, mobile drawer, role-filtered nav (admin-only items hidden from moderators), global search, sign-out, link back to the member portal.
- **Layout gate**: [`(admin)/layout.tsx`](../src/app/(admin)/layout.tsx) requires moderator/admin; admin-only pages (`members`, `settings`, `content`, `roles`, `audit`) additionally `redirect()` non-admins.

## 2. Dashboard & analytics
[`/admin`](../src/app/(admin)/admin/page.tsx) — quick actions, a pending-approvals callout, stat cards (members, committee, activities, upcoming events, ideas to review, certificates, badges, programs), two dependency-free bar charts (suggestions/activities by status), recent audit log, and newest members. All counts use **batched `head:true` count queries** ([`dashboard.ts`](../src/lib/admin/dashboard.ts)) — no N+1.

## 3. Global search (Ctrl+K)
[`command-palette.tsx`](../src/components/admin/command-palette.tsx) + [`search.ts`](../src/lib/admin/search.ts). Debounced, staff-guarded, results grouped by module (Members, Activities, Events, Suggestions, Badges); quick actions when empty. Keyboard shortcut `Ctrl/Cmd+K`.

## 4. Website content manager (CMS)
[`/admin/content`](../src/app/(admin)/admin/content/page.tsx) edits the homepage hero and SEO defaults; [`/admin/settings`](../src/app/(admin)/admin/settings/page.tsx) edits club info, contact, social, and feature toggles. Backed by the **`app_settings`** key→jsonb store (migration [`0017`](../supabase/migrations/0017_app_settings.sql)) with RLS (public keys readable by anon, admin-only writes).

The public homepage hero reads these via `getPublicSettings()` — a **cookie-free** anon read so public pages stay static and ISR-revalidate when settings are saved (`revalidatePath`). This is how "no code changes required" is realised. Wiring additional public surfaces (footer/contact/about) follows the same `readSetting(...)` pattern.

## 5. Member management
[`/admin/members`](../src/app/(admin)/admin/members/page.tsx) — search, role filter, **server-side pagination**, row selection, **bulk role assignment / activate / deactivate** ([`bulkMemberAction`](../src/lib/admin/actions.ts), self-row protected), and **CSV export** ([`/api/admin/members/export`](../src/app/api/admin/members/export/route.ts), staff-guarded). [`/admin/members/[id]`](../src/app/(admin)/admin/members/[id]/page.tsx) shows profile + cross-module activity counts and role/status controls.

## 6. Audit log viewer
[`/admin/audit`](../src/app/(admin)/admin/audit/page.tsx) — filter by action (text) and entity type, paginated, actor names resolved in batch. Admin-only ([`audit.ts`](../src/lib/admin/audit.ts)).

## 7. Roles & permissions
[`/admin/roles`](../src/app/(admin)/admin/roles/page.tsx) — read-only permission matrix generated from the single source of truth (`PERMISSIONS` in [`roles.ts`](../src/lib/auth/roles.ts)), mirrored by RLS. Editable custom roles are roadmap (see §Roadmap).

---

## Table framework guide
[`DataTable<T>`](../src/components/admin/data-table.tsx) — a reusable, typed table:
- `columns: Column<T>[]` with `render(row)`, alignment, custom classes.
- `selectable` → select-all (with indeterminate state) + per-row checkboxes + a **sticky bulk-action bar** via `renderBulkBar(ids, clear)`.
- Built-in empty state; selections auto-prune when rows change.
- **Division of responsibility**: sorting, filtering, and pagination are driven by the **page** through URL params (server-rendered); the table owns presentation + client selection. Example consumer: [`members-table.tsx`](../src/components/admin/members-table.tsx).

## Form framework guide
Established across phases and reused here: `FormState` + `useActionState`, [`FieldError`](../src/components/shared/field-error.tsx), [`ActionButton`](../src/components/shared/action-button.tsx) (pending state + confirm), and the generic [`SettingsForm`](../src/components/admin/settings-form.tsx) (config-driven fields + toggles + inline save feedback). All forms: Zod-validated on the server, role-guarded, audit-logged, friendly errors, accessible (`role="alert"/"status"`, labelled inputs).

## Import / export guide
- **Export**: implemented for members as streamed CSV (`/api/admin/members/export`). The same route pattern (staff guard → query → `text/csv` response) generalises to any module.
- **Import**: roadmap. Recommended approach — a route handler accepting an uploaded CSV, parsed + Zod-validated row-by-row, with a preview/confirm step and partial-import + error report. Hook for `BOOTSTRAP`-style provisioning already exists.

## Media library guide
Roadmap. Design: a `media_assets` table (path, alt, folder, tags, size, dimensions, uploaded_by) + a Supabase Storage bucket; an upload route issuing signed URLs (direct-to-Storage, as documented in [`docs/04-database.md`](04-database.md) §Media); a reusable `<MediaPicker>` modal that every module reuses (no duplicate uploads). Gallery management builds on this.

## Permissions guide
Roles: `public | member | moderator | admin`. `PERMISSIONS` maps capability → roles; `can(role, perm)` is the app-layer check, RLS is the enforcement floor. To add a capability: add it to `PERMISSIONS`, use `requireStaffUser`/`requireAdminUser`/`can()` in the action, and add/adjust the RLS policy. The `/admin/roles` matrix renders automatically.

## Developer guide (extending the admin)
1. Add a query in `src/lib/<module>/queries.ts` (batched, env-resilient, `head:true` counts, URL-driven filters).
2. Add Zod schema + role-guarded, audited server actions.
3. Build the page as a Server Component reading `searchParams`; use `DataTable` + `SuggestionSearch`/filters + `Pagination`.
4. Add a nav entry in `admin-shell.tsx` (set `adminOnly` if needed) and to the command palette.
5. Add RLS + constraints in a new migration; never edit a merged migration.
6. `npm run build` must stay green.

## Administrator guide (non-technical)
- **Dashboard** is your home — counts, charts, and anything awaiting review.
- **Ctrl+K** searches everything; the quick-action buttons create common items.
- **Content** edits the homepage and SEO; **Settings** edits club info, contacts, social links, and feature switches — changes appear on the public site automatically.
- **Members** lets you search, change roles, activate/deactivate, and export to CSV. Select rows for bulk actions.
- **Audit Log** shows who did what, when.
- Destructive actions ask for confirmation; you can't change your own role/status (prevents lock-out).

---

## Roadmap (documented, not yet built)
These follow the same patterns; each is an additive migration + lib + page:
- **Media Library** (Storage bucket, `media_assets`, `<MediaPicker>`) + Gallery management CRUD (gallery is currently static content).
- **CSV/Excel import wizard** (preview, validation, partial import, history) — export is done.
- **Editable custom roles & permission matrix editor** (move `PERMISSIONS` into a DB table; today it's code + RLS).
- **Calendar/agenda view** for events; **certificate templates & bulk generation**.
- **Saved table views, column visibility, virtualization** for very large tables.
- **Notifications area** (Phase wiring — `audit_logs`/status history already provide the events to subscribe to).

These are intentionally deferred to keep this turn's deliverables production-quality and fully build-verified rather than broadly stubbed.
