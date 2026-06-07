# Development Bootstrap & Initial Admin Setup

Get a working local environment — with an admin account, demo users, and sample
data — in a few minutes.

```bash
npm install
supabase db push        # apply all migrations
npm run bootstrap       # create admin + demo users + sample data
npm run dev             # http://localhost:3000
```

---

## 1. First-time setup

### Prerequisites
- Node 18+ and npm
- A Supabase project (cloud or local via the [Supabase CLI](https://supabase.com/docs/guides/cli))

### Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment** — copy the template and fill in your Supabase keys
   (Project → Settings → API):
   ```bash
   cp .env.example .env.local
   ```
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...          # server-only; bootstrap needs this
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Apply the database schema**
   ```bash
   supabase db push
   ```
   This runs every migration in `supabase/migrations/` (tables, RLS, triggers,
   the recognition engine, seed categories). See
   [`supabase/README.md`](../supabase/README.md).

4. **Enable the JWT role hook** (one-time, dashboard) — Authentication → Hooks →
   *Customize Access Token (JWT) Claims* → select
   `public.custom_access_token_hook`.

5. **Bootstrap**
   ```bash
   npm run bootstrap
   ```

6. **Run the app**
   ```bash
   npm run dev
   ```
   Sign in at <http://localhost:3000/auth/login> with the printed credentials.

---

## 2. What `npm run bootstrap` does

The script (`scripts/bootstrap.ts`) is **idempotent** — safe to run any number of
times. On each run it:

1. Refuses to run if `NODE_ENV=production`.
2. Verifies the Supabase connection (and that migrations have been applied).
3. Creates the **first admin** — only if no admin exists yet.
4. Creates the **demo accounts** (moderator + 3 members) — only if missing.
5. Seeds **categories** (suggestion / activity / achievement) if missing.
6. Seeds **sample activities, events, a public achievement, and a success-story
   suggestion**.
7. Adds the demo members to a sample activity + event (with attendance) and runs
   the **recognition engine**, so they earn badges automatically.
8. Prints a **credentials table** to the console.

Anything that already exists is skipped, never overwritten.

---

## 3. Admin creation

The first admin is created from these variables (defaults shown):

| Variable | Default |
|----------|---------|
| `BOOTSTRAP_ADMIN_EMAIL` | `admin@triveni.local` |
| `BOOTSTRAP_ADMIN_PASSWORD` | `Admin#12345` |
| `BOOTSTRAP_ADMIN_NAME` | `Club Admin` |

- If **any** admin already exists, the script leaves it untouched and reports it.
- To create a *different* first admin, change the env vars **before** the first
  bootstrap run (or promote a user manually — see Troubleshooting).

---

## 4. Demo accounts

Created for local development (shared password `BOOTSTRAP_DEMO_PASSWORD`,
default `Demo#12345`):

| Role | Email |
|------|-------|
| Moderator | `moderator@triveni.local` |
| Member | `member1@triveni.local` |
| Member | `member2@triveni.local` |
| Member | `member3@triveni.local` |

Use these to exercise the full role matrix:
- **Admin** → everything (`/admin/*`).
- **Moderator** → review/feedback/status, recommend recognition (no certificates,
  no category management).
- **Member** → portal, participation, suggestions, badges.

---

## 5. Production safety

The bootstrap script is **development-only** and enforces:

- ❌ **Refuses to run when `NODE_ENV=production`.**
- ❌ **Never overwrites an existing admin.**
- ❌ **Never resets passwords** — existing accounts are left exactly as they are.
- ✅ Idempotent: re-running only fills in what's missing.

For real deployments, create the admin through the Supabase dashboard (or your
own provisioning flow) and use strong, unique credentials.

---

## 6. Troubleshooting

**“Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY”**
Add them to `.env.local`. The service-role key is required (the script performs
admin user creation).

**“Could not query the database … Did you run `supabase db push`?”**
Apply migrations first: `supabase db push`.

**“Refusing to run: NODE_ENV=production”**
Expected. Unset `NODE_ENV` (or set it to `development`) for local bootstrap.

**Login works but `/admin` redirects to the portal**
The JWT role hook may not be enabled, or the role didn't apply. Verify role:
```sql
select email, role from public.users order by created_at;
```
Promote a user manually if needed:
```sql
update public.users set role = 'admin' where email = 'you@example.com';
```
Then sign out and back in so a fresh JWT is issued.

**I want to re-seed from scratch (local only)**
Reset the database and re-run:
```bash
supabase db reset      # drops & re-applies all migrations (DESTRUCTIVE)
npm run bootstrap
```

**Emails / confirmation**
Bootstrap creates users with `email_confirm: true`, so demo accounts can sign in
immediately without an email round-trip.
