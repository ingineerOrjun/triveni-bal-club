# 05 — Authentication & Role-Based Access

## 1. Identity model

- **Supabase Auth** owns credentials (`auth.users`). The app never stores passwords.
- A 1:1 **`public.users`** row mirrors each auth user and holds the authoritative **`role`** (`public | student | teacher | admin`) and display fields.
- On signup, a trigger (`handle_new_user`) creates the `users` row (default role `student`) and a `student_profiles` row when applicable.
- An **access-token hook** copies `users.role` into the JWT as a `user_role` claim on every token issuance, so the role is available cheaply everywhere (middleware, RSC, RLS) without a DB round-trip.

### Auth methods
- **Email + password** (primary, for students issued accounts by admins).
- **Magic link** (passwordless fallback).
- Account creation is **admin-driven** (students don't self-register) → admins invite via the Members module using the service-role client. Public visitors need no account.

---

## 2. Authentication Flow

```
                ┌──────────────────────────────────────────────┐
                │ Admin invites student (Members module)         │
                │  → service-role: auth.admin.createUser/invite  │
                │  → trigger creates users + student_profiles    │
                └───────────────────┬──────────────────────────┘
                                    │ invite email
                                    ▼
   ┌──────────┐  credentials  ┌──────────────┐  validates  ┌──────────────┐
   │  /login  │ ─────────────►│ Supabase Auth │ ───────────►│  auth.users  │
   └──────────┘               └──────┬───────┘             └──────────────┘
                                     │ issues JWT
                                     │ + access_token_hook injects user_role
                                     ▼
                          ┌─────────────────────┐
                          │ Set HttpOnly cookies │  (sb-access / sb-refresh)
                          └──────────┬──────────┘
                                     ▼
                          ┌─────────────────────┐
                          │ /auth/callback route │  exchanges code → session
                          └──────────┬──────────┘
                                     ▼
                      redirect by role: student → /portal
                                       teacher/admin → /admin
```

### Session handling
- Cookies are **HttpOnly, Secure, SameSite=Lax** — set/refreshed by Supabase SSR helpers.
- **Middleware** (`middleware.ts`) runs on every matched request to refresh the session (rotate tokens) and to gate protected route groups before they render.
- Server code reads the session via `lib/auth/get-session.ts` (React `cache()`-wrapped → one fetch per request).

---

## 3. Authorization Flow (defense in depth)

Three enforcement layers; **all** must pass for a privileged action.

```
            Request
               │
        ┌──────▼─────────────────────────────────────────────┐
   (1)  │ MIDDLEWARE (edge)                                    │
        │  • refresh session                                   │
        │  • /portal/* requires role = student                 │
        │  • /admin/*  requires role in {teacher, admin}       │
        │  • unauthenticated → /login?next=...                 │
        └──────┬─────────────────────────────────────────────┘
               │ passes
        ┌──────▼─────────────────────────────────────────────┐
   (2)  │ SERVER ACTION / ROUTE HANDLER / RSC                  │
        │  • requireRole('admin') guard at top of action       │
        │  • Zod-validate inputs                                │
        │  • permissions.ts: can(role, 'election:create')      │
        └──────┬─────────────────────────────────────────────┘
               │ passes
        ┌──────▼─────────────────────────────────────────────┐
   (3)  │ POSTGRES RLS (per row)                               │
        │  • policy re-checks role + ownership + state          │
        │  • DB constraints (UNIQUE, CHECK, FK)                 │
        └─────────────────────────────────────────────────────┘
```

Layer (1) is UX (fast redirects). Layer (2) is application policy. Layer (3) is the **real** security boundary — even if (1) and (2) were bypassed, RLS protects the data.

---

## 4. Role-Based Access Architecture

### Role capabilities (authoritative summary)

| Capability | public | student | teacher | admin |
|------------|:--:|:--:|:--:|:--:|
| View public website/content | ✓ | ✓ | ✓ | ✓ |
| Login / portal | – | ✓ | ✓ | ✓ |
| Edit own profile | – | ✓ | ✓ | ✓ |
| Join activities / register events | – | ✓ | – | – |
| Vote in elections | – | ✓ | – | – |
| Submit magazine articles | – | ✓ | – | – |
| Submit suggestions | – | ✓ | – | – |
| Moderate submissions (articles/suggestions) | – | – | ✓ | ✓ |
| Manage activities / events | – | – | ✓ | ✓ |
| Manage gallery/media | – | – | ✓ | ✓ |
| Manage magazine issues | – | – | ✓ | ✓ |
| Manage members & roles | – | – | – | ✓ |
| Manage elections (create/open/close) | – | – | – | ✓ |
| Manage announcements | – | – | – | ✓ |
| Manage committee | – | – | – | ✓ |
| View audit logs | – | – | – | ✓ |

> **Teacher ⊂ Admin** for content/moderation, but teachers cannot touch members, roles, elections, announcements, committee, or audit logs.

### Permission policy map (`lib/auth/permissions.ts`)

A single declarative map is the source of truth for app-layer checks (mirrored by RLS at the DB layer):

```
PERMISSIONS = {
  'activity:manage'      : ['teacher','admin'],
  'event:manage'         : ['teacher','admin'],
  'gallery:manage'       : ['teacher','admin'],
  'article:moderate'     : ['teacher','admin'],
  'suggestion:moderate'  : ['teacher','admin'],
  'magazine:manage'      : ['teacher','admin'],
  'member:manage'        : ['admin'],
  'role:assign'          : ['admin'],
  'election:manage'      : ['admin'],
  'announcement:manage'  : ['admin'],
  'committee:manage'     : ['admin'],
  'audit:read'           : ['admin'],
  'vote:cast'            : ['student'],
  'article:submit'       : ['student'],
  'suggestion:submit'    : ['student'],
  'activity:join'        : ['student'],
}
// can(role, action) => PERMISSIONS[action].includes(role)
```

### Guard helpers

- `getSession()` → `{ user, role } | null` (cached per request).
- `requireUser()` → throws/redirects if not logged in.
- `requireRole(...roles)` → throws `ForbiddenError` if role not allowed; used at the top of every protected action and admin page.
- `requirePermission(action)` → uses the permission map.

### Route → role mapping

| Route prefix | Required |
|--------------|----------|
| `/` `(public)` | none |
| `/login`, `/auth/*` | none (redirect away if already authed) |
| `/portal/*` | `student` |
| `/admin/*` | `teacher` or `admin` |
| `/admin/members`, `/admin/elections`, `/admin/announcements` | `admin` only (page-level guard) |

---

## 5. Security notes specific to auth

- **No client-trusted role.** The `user_role` JWT claim is set server-side by the hook from the DB; clients can't forge it (JWT is signed).
- **Service-role key** is server-only (`lib/supabase/admin.ts` with `import 'server-only'`), never in `NEXT_PUBLIC_*`, used only for admin user management and the results RPC.
- **Re-validate on the server** for every mutation regardless of what the UI showed.
- **`next` redirect param** is sanitized to same-origin paths to prevent open-redirect.
- Account deactivation sets `users.is_active=false`; middleware/guards reject inactive users even with a valid token.
