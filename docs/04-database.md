# 04 — Database Architecture

PostgreSQL on Supabase. Schema is the source of truth in `supabase/migrations/`. Every table has **RLS enabled**. Conventions:

- `id uuid primary key default gen_random_uuid()` (except `users.id` = `auth.users.id`).
- `created_at timestamptz not null default now()`, `updated_at timestamptz` (trigger-maintained).
- Soft-publish via `status` enums rather than hard deletes for content.
- Bilingual content uses paired `*_en` / `*_ne` columns.
- Foreign keys are explicit with sensible `on delete` behavior.
- snake_case table & column names; plural table names.

---

## 1. Entity-Relationship Diagram (ERD)

```
                              ┌───────────────────────┐
                              │  auth.users (Supabase) │
                              └───────────┬───────────┘
                                          │ 1:1
                                          ▼
┌──────────────────┐ 1:1   ┌─────────────────────────┐
│ student_profiles │◄──────│         users            │  role: public/student/teacher/admin
└──────┬───────────┘       └───┬───────┬───────┬──────┘
       │                       │       │       │
       │            ┌──────────┘       │       └─────────────┐
       │            ▼                  ▼                      ▼
       │   ┌──────────────────┐  ┌──────────────┐   ┌────────────────┐
       │   │ committee_members│  │  audit_logs   │   │ notifications  │
       │   └──────────────────┘  └──────────────┘   └────────────────┘
       │
       │   ┌──────────────────────────────────────────────────────────────┐
       │   │                         CONTENT                                 │
       │   │                                                                 │
       │   │  activities ──1:N──► activity_participants ◄──N:1── (student)   │
       │   │      │ 1:N                                                       │
       │   │      └────► gallery_items ◄──N:1── events                       │
       │   │                                                                 │
       │   │  events ──1:N──► event_registrations ◄──N:1── (student)         │
       │   │                                                                 │
       │   │  achievements (─►student / activity / event, optional)          │
       │   │                                                                 │
       │   │  announcements ──(publish fan-out)──► notifications             │
       │   └─────────────────────────────────────────────────────────────-─┘
       │
       │   ┌──────────────────────── ELECTIONS ────────────────────────────┐
       │   │  elections ──1:N──► candidates ◄──1:1?── (student)             │
       │   │      │ 1:N                                                      │
       │   │      └────► votes ◄──N:1── candidates                          │
       │   │              ▲                                                  │
       └───┼──────────────┘  voter_id → student (UNIQUE per election)       │
           └────────────────────────────────────────────────────────────-─┘

           ┌──────────────────────── MAGAZINE ─────────────────────────────┐
           │  magazine_issues ──1:N──► articles ◄──N:1── (author = student) │
           └─────────────────────────────────────────────────────────────-─┘

           ┌──────────────────────── STUDENT VOICE ────────────────────────┐
           │  suggestions ◄──N:1── (author = student, nullable if anon)     │
           └─────────────────────────────────────────────────────────────-─┘

Legend:  1:1 / 1:N / N:1 = cardinality   ◄── = FK direction
```

### Relationship summary

| From | To | Type | Notes |
|------|----|------|-------|
| users | auth.users | 1:1 | `users.id = auth.users.id` |
| users | student_profiles | 1:1 | only when role = student |
| users | committee_members | 1:N | a person can hold committee roles over time |
| activities | activity_participants | 1:N | join table to students |
| students | activity_participants | 1:N | many activities per student |
| events | event_registrations | 1:N | join table to students |
| students | event_registrations | 1:N | |
| elections | candidates | 1:N | |
| elections | votes | 1:N | |
| candidates | votes | 1:N | tally per candidate |
| students | votes | 1:N | but UNIQUE(election_id, voter_id) → 1 vote/election |
| magazine_issues | articles | 1:N | article optionally assigned to an issue |
| students | articles | 1:N | author |
| students | suggestions | 1:N | nullable author for anonymous |
| achievements | students/activities/events | N:1 | optional links |
| users | notifications | 1:N | recipient |
| users | audit_logs | 1:N | actor |

---

## 2. Enumerated types

```sql
create type user_role          as enum ('public','student','teacher','admin');
create type content_status      as enum ('draft','published','archived');
create type submission_status   as enum ('submitted','under_review','approved','rejected','published');
create type election_status     as enum ('draft','scheduled','open','closed','results_published');
create type suggestion_status   as enum ('new','reviewing','addressed','archived');
create type suggestion_category as enum ('facility','academics','events','wellbeing','other');
create type registration_status as enum ('registered','waitlisted','attended','cancelled');
create type announcement_audience as enum ('public','students','staff','all');
create type achievement_type    as enum ('student','club','competition','academic','sports','arts');
create type notification_type   as enum ('announcement','election','submission','event','system');
```

---

## 3. Table schemas

> Schema design (DDL) below is the database *blueprint* — the foundation deliverable — not feature implementation code.

### 3.1 users
Mirror of `auth.users` carrying app role + display info.
```sql
create table users (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         user_role    not null default 'student',
  full_name    text         not null,
  full_name_ne text,
  email        text         not null unique,
  avatar_url   text,
  phone        text,
  is_active    boolean      not null default true,
  created_at   timestamptz  not null default now(),
  updated_at   timestamptz
);
```

### 3.2 student_profiles
```sql
create table student_profiles (
  user_id      uuid primary key references users(id) on delete cascade,
  student_code text unique,                 -- school roll/admission no.
  class_level  text,                        -- e.g. "Grade 8"
  section      text,
  date_of_birth date,
  guardian_name text,
  guardian_phone text,
  bio          text,
  bio_ne       text,
  interests    text[],
  joined_on    date         not null default current_date,
  created_at   timestamptz  not null default now(),
  updated_at   timestamptz
);
```

### 3.3 committee_members
```sql
create table committee_members (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id) on delete set null,
  position     text not null,               -- President, Secretary...
  position_ne  text,
  term_label   text,                        -- "2025–2026"
  display_order int not null default 0,
  photo_url    text,
  bio          text,
  bio_ne       text,
  is_current   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);
```

### 3.4 activities
```sql
create table activities (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title_en     text not null,
  title_ne     text,
  summary_en   text,
  summary_ne   text,
  body_en      text,
  body_ne      text,
  category     text,
  term_label   text,
  cover_url    text,
  status       content_status not null default 'draft',
  is_featured  boolean not null default false,
  starts_on    date,
  ends_on      date,
  created_by   uuid references users(id) on delete set null,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);
```

### 3.5 activity_participants (join)
```sql
create table activity_participants (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  student_id  uuid not null references users(id) on delete cascade,
  role        text default 'participant',   -- participant | lead
  joined_at   timestamptz not null default now(),
  unique (activity_id, student_id)
);
```

### 3.6 events
```sql
create table events (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title_en      text not null,
  title_ne      text,
  description_en text,
  description_ne text,
  location      text,
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  cover_url     text,
  capacity      int,
  registration_required boolean not null default false,
  status        content_status not null default 'draft',
  created_by    uuid references users(id) on delete set null,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);
```

### 3.7 event_registrations (join)
```sql
create table event_registrations (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  student_id  uuid not null references users(id) on delete cascade,
  status      registration_status not null default 'registered',
  registered_at timestamptz not null default now(),
  unique (event_id, student_id)
);
```

### 3.8 achievements
```sql
create table achievements (
  id           uuid primary key default gen_random_uuid(),
  title_en     text not null,
  title_ne     text,
  description_en text,
  description_ne text,
  type         achievement_type not null default 'student',
  awarded_on   date,
  image_url    text,
  student_id   uuid references users(id) on delete set null,    -- optional
  activity_id  uuid references activities(id) on delete set null, -- optional
  event_id     uuid references events(id) on delete set null,     -- optional
  status       content_status not null default 'published',
  created_by   uuid references users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);
```

### 3.9 gallery_items
```sql
create table gallery_items (
  id          uuid primary key default gen_random_uuid(),
  title_en    text,
  title_ne    text,
  alt_text    text not null,                -- accessibility, required
  image_path  text not null,                -- Storage path in `gallery` bucket
  album       text,                         -- grouping label / year
  activity_id uuid references activities(id) on delete set null,
  event_id    uuid references events(id) on delete set null,
  display_order int not null default 0,
  status      content_status not null default 'published',
  uploaded_by uuid references users(id) on delete set null,
  created_at  timestamptz not null default now()
);
```

### 3.10 announcements
```sql
create table announcements (
  id           uuid primary key default gen_random_uuid(),
  title_en     text not null,
  title_ne     text,
  body_en      text not null,
  body_ne      text,
  audience     announcement_audience not null default 'all',
  is_pinned    boolean not null default false,
  status       content_status not null default 'draft',
  publish_at   timestamptz,
  created_by   uuid references users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);
```

### 3.11 elections
```sql
create table elections (
  id            uuid primary key default gen_random_uuid(),
  title_en      text not null,
  title_ne      text,
  description_en text,
  description_ne text,
  position      text not null,              -- office being contested
  status        election_status not null default 'draft',
  opens_at      timestamptz,
  closes_at     timestamptz,
  results_published_at timestamptz,
  created_by    uuid references users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz,
  check (closes_at is null or opens_at is null or closes_at > opens_at)
);
```

### 3.12 candidates
```sql
create table candidates (
  id          uuid primary key default gen_random_uuid(),
  election_id uuid not null references elections(id) on delete cascade,
  student_id  uuid references users(id) on delete set null,
  display_name text not null,
  manifesto_en text,
  manifesto_ne text,
  photo_url   text,
  display_order int not null default 0,
  is_approved boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (election_id, student_id)
);
```

### 3.13 votes
Integrity via UNIQUE; secrecy via RLS (no one can read individual rows; only aggregate counts exposed through a view/RPC).
```sql
create table votes (
  id           uuid primary key default gen_random_uuid(),
  election_id  uuid not null references elections(id) on delete cascade,
  candidate_id uuid not null references candidates(id) on delete cascade,
  voter_id     uuid not null references users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (election_id, voter_id)            -- one vote per student per election
);
-- Tally exposed only via SECURITY DEFINER function get_election_results(election_id)
-- which returns counts per candidate AFTER status = 'results_published'.
```

### 3.14 magazine_issues
```sql
create table magazine_issues (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title_en    text not null,
  title_ne    text,
  edition     text,                          -- "Vol 1, 2025"
  cover_url   text,
  status      content_status not null default 'draft',
  published_at timestamptz,
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);
```

### 3.15 articles
```sql
create table articles (
  id          uuid primary key default gen_random_uuid(),
  issue_id    uuid references magazine_issues(id) on delete set null,
  slug        text unique,
  title_en    text not null,
  title_ne    text,
  body_en     text,
  body_ne     text,
  cover_url   text,
  author_id   uuid references users(id) on delete set null,
  category    text,                          -- poem | story | essay | art
  status      submission_status not null default 'submitted',
  review_note text,                          -- moderator feedback
  reviewed_by uuid references users(id) on delete set null,
  published_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);
```

### 3.16 suggestions (student voice)
```sql
create table suggestions (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid references users(id) on delete set null,  -- null when anonymous
  is_anonymous boolean not null default false,
  category    suggestion_category not null default 'other',
  title       text not null,
  body        text not null,
  status      suggestion_status not null default 'new',
  response    text,                          -- staff reply
  responded_by uuid references users(id) on delete set null,
  responded_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);
```

### 3.17 notifications
```sql
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  type        notification_type not null default 'system',
  title       text not null,
  body        text,
  link        text,                          -- in-app deep link
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
```

### 3.18 audit_logs
```sql
create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references users(id) on delete set null,
  action      text not null,                 -- 'election.open', 'role.change'...
  entity_type text not null,                 -- 'election', 'user', 'article'...
  entity_id   uuid,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
```

---

## 4. Indexes (key ones)

```sql
create index on activities (status, is_featured);
create index on events (status, starts_at);
create index on achievements (status, awarded_on desc);
create index on gallery_items (album, display_order);
create index on articles (status, issue_id);
create index on votes (election_id, candidate_id);
create index on notifications (user_id, is_read);
create index on audit_logs (entity_type, entity_id);
create index on suggestions (status, created_at desc);
```

---

## 5. Row Level Security (RLS) policy model

RLS is enabled on **every** table. Policies use a helper that reads the JWT role claim:

```sql
-- helper: current user's role from JWT (set by access-token hook)
create or replace function auth.user_role() returns user_role
language sql stable as $$
  select coalesce(
    (auth.jwt() ->> 'user_role')::user_role,
    'public'::user_role
  );
$$;
```

### Policy patterns

| Table | public (anon) | student | teacher | admin |
|-------|---------------|---------|---------|-------|
| activities / events / achievements / gallery_items / announcements | SELECT where `status='published'` (+ audience) | same + own participations | SELECT all + INSERT/UPDATE | full |
| committee_members / magazine_issues | SELECT where current/published | read | manage | manage |
| users | ✗ | SELECT/UPDATE **self** | SELECT all | full |
| student_profiles | ✗ | RW **self** | SELECT all | full |
| activity_participants / event_registrations | ✗ | RW **own** (join/leave self) | SELECT all | full |
| elections | SELECT where `status in('open','results_published')` | same | SELECT all | full |
| candidates | SELECT where election visible & `is_approved` | same | manage | full |
| votes | ✗ | INSERT **self**, no SELECT | ✗ (no row read) | ✗ (no row read) |
| articles | SELECT where `status='published'` | RW **own** drafts/submissions | review/UPDATE all | full |
| suggestions | ✗ | INSERT; SELECT **own** (non-anon) | SELECT/UPDATE all | full |
| notifications | ✗ | RW **own** | RW own | full |
| audit_logs | ✗ | ✗ | ✗ | SELECT |

**Vote secrecy:** no role can `SELECT` from `votes`. Tallies come only from `get_election_results(election_id)` (SECURITY DEFINER) and only after `status='results_published'`. The voter sees a generic "your vote is recorded" receipt, never which candidate they're counted under after the fact.

### Example policies (votes)

```sql
alter table votes enable row level security;

create policy "students cast their own vote"
on votes for insert to authenticated
with check (
  auth.user_role() = 'student'
  and voter_id = auth.uid()
  and exists (
    select 1 from elections e
    where e.id = election_id
      and e.status = 'open'
      and now() between e.opens_at and e.closes_at
  )
);
-- intentionally NO select/update/delete policy → table is write-only for users.
```

---

## 6. Triggers & functions

- **`set_updated_at`** — BEFORE UPDATE trigger on every table with `updated_at`.
- **`handle_new_user`** — AFTER INSERT on `auth.users` → create matching `users` row (+ `student_profiles` if role student).
- **`access_token_hook`** — Supabase Auth hook injecting `user_role` into the JWT from `users.role`.
- **`log_sensitive_change`** — AFTER UPDATE/INSERT on `elections`, `users.role`, `articles.status` → append to `audit_logs`.
- **`notify_on_announcement`** — AFTER UPDATE on `announcements` when `status→published` → fan out `notifications` to target audience.
- **`get_election_results(uuid)`** — SECURITY DEFINER aggregate, gated on `results_published`.

---

## 7. Storage buckets (see also doc 07 §Media)

| Bucket | Public? | Holds | Path convention |
|--------|---------|-------|-----------------|
| `avatars` | public-read | user/student avatars | `avatars/{user_id}/{file}` |
| `gallery` | public-read | gallery images | `gallery/{album}/{uuid}.webp` |
| `magazine` | public-read | article covers/art | `magazine/{issue}/{uuid}` |
| `documents` | private | sensitive docs/exports | `documents/{...}` |

Write access is restricted by Storage RLS keyed to folder = `auth.uid()` (avatars) or role (gallery/magazine/admin).
