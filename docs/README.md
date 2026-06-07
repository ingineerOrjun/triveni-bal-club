# Triveni Child Club Portal — Architecture (Phase 1)

Foundation architecture for the **Triveni Child Club** portal (Triveni Barah Nanda Prasad Tripathee School).
Single-school website + portal. **Not** SaaS, **not** multi-tenant.

**Stack:** Next.js 15 (App Router, TS) · Tailwind v4 + shadcn/ui · Supabase (Postgres + Auth + Storage + Realtime) · Vercel.

## Read in order

1. [Architecture Overview](01-architecture-overview.md) — system diagram, principles, stack
2. [Folder Structure](02-folder-structure.md) — project layout & layering rules
3. [Feature Modules](03-feature-modules.md) — all 22 modules across public / portal / admin
4. [Database](04-database.md) — ERD, 18 table schemas, relationships, RLS
5. [Auth & RBAC](05-auth-and-rbac.md) — auth flow, authorization flow, role matrix
6. [Routes & API](06-routes-and-api.md) — route map, Server Actions strategy, API design
7. [Standards](07-standards.md) — coding/naming/error/security/media/design standards
8. [Deployment & Scale](08-deployment-and-scale.md) — deploy strategy, scalability

> Phase 1 is **design only** — no implementation code. Implementation begins Phase 2 (see roadmap in doc 01 §5).
