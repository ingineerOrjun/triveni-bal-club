# 08 — Deployment & Scalability

## 1. Deployment Strategy

### Environments
| Env | Branch | Supabase project | Purpose |
|-----|--------|------------------|---------|
| Production | `main` | `triveni-prod` | live site |
| Preview | every PR | `triveni-staging` (shared) | review |
| Local | — | local Supabase (`supabase start`) | dev |

### Hosting — Vercel
- Connect the Git repo; `main` → production, PRs → preview deploys with unique URLs.
- Next.js 15 builds with Edge Middleware (session/guard) and Node serverless functions (actions/handlers).
- Image Optimization + ISR caching on the public site.
- Vercel Cron triggers `/api/cron/election-state` (open/close elections on schedule).

### Supabase
- Schema managed by migrations in `supabase/migrations/`; applied via `supabase db push` in CI on merge to `main`.
- `supabase gen types typescript` runs in CI to keep `types/database.ts` in sync; build fails if drifted.
- Storage buckets + policies created via migration/seed so environments are reproducible.
- Auth settings (redirect URLs, email templates, access-token hook) documented in `supabase/config.toml`.

### Environment variables
```
NEXT_PUBLIC_SUPABASE_URL          (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY     (public)
SUPABASE_SERVICE_ROLE_KEY         (server-only)
SUPABASE_JWT_SECRET               (server-only, hook verification if needed)
REVALIDATE_SECRET / CRON_SECRET   (server-only)
RESEND_API_KEY                    (server-only, optional)
```
Set per-environment in Vercel project settings; never committed.

### CI/CD pipeline (GitHub Actions or Vercel)
```
push/PR → install → lint → typecheck → gen types (verify no drift) → build
merge to main → apply migrations (supabase db push) → deploy (Vercel) → smoke test (/api/health)
```

### Rollback
- Vercel: instant redeploy of previous build.
- DB: forward-only migrations; risky changes ship behind expand/contract pattern (add new, backfill, switch, remove later) so rollback never requires destructive down-migrations.

### Pre-launch checklist (Phase 8)
- Lighthouse a11y/perf ≥ 90, axe scan clean.
- RLS policy test suite (each role × each table) green.
- Vote integrity test (no double vote, secrecy holds).
- Backup/restore rehearsal; secrets rotated; security headers verified.

---

## 2. Scalability Considerations

This is a **single school** — realistic scale is hundreds to a few thousand users, with spikes around elections and event days. The architecture is sized for that, not hyperscale, but stays efficient:

### Read scaling
- Public pages are **static/ISR** and CDN-cached at the edge → near-zero DB load for anonymous traffic (the bulk of visitors).
- Tag-based revalidation busts only affected content on publish.
- Indexed queries on hot paths (status/date/election columns — doc 04 §4).

### Write scaling
- Writes are infrequent and bounded (submissions, votes, registrations).
- **Election spike** is the one burst: votes are single-row inserts guarded by a UNIQUE index — cheap and contention-free. If needed, results computed via an aggregate RPC, not row scans, and cached after publish.
- Realtime limited to notifications + post-publish results (no high-frequency fan-out).

### Cost / efficiency
- Supabase free/pro tier comfortably covers single-school load.
- Direct-to-Storage uploads keep bandwidth off serverless functions.
- Connection pooling via Supabase (PgBouncer) for serverless function bursts.

### Maintainability (the real long-term constraint)
- Maintained by rotating teachers/volunteers → emphasis on: clear feature folders, declarative permission map, documented schema, typed end-to-end, minimal moving parts (no separate API service, no extra infra).
- Admin UI for all content so non-developers manage day-to-day without code changes.

### Growth headroom (if ever needed)
- Full-text search → Postgres FTS, then Supabase/`pg_trgm` (no new service).
- More content types → new feature folder + migration, same patterns.
- Heavier media → Supabase image transforms / CDN already in place.
- Multi-school (explicitly out of scope) would require revisiting the data model with a tenant key — deliberately **not** built in now to keep the system simple.

### Backups & data safety
- Supabase automated daily backups (PITR on Pro).
- `audit_logs` retained for accountability.
- Student data export/delete tooling for guardianship/privacy requests.
```
