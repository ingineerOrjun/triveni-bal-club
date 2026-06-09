# Phase 8.3 — Visual CMS & Page Builder

A block-based visual CMS so a non-technical coordinator can build and manage
website pages, menus, and content — no code, no deploys. Extends existing
RBAC / RLS / audit / Media Library / Media Picker / design tokens.

> Scope (consistent with Phases 8 / 8.1 / 8.2): production-quality, build-verified
> **block engine + page builder + version history + scheduler + menus + public
> rendering**. The heaviest "Webflow/Gutenberg" pieces (full drag-drop canvas,
> TipTap WYSIWYG, split-screen live preview, form builder, SEO score /
> broken-link crawler) are documented as roadmap below.

---

## CMS architecture
Pages are rows in **`cms_pages`** storing an ordered **array of blocks** as
jsonb (`blocks`) plus `seo` jsonb and a `status`
(draft / published / scheduled / archived). Each publish writes a full snapshot
to **`cms_page_versions`** (history + rollback — published content is never lost).
Navigation lives in **`cms_menus`** / **`cms_menu_items`**. RLS: published pages
are public; staff manage; admins delete (migration `0023`).

```
Admin builder (client)  ── edit blocks/SEO ──► savePageContent / publishPage (server actions)
        │                                            │ snapshot → cms_page_versions
        ▼                                            ▼
   Block registry  ◄──────── PageRenderer (server) ──► public /pages/[slug]
   (plugin metadata)         maps block.type → component (+ dynamic data)
```

## Block registry (plugin architecture) — the core API
[`blocks.ts`](../src/lib/cms/blocks.ts) defines `BLOCK_TYPES: BlockTypeMeta[]`
— client-safe metadata: `type`, `label`, `group`, `fields: FieldDef[]`,
`defaults`, `adminOnly`. The builder's editor is **generated entirely from
`fields`** (text / textarea / richtext / number / image / boolean / select /
**list** repeater).

**Add a new section type in 2 steps:**
1. Add a `BlockTypeMeta` entry to `BLOCK_TYPES`.
2. Add a `case` to the [PageRenderer](../src/components/cms/page-renderer.tsx).

No builder rewrite. Shipped blocks: hero, heading, rich text, image,
statistics, card grid, CTA, quote, divider, spacer, **widget: upcoming events**,
**widget: committee**, custom HTML (admin-only).

## Widget system
"Widget" blocks pull **live data** at render time (server component): e.g.
`widgetEvents` queries published upcoming events, `widgetCommittee` renders the
committee. New widgets are just another block type whose renderer fetches data —
the same plug-in path.

## Rich text editor
[`rich-text-editor.tsx`](../src/components/cms/rich-text-editor.tsx) — a
Markdown editor (toolbar for bold/italic/heading/lists/quote/link, live preview,
word/char counts). Rendering uses an **XSS-safe** Markdown→HTML converter
([`markdown.ts`](../src/lib/cms/markdown.ts)) that escapes all input first and
emits only whitelisted tags with sanitized link hrefs. A full WYSIWYG (TipTap)
is roadmap.

## Page builder (editor guide)
[`/admin/pages/[id]`](../src/app/(admin)/admin/pages/[id]/page.tsx) →
[`PageBuilder`](../src/components/cms/page-builder.tsx): add sections, **reorder
(up/down), enable/disable, edit fields, remove**, edit the **SEO** tab, **Save**
(draft) and **Publish**. A **Preview** link opens `/pages/[slug]`. The sidebar
shows **version history** with one-click **rollback** (current state is
snapshotted first).

## Page management
[`/admin/pages`](../src/app/(admin)/admin/pages/page.tsx): create, list,
publish, archive, duplicate, delete (admin), with analytics (total / published /
drafts / scheduled). Every page has a unique slug and renders at
`/pages/{slug}` when published.

## Menu builder
[`/admin/menus`](../src/app/(admin)/admin/menus/page.tsx) +
[`MenuManager`](../src/components/cms/menu-manager.tsx): create menus by location
(header / footer / quick-links), add links (label, href, new-tab), reorder,
delete. `getMenuByLocation` is available to wire the public header/footer to
these menus (a small additive step; the static nav remains the default).

## Scheduler
Pages can be set to `scheduled` with a `scheduled_at`. The cron route
[`/api/cron/cms-publish`](../src/app/api/cron/cms-publish/route.ts) (CRON_SECRET-
guarded, service-role) publishes due pages — wire it to Vercel Cron (e.g. every
5 min).

## SEO guide
Per-page `seo` jsonb: meta title, description, canonical, social image (via the
Media Picker), and `noindex`. Surfaced through `generateMetadata` on
`/pages/[slug]` (title/description/canonical/robots/OG image). Global SEO
defaults remain in Settings (Phase 8).

## Media integration
Every image field uses the existing **Media Picker** (block image fields + SEO
social image). No direct uploads inside editor components — assets always flow
through the Media Library, preserving usage tracking & dedupe.

## Security
Admin/moderator editing (middleware → page redirect → `requireStaffUser` in
actions → RLS); admin-only delete and Custom-HTML block. Drafts are never public
(RLS `status='published'`). Markdown is sanitized; all edits audited.

## Performance
Server-component rendering; `/pages/[slug]` is dynamic + revalidated on publish;
widget data fetched only when a widget block is present; batched queries; block
storage as a single jsonb column (no N+1 for composition).

## Developer extension guide
- **New block:** `BlockTypeMeta` + renderer `case`. Editor auto-generates.
- **New field type:** extend `FieldType`, add a branch in `FieldEditor`
  (page-builder) and handle it in renderers.
- **New widget:** a block whose renderer fetches data (see `widgetEvents`).
- Follow existing server-action + `FormState` conventions; keep reads batched.

## Administrator guide
Open **Pages → create a page → add sections** (hero, text, cards, widgets…),
fill in the fields, **Save**, then **Publish**. Use **Preview** to see it live at
`/pages/your-slug`. Roll back anytime from **Version history**. Manage navigation
under **Menus**.

---

## Roadmap (documented, not yet built)
- Full **drag-and-drop canvas** reordering; **split-screen live preview** with
  device frames (desktop/tablet/mobile).
- **TipTap/ProseMirror** WYSIWYG (tables, embeds, color/highlight, paste-cleanup).
- **Form builder** (visual field config + submissions) — existing forms remain.
- **SEO score, broken-link & broken-image detection, redirect rules, sitemap
  toggles**; **content freshness & top-contributor** analytics.
- Wiring the public **header/footer** to `cms_menus`; per-section **moderator
  assignment**; **diff view** between versions; scheduled **expiry**.
- Converting the curated Phase-3 pages (home/about/…) to CMS pages.
