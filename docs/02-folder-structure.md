# 02 — Project Folder Structure

A **feature-oriented** structure layered on top of Next.js App Router conventions. Routing lives in `app/`; reusable logic lives in `features/` and `lib/`. This keeps the router thin (pages compose features) and makes each domain easy to find and own.

```
triveni-child-club/
├─ app/                              # Next.js App Router — routing & composition only
│  ├─ (public)/                      # Route group: public website (no auth)
│  │  ├─ layout.tsx                  # Public shell (header, footer, nav)
│  │  ├─ page.tsx                    # Home
│  │  ├─ about/page.tsx
│  │  ├─ committee/page.tsx
│  │  ├─ activities/
│  │  │  ├─ page.tsx                 # List
│  │  │  └─ [slug]/page.tsx          # Detail
│  │  ├─ events/
│  │  │  ├─ page.tsx
│  │  │  └─ [slug]/page.tsx
│  │  ├─ gallery/page.tsx
│  │  ├─ achievements/page.tsx
│  │  ├─ magazine/
│  │  │  ├─ page.tsx                 # Issue list
│  │  │  └─ [issue]/[article]/page.tsx
│  │  └─ contact/page.tsx
│  │
│  ├─ (auth)/                        # Route group: auth screens (centered, minimal shell)
│  │  ├─ login/page.tsx
│  │  ├─ verify/page.tsx
│  │  └─ callback/route.ts           # OAuth/magic-link exchange → session
│  │
│  ├─ (portal)/                      # Route group: STUDENT portal (auth required)
│  │  ├─ layout.tsx                  # Portal shell + role guard (student)
│  │  └─ portal/
│  │     ├─ page.tsx                 # Dashboard
│  │     ├─ profile/page.tsx
│  │     ├─ activities/page.tsx      # My activities + browse to join
│  │     ├─ voting/
│  │     │  ├─ page.tsx              # Open elections
│  │     │  └─ [electionId]/page.tsx # Ballot
│  │     ├─ suggestions/page.tsx     # Submit + view own
│  │     └─ magazine/page.tsx        # Submit articles + track status
│  │
│  ├─ (admin)/                       # Route group: TEACHER + ADMIN console
│  │  ├─ layout.tsx                  # Admin shell + role guard (teacher|admin)
│  │  └─ admin/
│  │     ├─ page.tsx                 # Admin home / overview
│  │     ├─ members/                 # admin only
│  │     ├─ activities/
│  │     ├─ events/
│  │     ├─ elections/               # admin only
│  │     ├─ magazine/
│  │     ├─ announcements/
│  │     ├─ suggestions/             # moderation queue
│  │     └─ media/
│  │
│  ├─ api/                           # Route Handlers (webhooks, cron, file ops)
│  │  ├─ health/route.ts
│  │  ├─ revalidate/route.ts
│  │  └─ webhooks/.../route.ts
│  │
│  ├─ layout.tsx                     # Root layout: fonts, html lang, providers
│  ├─ globals.css                    # Tailwind v4 + design tokens
│  ├─ not-found.tsx
│  └─ error.tsx
│
├─ features/                         # Domain modules — the heart of the app
│  ├─ activities/
│  │  ├─ actions.ts                  # Server Actions (create/join/update)
│  │  ├─ queries.ts                  # Server-side reads (RSC data fns)
│  │  ├─ schema.ts                   # Zod schemas (shared client+server)
│  │  ├─ types.ts                    # Domain types
│  │  └─ components/                 # Feature UI (cards, forms, lists)
│  ├─ elections/                     # voting logic, ballots, results
│  ├─ events/
│  ├─ achievements/
│  ├─ gallery/
│  ├─ magazine/
│  ├─ suggestions/                   # student voice
│  ├─ announcements/
│  ├─ committee/
│  ├─ members/                       # user + student-profile management
│  ├─ notifications/
│  └─ dashboard/
│
├─ components/
│  ├─ ui/                            # shadcn/ui primitives (themed)
│  ├─ layout/                        # Header, Footer, Sidebar, MobileNav
│  ├─ shared/                        # EmptyState, PageHeader, DataTable, etc.
│  └─ providers/                     # Theme, Locale, Toast providers
│
├─ lib/
│  ├─ supabase/
│  │  ├─ client.ts                   # browser client
│  │  ├─ server.ts                   # server client (cookies)
│  │  ├─ admin.ts                    # service-role client (server-only)
│  │  └─ middleware.ts               # session refresh helper
│  ├─ auth/
│  │  ├─ get-session.ts              # cached current user + role
│  │  ├─ require-role.ts             # guard helpers
│  │  └─ permissions.ts              # can(role, action) policy map
│  ├─ i18n/
│  │  ├─ en.ts
│  │  ├─ ne.ts
│  │  └─ index.ts                    # t() + locale resolution
│  ├─ validation/                    # shared Zod primitives
│  ├─ errors.ts                      # AppError, result types
│  ├─ utils.ts                       # cn(), formatters, slugify
│  └─ constants.ts                   # roles, statuses, bucket names
│
├─ types/
│  ├─ database.ts                    # Supabase-generated DB types
│  └─ index.ts                       # app-wide shared types
│
├─ supabase/
│  ├─ migrations/                    # SQL migrations (source of truth for schema)
│  ├─ seed.sql                       # dev seed data
│  └─ config.toml
│
├─ public/                          # static assets (logo, icons, fonts if self-hosted)
├─ middleware.ts                    # Edge middleware (session + route protection)
├─ tailwind / postcss / tsconfig / next.config.ts / .env.example
└─ docs/                            # this architecture set
```

## Layering rules

1. **`app/` is thin.** Pages/layouts import from `features/*` and `components/*`. No business logic in route files beyond composition + guards.
2. **`features/` owns the domain.** Each feature is self-contained: `actions.ts` (writes), `queries.ts` (reads), `schema.ts` (Zod), `components/` (UI). Features may import `lib/` and `components/ui`, but **not** other features' internals — cross-feature needs go through a feature's public `index.ts`.
3. **`lib/` is generic plumbing.** No domain knowledge of "elections" or "magazine" — only infrastructure (supabase, auth, i18n, errors).
4. **`components/ui` is design-system only.** Pure, presentational, no data fetching.
5. **Server-only modules** (`lib/supabase/admin.ts`, anything using the service role) start with `import 'server-only'` to fail the build if imported into a client bundle.

## Import direction (allowed →)

```
app  →  features  →  lib
app  →  components →  lib
features → components/ui, lib
lib  →  (nothing app/feature-specific)
```
