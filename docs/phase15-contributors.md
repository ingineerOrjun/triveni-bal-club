# Phase 15 — Community Editorial Platform & Author Recognition

Turns the magazine from an admin tool into a **contributor-credited platform**:
every author gets a public profile + portfolio, and articles are credited to the
*contributor*, not the editor. Built on the existing magazine workflow; no
existing functionality removed; build-verified.

> Scope note: most of Phase 15's 20 parts **already existed** from Phases
> 9.5 / 12.5 / 14 (editorial workflow, version history, reviews, comments /
> reactions / bookmarks, audit-logged transitions, immersive reading page, RSS,
> sitemap, search, admin editorial dashboard). This phase adds the genuinely new
> layer — **contributors + public author pages** — and wires it through. The
> remaining advanced items are documented as roadmap rather than stubbed.

---

## Built this phase (the new layer)

### Contributor model ([0029_contributors.sql](../supabase/migrations/0029_contributors.sql))
- `contributors` table — a public author identity optionally linked to a user
  account: `type` (student / teacher / staff / alumni / guest / club_member),
  slug, display_name, photo + cover, headline, bio, class/section/department,
  graduation_year, organization, designation, website, `social_links` jsonb,
  `featured`, `verified`. One row per user (`unique(user_id)`).
- `magazine_articles.contributor_id` — articles are credited to a contributor;
  legacy rows fall back to the author user.
- **RLS:** profiles are public-read; a member manages **their own** profile;
  staff manage all; admin deletes. (Part 18 ownership enforced at the DB.)

### Library ([src/lib/contributors](../src/lib/contributors))
- `queries.ts` — `listContributors`, `getContributorBySlug/ById/ForUser`,
  `getContributorForArticle` (explicit link → author fallback),
  `getContributorArticles` (+ `contributorStats`: articles / views / likes /
  top category), and `ensureContributorForUser` (auto-creates a baseline profile
  the first time someone authors).
- `actions.ts` — `upsertMyContributorProfile` (zod-validated self-serve editor),
  audit-logged + revalidated.
- **Auto-credit:** `createArticle` now ensures the author's contributor exists
  and stamps `contributor_id` — so credit is automatic from the first draft.

### Public author profiles (Part 3 / 9)
- [`/authors/[slug]`](../src/app/(public)/authors/[slug]/page.tsx) — editorial
  hero (cover or aurora), avatar, type + verified badge, headline, affiliation
  line, bio, social links, **stats** (published / views / reactions / top
  category), **Featured work**, and full **portfolio**. Person + Breadcrumb
  **JSON-LD**, OG metadata.
- [`/authors`](../src/app/(public)/authors/page.tsx) — contributor directory
  (featured + all), gradient-border cards.
- **Article byline now links to the profile** ([article page](<../src/app/(public)/magazine/article/[slug]/page.tsx>)
  via the upgraded `AuthorCard`), showing the contributor's name, photo, and
  headline — the premium magazine credit (Part 9).

### Self-serve submission identity (Part 4)
- [`/portal/magazine/profile`](../src/app/(portal)/portal/magazine/profile/page.tsx)
  — members edit their own author profile (identity, affiliation, photos via the
  Media Library, social links) and jump to their public page. Linked from the
  portal magazine header. The existing "My magazine" already provides drafts /
  under-review / published / bookmarks / writing stats.

### Discovery & SEO (Part 13 / 19)
- Author profiles + the directory are in [`sitemap.ts`](../src/app/sitemap.ts);
  "Authors" added to the footer. Person/Article/Breadcrumb schema, canonical
  URLs, OG/Twitter, RSS all in place from prior phases.

---

## Already in place (mapped to the spec)
| Part | Where |
| --- | --- |
| 1 Editorial architecture (draft→review→approve→publish) | magazine workflow (P9.5) + auto-publish-on-approve (P12.5) |
| 5 Editorial workflow + audit + version history | `reviewArticle`/`publishArticle` + `magazine_article_versions` |
| 6 Review system (approve/revise/reject, remarks, no overwrite) | `magazine_editor_reviews` + review form |
| 7 Version control (snapshot every save, restore) | VersionHistory + `snapshotVersion` |
| 10 Editorial dashboard (drafts/reviews/scheduled/top, queue) | `/admin/magazine` + Approval Center (P12.5) |
| 14 Notifications | audit-trail `notify()` hook (email/push = roadmap) |
| 16 Social (bookmark/react/comment/share) | shipped in P9.5 |
| 17 Immersive reading page | redesigned editorial read (this session) |
| 19 SEO/RSS/sitemap/schema | shipped + extended here |

## Roadmap (honest deferrals — net-new systems)
- **Co-authors** (Part 2): one primary contributor today; a join table for
  secondary authors is additive.
- **Follow contributors + follower counts** (Parts 8/11/16): needs a follows
  table; profiles show portfolio + stats today.
- **Writing achievements / milestones / ranks** (Part 8): integrate with the
  existing Achievement engine (badge rules like "5 published", "1000 reads").
- **Per-contributor private analytics charts** (Part 11): stats are computed and
  shown publicly; interactive private dashboards are a follow-up.
- **Contributor search in Ctrl-K** (Part 13): article search exists; adding a
  contributors group to `adminSearch` + a public author search is small.
- **Edition editor's-note / featured-contributors / PDF** (Part 15) and
  **homepage contributor strips** (Part 12): data is available; bespoke UI
  remains.

## Action required
Apply the new migration in Supabase (SQL editor) — or re-paste
`supabase/_deploy_all.sql`:
```sql
-- 0029_contributors.sql  (creates contributors + adds magazine_articles.contributor_id)
```
Until then, author pages render empty states and bylines fall back to the
author's account name.

## Verification
`npm run build` — compiled successfully, 28/28 pages, `/authors`,
`/authors/[slug]`, `/portal/magazine/profile` generated, zero TS/ESLint errors.
