# 07 — Development Standards

## 1. Coding Standards

- **TypeScript strict** everywhere. No `any` (use `unknown` + narrowing). No non-null `!` except where provably safe with a comment.
- **Server-first.** A component is a Server Component unless it needs state/effects/browser APIs — then add `'use client'` and keep it as small a leaf as possible.
- **Colocate by feature.** Logic for a domain lives under `features/<domain>/`; pages compose it.
- **Pure functions in `lib/`**, side-effecting DB calls in `queries.ts`/`actions.ts`.
- **No data fetching in `components/ui`** — they are presentational only.
- **One responsibility per file.** Actions file = writes, queries file = reads, schema file = validation.
- **Prefer composition over props explosion**; lift shared layout into `components/layout`.
- **Async/await** only (no `.then` chains). Handle errors with the Result pattern (below).
- **Accessibility is non-negotiable:** semantic HTML, labelled inputs, focus management, `alt` text required (DB enforces `gallery_items.alt_text not null`).
- **Comments** explain *why*, not *what*. Match surrounding density.
- **Formatting/linting:** Prettier + ESLint (`next/core-web-vitals`, `@typescript-eslint`), enforced in CI and a pre-commit hook.

## 2. Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Folders / routes | kebab-case | `magazine-issues/`, `/admin/announcements` |
| React components | PascalCase | `ActivityCard.tsx` |
| Hooks | `useX` camelCase | `useElectionResults.ts` |
| Server actions | verb-first camelCase | `castVote`, `createElection` |
| Query functions | `getX` / `listX` | `getActivityBySlug`, `listOpenElections` |
| Zod schemas | `XSchema` | `CreateActivitySchema` |
| Types/interfaces | PascalCase | `ActivityWithParticipants` |
| DB tables | snake_case, plural | `event_registrations` |
| DB columns | snake_case | `published_at`, `title_ne` |
| Enums (DB) | snake_case type, snake values | `content_status` → `draft` |
| Constants | UPPER_SNAKE | `ROLES`, `BUCKETS` |
| Env vars | `NEXT_PUBLIC_*` (client) else server | `SUPABASE_SERVICE_ROLE_KEY` |
| Storage paths | `{bucket}/{owner|album}/{uuid}` | `avatars/{user_id}/profile.webp` |

Bilingual columns/fields always use the `_en` / `_ne` suffix pair.

## 3. Error Handling Strategy

Two error classes, handled differently:

### Expected errors (return, don't throw)
Validation failures, "forbidden", "not found for this user", "election closed". Actions return a typed result:
```
type ActionResult<T> =
  | { ok: true;  data: T }
  | { ok: false; error: { code: string; message: string; fields?: Record<string,string> } }
```
UI renders these inline (form errors, toasts). No crash.

### Unexpected errors (throw, caught by boundaries)
DB down, programmer bug. Thrown as `AppError` subclasses, surfaced by:
- `app/error.tsx` — route-level error boundary (friendly bilingual message + retry).
- `app/global-error.tsx` — root fallback.
- `app/not-found.tsx` — 404.

### Rules
- Never leak raw DB/Supabase error messages or stack traces to the client; map to safe codes.
- Log server-side with context (actor, action, entity) — integrate Sentry/Vercel logging in Phase 8.
- Centralize error mapping in `lib/errors.ts` (`AppError`, `ForbiddenError`, `NotFoundError`, `ValidationError`, `toResult()`).
- Every Server Action wraps its body in a `try/catch` that converts unexpected throws into a generic `{ ok:false, error:{ code:'unexpected' } }` while logging the real cause.

## 4. Media / Storage Strategy

### Buckets
| Bucket | Visibility | Contents |
|--------|-----------|----------|
| `avatars` | public read | profile photos |
| `gallery` | public read | event/activity photos |
| `magazine` | public read | article covers & student art |
| `documents` | private | exports, sensitive files |

### Upload pipeline
1. Client requests a **signed upload URL** from a Server Action (after auth + role + Zod check on filename/type/size).
2. File uploaded directly to Supabase Storage (offloads bandwidth from the server).
3. On success, the action stores the **path** (not a public URL) in the DB row.
4. Public URLs derived at render time; private files served via short-lived signed URLs.

### Rules
- **Validate** MIME type + size server-side; cap (e.g. images ≤ 5 MB).
- **Normalize** images to `webp`, generate responsive sizes (Next.js `<Image>` + Supabase transform).
- **Path = ownership boundary:** Storage RLS ties write access to `auth.uid()` folder (avatars) or role (gallery/magazine).
- **Alt text mandatory** for gallery (a11y + DB NOT NULL).
- Orphan cleanup: a periodic cron reconciles Storage objects with DB references.

## 5. Security Guidelines

- **RLS on every table** — the real security boundary (see doc 04 §5, doc 05).
- **Three-layer authorization** (middleware → action → RLS) for every mutation.
- **Least privilege:** anon key for public/user contexts; service-role only in `server-only` admin modules.
- **Validate all input** with Zod (`.strict()`); never trust client-sent role, IDs of *other* users, or status fields.
- **Secrets** only in server env; never `NEXT_PUBLIC_*` for sensitive keys; `.env` git-ignored, `.env.example` documents shape.
- **CSRF:** Server Actions are origin-checked by Next.js; webhook/cron handlers verify a shared secret/signature.
- **No open redirects:** sanitize `next` to same-origin.
- **Vote integrity & secrecy:** write-only `votes` table, UNIQUE per election, tallies via gated SECURITY DEFINER RPC only.
- **Audit trail:** sensitive actions logged to `audit_logs` (admin-read only).
- **Rate limiting** on auth, suggestions, contact form, and uploads (Vercel middleware / Upstash) to deter abuse — child-safety relevant.
- **PII minimization:** students are minors — collect only what's needed (no unnecessary personal data), guardian contact restricted to staff, anonymous suggestions truly drop `author_id`.
- **Content moderation:** all student-submitted content (articles, suggestions shown publicly) passes teacher/admin approval before going public.
- **Dependency hygiene:** Dependabot/`npm audit` in CI; pin and review.
- **HTTPS only**, secure headers (CSP, HSTS, X-Frame-Options) via `next.config` headers.

## 6. Design System Standards (Triveni Civic-Optimist)

### Tokens (CSS variables in `globals.css`, Tailwind v4)
```
--color-navy:    #0F172A;   /* primary text, headers, dark surfaces */
--color-emerald: #10B981;   /* primary action / accent */
--color-gold:    #F59E0B;   /* highlight / secondary accent */
```
### Typography
- Headings: **Bricolage Grotesque**
- Body: **Plus Jakarta Sans**
- Nepali (all scripts): **Noto Sans Devanagari**
- Loaded via `next/font`, exposed as CSS variables; Devanagari auto-applies to Nepali text blocks.

### Rules
- **Never white text on emerald or gold** — use navy (`--color-navy`) for text on emerald/gold surfaces (contrast + brand rule). White text only on navy/dark surfaces.
- **Mobile-first**: design at 360px up; tap targets ≥ 44px.
- **WCAG 2.1 AA**: contrast ≥ 4.5:1 body / 3:1 large; visible focus rings; keyboard navigable.
- **Calm motion**: subtle, ≤ 250ms transitions; honor `prefers-reduced-motion`.
- **Bilingual layout**: components must not break with longer Nepali strings; avoid fixed-width text containers.
- shadcn/ui components are themed once to these tokens; do not hardcode hex values in feature components — use tokens/Tailwind classes.

## 7. Git & workflow

- Conventional Commits (`feat:`, `fix:`, `chore:`...).
- Trunk-based with short-lived feature branches; PR + CI (lint, typecheck, build) before merge.
- Migrations are forward-only and reviewed; never edit a merged migration.
- Preview deploys per PR (Vercel) for review.
