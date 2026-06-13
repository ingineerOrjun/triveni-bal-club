# Phase 9.5 — Digital Magazine & Editorial Publishing

A school-newspaper CMS: **editions → block-based articles → an editorial
workflow** (draft → review → approve → schedule → publish → archive), with
versioning, comments, bookmarks, reactions, search, SEO, and analytics. Reuses
the existing auth/RBAC, RLS, audit, Media Library, design system, `DataTable`,
`StatCard`, `BarChart`, `FormState`/`FieldError`, and shared UI.

> Scope (consistent with prior phases): the full authoring + editorial lifecycle
> is **built and build-verified**. Heavyweight extras (live collaborative
> editing, actual PDF rendering, auto-publish-on-schedule worker) ship as an
> **extensible architecture + documented roadmap**, never as placeholders.

---

## Architecture
```
magazine_editions ──1:N─► magazine_articles ──1:N─► magazine_article_blocks (ordered rich content)
magazine_categories ─1:N─┘        │     │            magazine_article_gallery (media-library backed)
                                  │     ├─1:N─► magazine_comments     (moderated)
                                  │     ├─1:N─► magazine_bookmarks     (unique per user)
                                  │     ├─1:N─► magazine_reactions     (unique per user; syncs likes)
                                  │     ├─1:N─► magazine_editor_reviews (decision trail)
                                  │     └─1:N─► magazine_article_versions (snapshots)
                                  ▼
                          author_id / editor_id → users
```
Migrations: [`0026_magazine.sql`](../supabase/migrations/0026_magazine.sql) (schema, enums, FTS index, triggers),
[`0027_magazine_functions.sql`](../supabase/migrations/0027_magazine_functions.sql) (view counter, likes-sync, indexed search, RLS).

- **Library code:** [`src/lib/magazine`](../src/lib/magazine) — `blocks.ts` (block
  registry + plain-text/reading-time helpers), `schema.ts` (zod), `queries.ts`
  (reads, no N+1 — batched author/category/edition hydration), `actions.ts`
  (server actions), `pdf.ts` (PDF provider abstraction).
- **Components:** [`src/components/magazine`](../src/components/magazine) — 21
  reusable pieces (see below).
- **Types:** every table/enum/function registered in
  [`src/types/database.ts`](../src/types/database.ts).

## Block content model
Articles are an ordered list of typed blocks (`magazine_article_blocks`): each
row is `{ block_type, sort_order, hidden, data jsonb }`. The registry in
`blocks.ts` is the single source of truth — adding a block type there makes it
available in the editor and renderer. Supported: **paragraph, heading, image,
gallery, quote, divider, code, table, callout, video, button, list, checklist,
two-column, statistics, rich media**. The `BlockEditor` supports add (palette),
duplicate, move up/down, hide/show, and delete; images/galleries flow through
the **Media Library** `MediaPicker` (no independent uploads). The public
`BlockRenderer` renders text as text (never `dangerouslySetInnerHTML`) and only
allows `https://`/relative button links and known video embeds — XSS-safe.

## Editorial workflow
`draft → review → (approved | revision_required) → scheduled → published → archived`
- **Author** writes in the block editor and submits (`saveArticle` with
  `intent=submit` → `review`). Members can only edit their own `draft` /
  `revision_required` articles (RLS-enforced).
- **Editor** approves, requests revision, or sends back — recorded in
  `magazine_editor_reviews` and surfaced to the author.
- **Publish** sets `published_at`; **schedule** stores `scheduled_at`.
- Every step is **audit-logged** and routes through a **notification hook**
  (`notify()` — currently records to the audit trail; the integration point for
  email/push).

## Versioning (PART 6)
Every save writes an immutable snapshot to `magazine_article_versions`
(incrementing `version`). `VersionHistory` lists snapshots; **restore** rewrites
the article's blocks + metadata from a snapshot and snapshots again first, so
restore is itself reversible. Author and staff can view/restore; only admins can
delete versions.

## Permission matrix
| Capability | Public | Member | Editor (moderator) | Admin |
|---|:--:|:--:|:--:|:--:|
| Read published articles/editions, approved comments | ✓ | ✓ | ✓ | ✓ |
| Write articles, edit own draft, bookmark, react, comment | – | ✓ | ✓ | ✓ |
| Review / approve / revise / schedule / publish / archive | – | – | ✓ | ✓ |
| Manage comments, categories, editions | – | – | ✓ | ✓ |
| Delete article versions / any article | – | – | – | ✓ |
Enforced by middleware → server-action guards (`requireStaffUser`,
`requirePortalAccess`) → **RLS** (the real boundary) → audit.

## Public rendering & SEO (PART 8 / 13)
- [`/magazine`](../src/app/(public)/magazine/page.tsx) — latest-edition hero,
  featured story, category filter, latest + most-read, editions archive, search.
- [`/magazine/[slug]`](../src/app/(public)/magazine/[slug]/page.tsx) — edition
  page: cover, stats, contents/TOC, lead story, PDF download (placeholder).
- [`/magazine/article/[slug]`](<../src/app/(public)/magazine/article/[slug]/page.tsx>)
  — reading view: reading-progress bar, author/editor byline, block content,
  reactions, bookmark, share, prev/next, related, comments. Records a view via
  the `magazine_increment_view` definer function.
- **SEO:** per-page metadata + OpenGraph/Twitter (`createMetadata`), **Article**
  + **Breadcrumb** JSON-LD, canonical URLs, [`/magazine/rss`](<../src/app/(public)/magazine/rss/route.ts>)
  RSS 2.0 feed, and dynamic entries in [`sitemap.ts`](../src/app/sitemap.ts).

## Member portal (PART 9)
[`/portal/magazine`](../src/app/(portal)/portal/magazine/page.tsx): my articles
with status + stats, saved (bookmarks) and liked stories; `new` (write) and
`[id]/edit` (block editor + editor feedback + version history; read-only while
in review).

## Admin (PART 10)
[`/admin/magazine`](../src/app/(admin)/admin/magazine/page.tsx) dashboard +
`articles` (filter, paginate, **bulk** publish/archive/feature/unfeature/delete/
move-edition/change-category via `DataTable`), `articles/[id]` editorial console
(review form, schedule, publish, feature, archive, editor + history),
`review` queue, `categories`, `editions`, `comments` moderation, `analytics`
(popular categories/authors/editions, monthly output, top stories).

## Search & analytics (PART 11 / 12)
Search uses a Postgres GIN full-text index over title+excerpt+content via the
`magazine_search` SECURITY DEFINER function (published-only), hydrated by the
query layer. Analytics are aggregated in `getAnalytics()`/`getDashboard()` from
batched selects (views, likes, comments, by-status, by-category/author/edition,
monthly growth).

## Security (PART 16) & performance (PART 17) & a11y (PART 18)
Server Actions only; never trust client input (all writes zod-validated +
RLS-gated); slugs are unique (`slugify` + short suffix); content is rendered as
text; comments are **rate-limited** (≤3/member/minute) and **moderated**;
bookmarks/reactions are **unique per user** (DB constraints). No N+1 (batched
hydration), pagination on admin lists, lazy-loaded gallery images,
`next/image`, dynamic only where needed. WCAG-AA: keyboard-operable editor
controls, ARIA labels, semantic headings, focus-visible rings, accessible
comments and reaction `aria-pressed` state.

## PDF readiness (PART 14)
[`pdf.ts`](../src/lib/magazine/pdf.ts) defines a `PdfProvider` contract and a
default **unavailable** provider. An edition/article can already be rendered to
PDF from existing data (no schema change). `isPdfAvailable()` gates the UI
(shows "coming soon" until a provider is registered via `registerPdfProvider`).

## Deployment
Apply `0026` + `0027` with `supabase db push`. No new env vars; media uses the
existing Media Library buckets.

---

## Roadmap (documented, not yet built)
- **Real PDF generation** — implement a `PdfProvider` (serverless Chromium /
  hosted HTML→PDF) behind the existing abstraction.
- **Auto-publish scheduler** — a cron/worker to flip `scheduled → published`
  at `scheduled_at` (today an editor publishes; the schedule is recorded).
- **Collaborative editing** — real-time multi-author editing + drag-to-reorder
  blocks (the editor is structured for it; ordering is button-based today).
- **Reading history** — a per-user reads table (portal currently surfaces
  bookmarks + liked as history).
- **Richer media blocks** — audio, file attachments, embeds beyond YouTube/Vimeo.
- **Automated tests** — a Vitest harness for RLS, workflow transitions, and
  block (de)serialization (DB constraints already enforce the invariants).
