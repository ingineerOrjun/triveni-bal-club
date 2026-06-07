# 06 — Routes, API & Server Actions

## 1. Route Map

### Public `(public)` — no auth, ISR-cached
```
/                         Home
/about                    About the club & school
/committee                Current + past committee
/activities               Activities list (filter)
/activities/[slug]        Activity detail
/events                   Events list + calendar
/events/[slug]            Event detail (+ register CTA)
/gallery                  Photo gallery / albums
/achievements             Achievements timeline
/magazine                 Magazine issues list
/magazine/[issue]         Issue contents
/magazine/[issue]/[slug]  Article reader
/contact                  Contact info + form
```

### Auth `(auth)`
```
/login                    Sign in (email/password, magic link)
/verify                   Magic-link / email verification notice
/auth/callback            (route handler) code → session, role redirect
/logout                   (route handler) sign out
```

### Student Portal `(portal)` — role: student
```
/portal                   Dashboard
/portal/profile           View/edit profile + avatar
/portal/activities        My activities + browse/join
/portal/voting            Open elections
/portal/voting/[id]       Ballot + cast vote + receipt/results
/portal/suggestions       Submit + my suggestions
/portal/magazine          Submit article + track status
/portal/notifications     Notification center
```

### Administration `(admin)` — role: teacher | admin (some admin-only)
```
/admin                    Overview (stats, queues)
/admin/members            Members & roles                 [admin]
/admin/members/[id]       Member detail / profile         [admin]
/admin/committee          Committee management            [admin]
/admin/activities         Activities CRUD
/admin/activities/[id]    Edit + participants
/admin/events             Events CRUD
/admin/events/[id]        Edit + registrations + attendance
/admin/achievements       Achievements CRUD
/admin/elections          Elections list                  [admin]
/admin/elections/[id]     Candidates, open/close, results [admin]
/admin/magazine           Issues + submissions queue
/admin/magazine/[id]      Issue editor / assign articles
/admin/suggestions        Moderation queue
/admin/announcements      Announcements CRUD              [admin]
/admin/media              Gallery/media manager
/admin/audit              Audit log viewer                [admin]
```

---

## 2. API / Server-side data strategy

This app is **Server-Action-first**, not REST-first. Reasons: tight Next.js integration, type safety end-to-end, no need to hand-build/secure many endpoints, automatic CSRF protection, and RLS as the security floor.

### When to use what

| Need | Use |
|------|-----|
| Read data for a page | **Server Component** calling `features/*/queries.ts` |
| Mutate data from a form/button | **Server Action** in `features/*/actions.ts` |
| External webhook (e.g. email provider) | **Route Handler** `app/api/webhooks/...` |
| Cron / scheduled (e.g. open elections) | **Route Handler** hit by Vercel Cron |
| Health check / revalidation hook | **Route Handler** |
| Realtime (votes count, notifications) | Supabase **Realtime** channel (client) |

### Route Handlers (the only true HTTP "API")
```
GET  /api/health               liveness
POST /api/revalidate           on-publish cache bust (secret-guarded)
POST /api/webhooks/email       transactional email status (signed)
POST /api/cron/election-state  cron: open/close elections by schedule (secret-guarded)
GET  /api/og/[type]            dynamic Open Graph images (optional)
```
All handlers validate a shared secret / signature and re-check auth where relevant.

---

## 3. Server Actions Strategy

### Structure
Every feature exposes actions in `features/<feature>/actions.ts`, each file starts with `'use server'`. Actions are the **only** write path from the UI.

### Standard action shape
```
1. 'use server'
2. const { user, role } = await requireUser()        // auth gate
3. requirePermission('election:manage')              // role/permission gate
4. const input = Schema.parse(rawInput)              // Zod validation
5. perform DB op via server supabase client          // RLS re-enforces
6. write audit_logs if sensitive (or via trigger)
7. revalidatePath(...) / revalidateTag(...)          // refresh caches
8. return { ok: true, data } | { ok: false, error }  // typed Result
```

### Conventions
- **Always return a typed `Result`** (`ActionResult<T>`) — never throw to the client for expected failures (validation, forbidden); throw only for truly unexpected errors (caught by `error.tsx`).
- **Validate twice:** client-side (React Hook Form + Zod for UX) and server-side (same Zod schema, authoritative).
- **Idempotency / safety:** voting and registration rely on DB UNIQUE constraints, so retries can't double-insert.
- **Revalidation:** mutations call `revalidatePath`/`revalidateTag` so public ISR pages reflect changes immediately after publish.
- **No service-role in actions** unless the operation is inherently admin (user creation, results RPC); otherwise use the user-scoped server client so RLS applies.
- **Progressive enhancement:** forms wired with `action={serverAction}` work without JS where feasible.

### Caching model
- Public reads: `force-cache` + `revalidate` tags per content type (`revalidateTag('activities')` on publish).
- Authenticated reads (portal/admin): dynamic (`no-store`) — always fresh, per-user.

---

## 4. Validation & shared schemas

- One Zod schema per entity in `features/*/schema.ts`, reused by the client form and the server action.
- Generated DB types (`types/database.ts`) via `supabase gen types typescript` keep queries type-safe.
- Input schemas are **strict** (`.strict()`) to reject unknown fields.

---

## 5. Realtime usage (minimal, targeted)

| Channel | Purpose |
|---------|---------|
| `notifications:user_id` | live unread badge / toast |
| `election:results:id` | live tally **after** results published (admin + students) |

Realtime subscriptions are read-only and still bound by RLS (no `votes` row exposure).
