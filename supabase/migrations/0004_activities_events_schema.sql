-- =============================================================================
-- 0004 — Activities & Event Participation schema
-- Tables: activity_categories, activities, activity_participants,
--         events, event_registrations, attendance_records
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.content_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.registration_status as enum ('registered', 'cancelled', 'waitlisted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_status as enum ('present', 'absent');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- activity_categories
-- ----------------------------------------------------------------------------
create table if not exists public.activity_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  name_ne     text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- activities
-- ----------------------------------------------------------------------------
create table if not exists public.activities (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  title_ne      text,
  description   text,
  description_ne text,
  category_id   uuid references public.activity_categories (id) on delete set null,
  cover_url     text,
  status        public.content_status not null default 'draft',
  starts_on     date,
  ends_on       date,
  created_by    uuid references public.users (id) on delete set null,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz,
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create index if not exists activities_status_idx   on public.activities (status);
create index if not exists activities_category_idx on public.activities (category_id);

-- ----------------------------------------------------------------------------
-- activity_participants (join table)
-- ----------------------------------------------------------------------------
create table if not exists public.activity_participants (
  id           uuid primary key default gen_random_uuid(),
  activity_id  uuid not null references public.activities (id) on delete cascade,
  member_id    uuid not null references public.users (id) on delete cascade,
  role         text not null default 'participant',
  joined_at    timestamptz not null default now(),
  unique (activity_id, member_id)
);

create index if not exists activity_participants_member_idx on public.activity_participants (member_id);

-- ----------------------------------------------------------------------------
-- events
-- ----------------------------------------------------------------------------
create table if not exists public.events (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  title                 text not null,
  title_ne              text,
  description           text,
  description_ne        text,
  venue                 text,
  starts_at             timestamptz not null,
  ends_at               timestamptz,
  capacity              int check (capacity is null or capacity > 0),
  registration_deadline timestamptz,
  status                public.content_status not null default 'draft',
  created_by            uuid references public.users (id) on delete set null,
  published_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz,
  check (ends_at is null or ends_at >= starts_at)
);

create index if not exists events_status_idx  on public.events (status);
create index if not exists events_starts_idx   on public.events (starts_at);

-- ----------------------------------------------------------------------------
-- event_registrations
-- ----------------------------------------------------------------------------
create table if not exists public.event_registrations (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events (id) on delete cascade,
  member_id      uuid not null references public.users (id) on delete cascade,
  status         public.registration_status not null default 'registered',
  registered_at  timestamptz not null default now(),
  cancelled_at   timestamptz,
  unique (event_id, member_id)
);

create index if not exists event_registrations_member_idx on public.event_registrations (member_id);
create index if not exists event_registrations_event_idx  on public.event_registrations (event_id, status);

-- ----------------------------------------------------------------------------
-- attendance_records
-- ----------------------------------------------------------------------------
create table if not exists public.attendance_records (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  member_id   uuid not null references public.users (id) on delete cascade,
  status      public.attendance_status not null,
  marked_by   uuid references public.users (id) on delete set null,
  marked_at   timestamptz not null default now(),
  unique (event_id, member_id)
);

create index if not exists attendance_member_idx on public.attendance_records (member_id);
create index if not exists attendance_event_idx  on public.attendance_records (event_id);

-- ----------------------------------------------------------------------------
-- updated_at triggers (reuse set_updated_at from 0001)
-- ----------------------------------------------------------------------------
drop trigger if exists set_activities_updated_at on public.activities;
create trigger set_activities_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();
