# Triveni Child Club Portal — Foundation Architecture

> **Triveni Child Club** · Triveni Barah Nanda Prasad Tripathee School
> Single-school Child Club website & portal — **not** SaaS, **not** multi-tenant.
> Phase 1 deliverable: complete foundation architecture (no implementation code).

---

## 0. Document Map

| #  | Document | Covers |
|----|----------|--------|
| 01 | `01-architecture-overview.md` (this file) | System overview, diagram, principles, tech stack |
| 02 | `02-folder-structure.md` | Project folder structure & module layout |
| 03 | `03-feature-modules.md` | Feature breakdown for all 9 areas |
| 04 | `04-database.md` | ERD, all table schemas, relationships, RLS |
| 05 | `05-auth-and-rbac.md` | Authentication flow, authorization flow, roles |
| 06 | `06-routes-and-api.md` | Route map, API design, Server Actions strategy |
| 07 | `07-standards.md` | Coding standards, naming, errors, security, media |
| 08 | `08-deployment-and-scale.md` | Deployment strategy, scalability |

---

## 1. System Overview

The portal is a **single Next.js 15 application** (App Router) that serves three logical surfaces from one codebase, separated by route groups and protected by role-based access:

1. **Public Website** — marketing/informational, server-rendered, cached, no auth.
2. **Student Portal** — authenticated student experience (dashboard, voting, submissions).
3. **Administration Dashboard** — teacher/admin management console.

A single **Supabase** project provides PostgreSQL, Auth, Storage, and Realtime. All sensitive logic runs on the server (Server Components, Server Actions, Route Handlers) and is enforced again at the database layer via **Row Level Security (RLS)** — defense in depth.

### Architectural principles

- **Server-first.** Default to React Server Components. Client Components only for interactivity (forms, voting widgets, menus).
- **Defense in depth.** Every privileged operation is checked in (a) middleware, (b) the server action / route handler, and (c) Postgres RLS. Never trust the client.
- **Single source of truth for roles.** Role lives in the database (`users.role`) and is mirrored into the JWT via a custom access-token hook.
- **Bilingual by design.** Every user-facing string and key content field supports English + Nepali (Devanagari) from day one.
- **Calm, accessible UI.** Mobile-first, WCAG 2.1 AA, reduced-motion aware, the Triveni Civic-Optimist design system.
- **Boring, maintainable tech.** A school club is maintained by rotating volunteers/teachers — favor clarity over cleverness.

---

## 2. Technology Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Next.js 15** (App Router) | RSC, Server Actions, streaming, route groups |
| Language | **TypeScript** (strict) | `strict: true`, no implicit any |
| Styling | **Tailwind CSS v4** | CSS-first config, design tokens as CSS variables |
| Components | **shadcn/ui** | Owned components in `components/ui`, themed to Triveni |
| Backend | **Supabase** | Auth + Postgres + Storage + Realtime + Edge |
| Database | **PostgreSQL** (Supabase) | RLS-enforced, migrations in `supabase/migrations` |
| Auth | **Supabase Auth** | Email/password + magic link; JWT with role claim |
| Storage | **Supabase Storage** | Buckets for avatars, gallery, magazine, docs |
| Hosting | **Vercel** | Edge middleware, ISR, image optimization |
| Forms/validation | **Zod** + React Hook Form | One schema shared by client + server |
| Data fetching | RSC + Server Actions | No client data layer needed for most reads |
| Email | Supabase Auth emails + Resend (transactional) | Optional Phase 2+ |
| Analytics | Vercel Analytics + Speed Insights | Privacy-friendly |

### Supabase client surfaces

- **Browser client** — anon key, used in Client Components, always RLS-bound.
- **Server client** — reads cookies, used in Server Components / Actions / Route Handlers, RLS-bound as the logged-in user.
- **Admin (service-role) client** — bypasses RLS, used **only** in trusted server code for admin operations and the access-token hook. Never imported into client bundles.

---

## 3. Architecture Diagram

```
                          ┌─────────────────────────────────────────────┐
                          │                  VISITORS                     │
                          │  Public · Students · Teachers · Admins        │
                          └───────────────────────┬─────────────────────┘
                                                  │ HTTPS
                                                  ▼
                    ┌──────────────────────────────────────────────────────┐
                    │                      VERCEL EDGE                        │
                    │  • CDN / static assets / ISR cache                      │
                    │  • Next.js Middleware (session refresh + route guard)  │
                    └───────────────────────┬───────────────────────────────┘
                                            │
                                            ▼
       ┌──────────────────────────────────────────────────────────────────────┐
       │                     NEXT.JS 15 APP (App Router)                         │
       │                                                                          │
       │  Route Groups                                                            │
       │  ┌────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
       │  │ (public)       │  │ (portal)         │  │ (admin)                │  │
       │  │ Home, About,   │  │ Dashboard,       │  │ Members, Elections,    │  │
       │  │ Activities,    │  │ Profile, Voting, │  │ Magazine, Media,       │  │
       │  │ Gallery, ...   │  │ Suggestions, ... │  │ Announcements, ...     │  │
       │  └────────────────┘  └──────────────────┘  └────────────────────────┘  │
       │                                                                          │
       │  Server Components (read)   Server Actions (write)   Route Handlers (API)│
       │            │                       │                        │            │
       └────────────┼───────────────────────┼────────────────────────┼──────────┘
                    │                       │                        │
                    ▼                       ▼                        ▼
       ┌──────────────────────────────────────────────────────────────────────┐
       │                            SUPABASE                                     │
       │  ┌───────────┐  ┌──────────────┐  ┌──────────┐  ┌─────────────────┐    │
       │  │ Auth (JWT │  │ PostgreSQL    │  │ Storage  │  │ Realtime         │    │
       │  │ + role    │  │ + RLS         │  │ (buckets)│  │ (votes/notifs)   │    │
       │  │ claim)    │  │ + triggers    │  │          │  │                  │    │
       │  └───────────┘  └──────────────┘  └──────────┘  └─────────────────┘    │
       │         Access-token hook injects `role` into JWT on every login        │
       └──────────────────────────────────────────────────────────────────────┘
```

### Request lifecycle (authenticated write — e.g. casting a vote)

```
Student clicks "Vote"
   → Client Component calls Server Action `castVote(electionId, candidateId)`
   → Action: getUser() (server client)  ──► not logged in? redirect
   → Action: assert role === 'student'  ──► else throw Forbidden
   → Action: Zod-validate input
   → Action: insert into `votes`
        → Postgres RLS re-checks: voter = auth.uid(), election is OPEN, no prior vote
        → UNIQUE(election_id, voter_id) prevents double voting
   → trigger writes `audit_logs` row
   → revalidatePath('/portal/voting')
   → return typed result → UI updates
```

Three independent gates (action role check, RLS policy, DB constraint) must all pass. A bug in one layer cannot by itself allow fraud.

---

## 4. Bilingual Strategy (summary)

- **UI chrome** (nav, buttons, labels): translation dictionaries `lib/i18n/{en,ne}.ts`, locale stored in cookie, `[lang]`-free approach using a lightweight `t()` helper (no heavy i18n lib needed for a club site).
- **Content** (activities, articles, announcements): bilingual columns — `title_en` / `title_ne`, `body_en` / `body_ne`. The renderer falls back to the other language if one is empty.
- **Fonts**: Bricolage Grotesque (headings, Latin), Plus Jakarta Sans (body, Latin), Noto Sans Devanagari (all Nepali). Font stack auto-applies Devanagari glyphs.

---

## 5. Phase Roadmap (context, not scope for Phase 1)

| Phase | Focus |
|-------|-------|
| **1 (now)** | Foundation architecture (this document set) |
| 2 | Public website + design system implementation |
| 3 | Auth + student portal (profile, dashboard) |
| 4 | Activities, events, achievements, gallery |
| 5 | Elections & voting |
| 6 | Magazine + student voice (suggestions) |
| 7 | Admin dashboard + announcements + notifications |
| 8 | Hardening, a11y audit, performance, launch |
