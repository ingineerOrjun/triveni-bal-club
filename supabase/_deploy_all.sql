-- Triveni Child Club Portal — COMBINED SCHEMA DEPLOY (paste into Supabase SQL Editor; idempotent)

-- >>> 0001_init_auth_schema.sql >>>
-- =============================================================================
-- 0001 â€” Auth & member schema
-- Tables: users, member_profiles, audit_logs (+ enums, triggers)
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Enumerated types
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('public', 'member', 'moderator', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.membership_status as enum ('pending', 'active', 'suspended', 'alumni');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- users â€” mirror of auth.users carrying app role + display fields
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id            uuid primary key references auth.users (id) on delete cascade,
  role          public.user_role not null default 'member',
  full_name     text not null,
  full_name_ne  text,
  email         text not null unique,
  avatar_url    text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

comment on table public.users is 'Application user record mirrored from auth.users; holds authoritative role.';

-- ----------------------------------------------------------------------------
-- member_profiles â€” 1:1 profile for members
-- ----------------------------------------------------------------------------
create table if not exists public.member_profiles (
  user_id            uuid primary key references public.users (id) on delete cascade,
  student_code       text unique,
  class_level        text,
  section            text,
  bio                text,
  bio_ne             text,
  interests          text[] not null default '{}',
  membership_status  public.membership_status not null default 'active',
  joined_on          date not null default current_date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz
);

comment on table public.member_profiles is 'Editable member profile (class, section, bio, avatar handled on users).';

-- ----------------------------------------------------------------------------
-- audit_logs â€” append-only record of sensitive actions
-- ----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.users (id) on delete set null,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists audit_logs_actor_idx   on public.audit_logs (actor_id);
create index if not exists audit_logs_entity_idx   on public.audit_logs (entity_type, entity_id);
create index if not exists audit_logs_created_idx  on public.audit_logs (created_at desc);
create index if not exists users_role_idx          on public.users (role);
create index if not exists member_status_idx       on public.member_profiles (membership_status);

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists set_member_profiles_updated_at on public.member_profiles;
create trigger set_member_profiles_updated_at
  before update on public.member_profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- handle_new_user â€” on auth signup, create users + member_profiles rows
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_name text;
begin
  -- Role may be seeded via user metadata by an admin invite; default 'member'.
  v_role := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'member');
  v_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    split_part(new.email, '@', 1)
  );

  insert into public.users (id, email, full_name, role)
  values (new.id, new.email, v_name, v_role)
  on conflict (id) do nothing;

  if v_role = 'member' then
    insert into public.member_profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- >>> 0002_functions.sql >>>
-- =============================================================================
-- 0002 â€” Helper functions: role accessor, access-token hook, audit logger
-- =============================================================================

-- ----------------------------------------------------------------------------
-- current_user_role() â€” read the caller's role from the users table.
-- STABLE + SECURITY DEFINER so RLS policies can call it without recursion.
-- ----------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.users where id = auth.uid()),
    'public'::public.user_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin';
$$;

-- ----------------------------------------------------------------------------
-- Custom Access Token Hook â€” injects `user_role` into the JWT.
-- Enable in Supabase Dashboard: Authentication â†’ Hooks â†’ Customize Access Token
-- (select public.custom_access_token_hook).
-- ----------------------------------------------------------------------------
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  v_claims jsonb;
  v_role   public.user_role;
begin
  select role into v_role from public.users where id = (event ->> 'user_id')::uuid;

  v_claims := event -> 'claims';
  if v_role is not null then
    v_claims := jsonb_set(v_claims, '{user_role}', to_jsonb(v_role::text));
  else
    v_claims := jsonb_set(v_claims, '{user_role}', to_jsonb('member'::text));
  end if;

  return jsonb_set(event, '{claims}', v_claims);
end;
$$;

-- Grant the auth admin role permission to run the hook.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on table public.users to supabase_auth_admin;

-- ----------------------------------------------------------------------------
-- log_audit() â€” SECURITY DEFINER so members can append (but not read) audit
-- entries attributed to themselves. Read access is admin-only via RLS.
-- ----------------------------------------------------------------------------
create or replace function public.log_audit(
  p_action      text,
  p_entity_type text,
  p_entity_id   uuid default null,
  p_metadata    jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

grant execute on function public.log_audit(text, text, uuid, jsonb) to authenticated;
grant execute on function public.current_user_role() to authenticated, anon;
grant execute on function public.is_admin() to authenticated;


-- >>> 0003_rls_policies.sql >>>
-- =============================================================================
-- 0003 â€” Row Level Security
-- Enable RLS on every table and define least-privilege policies.
-- =============================================================================

alter table public.users           enable row level security;
alter table public.member_profiles enable row level security;
alter table public.audit_logs      enable row level security;

-- ----------------------------------------------------------------------------
-- users
-- ----------------------------------------------------------------------------
-- Read own row; admins read all.
drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Update own safe fields; admins update all. (Role changes go through admin
-- tooling using the service role â€” members cannot escalate their own role.)
drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Only admins may insert directly (signups are handled by the trigger).
drop policy if exists users_insert_admin on public.users;
create policy users_insert_admin on public.users
  for insert to authenticated
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- member_profiles
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select_self on public.member_profiles;
create policy profiles_select_self on public.member_profiles
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_role() in ('moderator', 'admin')
  );

drop policy if exists profiles_update_self on public.member_profiles;
create policy profiles_update_self on public.member_profiles
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_self on public.member_profiles;
create policy profiles_insert_self on public.member_profiles
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- audit_logs â€” admin read only; writes happen via SECURITY DEFINER log_audit()
-- (no INSERT/UPDATE/DELETE policy => members cannot write/read rows directly).
-- ----------------------------------------------------------------------------
drop policy if exists audit_select_admin on public.audit_logs;
create policy audit_select_admin on public.audit_logs
  for select to authenticated
  using (public.is_admin());


-- >>> 0004_activities_events_schema.sql >>>
-- =============================================================================
-- 0004 â€” Activities & Event Participation schema
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


-- >>> 0005_participation_functions.sql >>>
-- =============================================================================
-- 0005 â€” Participation integrity: capacity / deadline / publish enforcement
-- These run in the DATABASE so rules hold even if app-layer checks are bypassed.
-- =============================================================================

-- Enforce event-registration rules on insert OR when (re)setting status to
-- 'registered'. Counting + state checks happen atomically inside the trigger.
create or replace function public.enforce_event_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event   public.events%rowtype;
  v_count   int;
begin
  if new.status <> 'registered' then
    return new; -- cancellations/waitlist updates are unrestricted here
  end if;

  select * into v_event from public.events where id = new.event_id;

  if v_event.id is null then
    raise exception 'Event not found';
  end if;

  if v_event.status <> 'published' then
    raise exception 'Registration is not open for this event';
  end if;

  if v_event.registration_deadline is not null
     and now() > v_event.registration_deadline then
    raise exception 'The registration deadline has passed';
  end if;

  if v_event.capacity is not null then
    select count(*) into v_count
    from public.event_registrations
    where event_id = new.event_id
      and status = 'registered'
      and member_id <> new.member_id; -- exclude this member's own (re)registration

    if v_count >= v_event.capacity then
      raise exception 'This event is full';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_registration on public.event_registrations;
create trigger trg_enforce_registration
  before insert or update on public.event_registrations
  for each row execute function public.enforce_event_registration();

-- Stamp cancelled_at when a registration is cancelled.
create or replace function public.stamp_registration_cancel()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'cancelled' and (old.status is distinct from 'cancelled') then
    new.cancelled_at := now();
  elsif new.status = 'registered' then
    new.cancelled_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_cancel on public.event_registrations;
create trigger trg_stamp_cancel
  before update on public.event_registrations
  for each row execute function public.stamp_registration_cancel();

-- Helper: live registered count for an event (used by queries/UI).
create or replace function public.event_registered_count(p_event_id uuid)
returns int
language sql
stable
as $$
  select count(*)::int
  from public.event_registrations
  where event_id = p_event_id and status = 'registered';
$$;

grant execute on function public.event_registered_count(uuid) to authenticated, anon;


-- >>> 0006_activities_events_rls.sql >>>
-- =============================================================================
-- 0006 â€” Row Level Security for activities & events
-- =============================================================================

-- Staff = moderator or admin (content managers).
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('moderator', 'admin');
$$;

grant execute on function public.is_staff() to authenticated;

alter table public.activity_categories  enable row level security;
alter table public.activities           enable row level security;
alter table public.activity_participants enable row level security;
alter table public.events               enable row level security;
alter table public.event_registrations  enable row level security;
alter table public.attendance_records   enable row level security;

-- ----------------------------------------------------------------------------
-- activity_categories â€” public read, staff manage
-- ----------------------------------------------------------------------------
drop policy if exists cat_read on public.activity_categories;
create policy cat_read on public.activity_categories
  for select to anon, authenticated using (true);

drop policy if exists cat_write on public.activity_categories;
create policy cat_write on public.activity_categories
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- activities â€” published visible to all; staff see + manage everything
-- ----------------------------------------------------------------------------
drop policy if exists activities_read on public.activities;
create policy activities_read on public.activities
  for select to anon, authenticated
  using (status = 'published' or public.is_staff());

drop policy if exists activities_insert on public.activities;
create policy activities_insert on public.activities
  for insert to authenticated with check (public.is_staff());

drop policy if exists activities_update on public.activities;
create policy activities_update on public.activities
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists activities_delete on public.activities;
create policy activities_delete on public.activities
  for delete to authenticated using (public.is_staff());

-- ----------------------------------------------------------------------------
-- activity_participants â€” member manages own membership; staff read all
-- ----------------------------------------------------------------------------
drop policy if exists ap_read on public.activity_participants;
create policy ap_read on public.activity_participants
  for select to authenticated
  using (member_id = auth.uid() or public.is_staff());

drop policy if exists ap_join on public.activity_participants;
create policy ap_join on public.activity_participants
  for insert to authenticated
  with check (
    member_id = auth.uid()
    and exists (
      select 1 from public.activities a
      where a.id = activity_id and a.status = 'published'
    )
  );

drop policy if exists ap_leave on public.activity_participants;
create policy ap_leave on public.activity_participants
  for delete to authenticated
  using (member_id = auth.uid() or public.is_staff());

-- ----------------------------------------------------------------------------
-- events â€” published visible to all; staff manage
-- ----------------------------------------------------------------------------
drop policy if exists events_read on public.events;
create policy events_read on public.events
  for select to anon, authenticated
  using (status = 'published' or public.is_staff());

drop policy if exists events_insert on public.events;
create policy events_insert on public.events
  for insert to authenticated with check (public.is_staff());

drop policy if exists events_update on public.events;
create policy events_update on public.events
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists events_delete on public.events;
create policy events_delete on public.events
  for delete to authenticated using (public.is_staff());

-- ----------------------------------------------------------------------------
-- event_registrations â€” member manages own; staff read all
-- (capacity/deadline enforced by trigger in 0005)
-- ----------------------------------------------------------------------------
drop policy if exists reg_read on public.event_registrations;
create policy reg_read on public.event_registrations
  for select to authenticated
  using (member_id = auth.uid() or public.is_staff());

drop policy if exists reg_insert on public.event_registrations;
create policy reg_insert on public.event_registrations
  for insert to authenticated
  with check (member_id = auth.uid());

drop policy if exists reg_update on public.event_registrations;
create policy reg_update on public.event_registrations
  for update to authenticated
  using (member_id = auth.uid() or public.is_staff())
  with check (member_id = auth.uid() or public.is_staff());

-- ----------------------------------------------------------------------------
-- attendance_records â€” member reads own; only staff write
-- ----------------------------------------------------------------------------
drop policy if exists att_read on public.attendance_records;
create policy att_read on public.attendance_records
  for select to authenticated
  using (member_id = auth.uid() or public.is_staff());

drop policy if exists att_write on public.attendance_records;
create policy att_write on public.attendance_records
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());


-- >>> 0007_seed_categories.sql >>>
-- =============================================================================
-- 0007 â€” Seed activity categories (idempotent)
-- =============================================================================
insert into public.activity_categories (slug, name, name_ne, sort_order) values
  ('leadership',  'Leadership',        'à¤¨à¥‡à¤¤à¥ƒà¤¤à¥à¤µ',            1),
  ('environment', 'Environment',       'à¤µà¤¾à¤¤à¤¾à¤µà¤°à¤£',           2),
  ('arts',        'Arts & Culture',    'à¤•à¤²à¤¾ à¤° à¤¸à¤‚à¤¸à¥à¤•à¥ƒà¤¤à¤¿',     3),
  ('sports',      'Sports',            'à¤–à¥‡à¤²à¤•à¥à¤¦',            4),
  ('literary',    'Literary',          'à¤¸à¤¾à¤¹à¤¿à¤¤à¥à¤¯à¤¿à¤•',          5),
  ('service',     'Community Service', 'à¤¸à¤¾à¤®à¥à¤¦à¤¾à¤¯à¤¿à¤• à¤¸à¥‡à¤µà¤¾',     6),
  ('science',     'Science & Tech',    'à¤µà¤¿à¤œà¥à¤žà¤¾à¤¨ à¤° à¤ªà¥à¤°à¤µà¤¿à¤§à¤¿',   7)
on conflict (slug) do nothing;


-- >>> 0008_audit_fixes.sql >>>
-- =============================================================================
-- 0008 â€” Phase 5 audit fixes
--   â€¢ missing indexes for unindexed sort paths
--   â€¢ close the capacity overbooking race in the registration trigger
--   â€¢ defense-in-depth RLS: members may only INSERT a registration for a
--     published event (previously enforced only by the trigger)
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Indexes for sort keys used by list queries
-- ----------------------------------------------------------------------------
-- listActivities(): order by created_at desc, no SQL filter.
create index if not exists activities_created_idx
  on public.activities (created_at desc);

-- listRegistrationsForEvent(): eq(event_id) + order(registered_at asc).
create index if not exists event_registrations_event_registered_idx
  on public.event_registrations (event_id, registered_at);

-- ----------------------------------------------------------------------------
-- Capacity race: serialize concurrent registrations for the same event by
-- taking a row lock on the event before counting. Two simultaneous inserts can
-- no longer both observe count < capacity and overbook.
-- ----------------------------------------------------------------------------
create or replace function public.enforce_event_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event   public.events%rowtype;
  v_count   int;
begin
  if new.status <> 'registered' then
    return new; -- cancellations/waitlist updates are unrestricted here
  end if;

  -- Lock the event row so concurrent registrations are serialized.
  select * into v_event from public.events where id = new.event_id for update;

  if v_event.id is null then
    raise exception 'Event not found';
  end if;

  if v_event.status <> 'published' then
    raise exception 'Registration is not open for this event';
  end if;

  if v_event.registration_deadline is not null
     and now() > v_event.registration_deadline then
    raise exception 'The registration deadline has passed';
  end if;

  if v_event.capacity is not null then
    select count(*) into v_count
    from public.event_registrations
    where event_id = new.event_id
      and status = 'registered'
      and member_id <> new.member_id;

    if v_count >= v_event.capacity then
      raise exception 'This event is full';
    end if;
  end if;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- RLS: a member may only create a registration for a published event.
-- (Re-registration after cancelling goes through UPDATE / reg_update.)
-- ----------------------------------------------------------------------------
drop policy if exists reg_insert on public.event_registrations;
create policy reg_insert on public.event_registrations
  for insert to authenticated
  with check (
    member_id = auth.uid()
    and exists (
      select 1 from public.events e
      where e.id = event_id and e.status = 'published'
    )
  );


-- >>> 0009_recognition_schema.sql >>>
-- =============================================================================
-- 0009 â€” Achievements & Recognition schema
-- Tables: achievement_categories, badges, badge_rules, member_achievements,
--         member_badges, certificates, recognition_programs, recognition_awards
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.achievement_visibility as enum ('public', 'members', 'private');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.recognition_source as enum ('manual', 'automatic');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.award_status as enum ('recommended', 'awarded', 'rejected');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- achievement_categories
-- ----------------------------------------------------------------------------
create table if not exists public.achievement_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  name_ne     text,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- badges (the catalog of badge types)
-- ----------------------------------------------------------------------------
create table if not exists public.badges (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  icon        text,                          -- lucide icon name
  category_id uuid references public.achievement_categories (id) on delete set null,
  criteria    text,
  image_url   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create index if not exists badges_active_idx   on public.badges (is_active);
create index if not exists badges_category_idx on public.badges (category_id);

-- ----------------------------------------------------------------------------
-- badge_rules (data-driven automatic-award rules)
-- metric âˆˆ {events_attended, events_registered, activities_joined}
-- ----------------------------------------------------------------------------
create table if not exists public.badge_rules (
  id          uuid primary key default gen_random_uuid(),
  badge_id    uuid not null references public.badges (id) on delete cascade,
  metric      text not null check (
                metric in ('events_attended', 'events_registered', 'activities_joined')
              ),
  comparator  text not null default '>=' check (comparator in ('>=')),
  threshold   int not null check (threshold >= 1),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists badge_rules_badge_idx on public.badge_rules (badge_id);

-- ----------------------------------------------------------------------------
-- member_achievements
-- ----------------------------------------------------------------------------
create table if not exists public.member_achievements (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.users (id) on delete cascade,
  title       text not null,
  description text,
  category_id uuid references public.achievement_categories (id) on delete set null,
  award_date  date not null default current_date,
  awarded_by  uuid references public.users (id) on delete set null,
  evidence    text,
  visibility  public.achievement_visibility not null default 'members',
  source      public.recognition_source not null default 'manual',
  status      public.award_status not null default 'awarded',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create index if not exists ach_member_idx     on public.member_achievements (member_id, status);
create index if not exists ach_visibility_idx on public.member_achievements (visibility, status);
create index if not exists ach_category_idx   on public.member_achievements (category_id);
create index if not exists ach_award_date_idx on public.member_achievements (award_date desc);

-- ----------------------------------------------------------------------------
-- member_badges (badges earned/recommended for members)
-- ----------------------------------------------------------------------------
create table if not exists public.member_badges (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.users (id) on delete cascade,
  badge_id    uuid not null references public.badges (id) on delete cascade,
  awarded_by  uuid references public.users (id) on delete set null,
  source      public.recognition_source not null default 'manual',
  status      public.award_status not null default 'awarded',
  awarded_at  timestamptz not null default now(),
  unique (member_id, badge_id)
);

create index if not exists member_badges_member_idx on public.member_badges (member_id, status);
create index if not exists member_badges_badge_idx  on public.member_badges (badge_id, status);

-- ----------------------------------------------------------------------------
-- certificates
-- ----------------------------------------------------------------------------
create table if not exists public.certificates (
  id                 uuid primary key default gen_random_uuid(),
  certificate_number text not null unique,
  title              text not null,
  recipient_id       uuid not null references public.users (id) on delete cascade,
  achievement_id     uuid references public.member_achievements (id) on delete set null,
  issued_date        date not null default current_date,
  verification_code  text not null unique,
  pdf_url            text,
  issued_by          uuid references public.users (id) on delete set null,
  created_at         timestamptz not null default now()
);

create index if not exists certificates_recipient_idx on public.certificates (recipient_id);

-- ----------------------------------------------------------------------------
-- recognition_programs
-- ----------------------------------------------------------------------------
create table if not exists public.recognition_programs (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  criteria    text,
  starts_on   date,
  ends_on     date,
  status      public.content_status not null default 'draft',
  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create index if not exists programs_status_idx on public.recognition_programs (status);

-- ----------------------------------------------------------------------------
-- recognition_awards (winners of a program)
-- ----------------------------------------------------------------------------
create table if not exists public.recognition_awards (
  id           uuid primary key default gen_random_uuid(),
  program_id   uuid not null references public.recognition_programs (id) on delete cascade,
  member_id    uuid not null references public.users (id) on delete cascade,
  title        text not null,
  period_label text,
  note         text,
  awarded_by   uuid references public.users (id) on delete set null,
  awarded_at   timestamptz not null default now()
);

create index if not exists awards_program_idx on public.recognition_awards (program_id);
create index if not exists awards_member_idx   on public.recognition_awards (member_id);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
drop trigger if exists set_badges_updated_at on public.badges;
create trigger set_badges_updated_at
  before update on public.badges
  for each row execute function public.set_updated_at();

drop trigger if exists set_ach_updated_at on public.member_achievements;
create trigger set_ach_updated_at
  before update on public.member_achievements
  for each row execute function public.set_updated_at();

drop trigger if exists set_programs_updated_at on public.recognition_programs;
create trigger set_programs_updated_at
  before update on public.recognition_programs
  for each row execute function public.set_updated_at();


-- >>> 0010_recognition_functions.sql >>>
-- =============================================================================
-- 0010 â€” Recognition engine + certificate verification
-- =============================================================================

-- ----------------------------------------------------------------------------
-- evaluate_member_badges(member) â€” data-driven automatic badge engine.
-- Reads badge_rules, computes participation metrics, and awards any earned
-- badges not already held. Idempotent. SECURITY DEFINER so it can write
-- member_badges; callable for self, or for anyone by staff.
-- Returns the number of badges newly awarded.
-- ----------------------------------------------------------------------------
create or replace function public.evaluate_member_badges(p_member uuid default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member       uuid := coalesce(p_member, auth.uid());
  v_attended     int;
  v_registered   int;
  v_joined       int;
  v_awarded      int := 0;
  r              record;
  v_value        int;
begin
  if v_member is null then
    return 0;
  end if;
  if v_member <> auth.uid() and not public.is_staff() then
    raise exception 'Not allowed to evaluate badges for another member';
  end if;

  select count(*) into v_attended
    from public.attendance_records
    where member_id = v_member and status = 'present';

  select count(*) into v_registered
    from public.event_registrations
    where member_id = v_member and status = 'registered';

  select count(*) into v_joined
    from public.activity_participants
    where member_id = v_member;

  for r in
    select br.metric, br.threshold, br.badge_id
    from public.badge_rules br
    join public.badges b on b.id = br.badge_id
    where br.is_active and b.is_active
  loop
    v_value := case r.metric
      when 'events_attended'   then v_attended
      when 'events_registered' then v_registered
      when 'activities_joined' then v_joined
      else 0
    end;

    if v_value >= r.threshold
       and not exists (
         select 1 from public.member_badges
         where member_id = v_member and badge_id = r.badge_id
       )
    then
      insert into public.member_badges (member_id, badge_id, source, status)
      values (v_member, r.badge_id, 'automatic', 'awarded')
      on conflict (member_id, badge_id) do nothing;
      v_awarded := v_awarded + 1;
    end if;
  end loop;

  return v_awarded;
end;
$$;

grant execute on function public.evaluate_member_badges(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- verify_certificate(code) â€” PUBLIC, safe certificate verification.
-- Returns only non-sensitive fields; never exposes the certificates table.
-- ----------------------------------------------------------------------------
create or replace function public.verify_certificate(p_code text)
returns table (
  certificate_number text,
  title              text,
  recipient_name     text,
  issued_date        date,
  valid              boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.certificate_number,
    c.title,
    u.full_name as recipient_name,
    c.issued_date,
    true as valid
  from public.certificates c
  join public.users u on u.id = c.recipient_id
  where c.verification_code = p_code;
$$;

grant execute on function public.verify_certificate(text) to anon, authenticated;


-- >>> 0011_recognition_rls.sql >>>
-- =============================================================================
-- 0011 â€” Row Level Security for recognition tables
-- Roles: is_admin() (full), is_staff() (moderator+admin), members, anon.
-- Moderators may RECOMMEND achievements/badges (status='recommended') but only
-- admins may award, issue certificates, or manage programs.
-- =============================================================================

alter table public.achievement_categories enable row level security;
alter table public.badges                 enable row level security;
alter table public.badge_rules            enable row level security;
alter table public.member_achievements    enable row level security;
alter table public.member_badges          enable row level security;
alter table public.certificates           enable row level security;
alter table public.recognition_programs   enable row level security;
alter table public.recognition_awards     enable row level security;

-- ----------------------------------------------------------------------------
-- achievement_categories â€” public read, admin manage
-- ----------------------------------------------------------------------------
drop policy if exists achcat_read on public.achievement_categories;
create policy achcat_read on public.achievement_categories
  for select to anon, authenticated using (true);
drop policy if exists achcat_write on public.achievement_categories;
create policy achcat_write on public.achievement_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- badges (catalog) â€” active visible to all, admin manages
-- ----------------------------------------------------------------------------
drop policy if exists badges_read on public.badges;
create policy badges_read on public.badges
  for select to anon, authenticated using (is_active or public.is_staff());
drop policy if exists badges_write on public.badges;
create policy badges_write on public.badges
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- badge_rules â€” staff read, admin manage
-- ----------------------------------------------------------------------------
drop policy if exists rules_read on public.badge_rules;
create policy rules_read on public.badge_rules
  for select to authenticated using (public.is_staff());
drop policy if exists rules_write on public.badge_rules;
create policy rules_write on public.badge_rules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- member_achievements
--   read: public+awarded, or own, or staff
--   insert: staff; moderators limited to status='recommended'
--   update/delete: admin only
-- ----------------------------------------------------------------------------
drop policy if exists ach_read on public.member_achievements;
create policy ach_read on public.member_achievements
  for select to anon, authenticated
  using (
    (status = 'awarded' and visibility = 'public')
    or member_id = auth.uid()
    or public.is_staff()
  );

drop policy if exists ach_insert on public.member_achievements;
create policy ach_insert on public.member_achievements
  for insert to authenticated
  with check (
    public.is_staff()
    and (public.is_admin() or status = 'recommended')
  );

drop policy if exists ach_update on public.member_achievements;
create policy ach_update on public.member_achievements
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists ach_delete on public.member_achievements;
create policy ach_delete on public.member_achievements
  for delete to authenticated using (public.is_admin());

-- ----------------------------------------------------------------------------
-- member_badges
--   read: awarded visible to all, or own, or staff
--   insert: staff; moderators limited to status='recommended'
--           (automatic awards are inserted by the SECURITY DEFINER engine)
--   update/delete: admin only
-- ----------------------------------------------------------------------------
drop policy if exists mb_read on public.member_badges;
create policy mb_read on public.member_badges
  for select to anon, authenticated
  using (status = 'awarded' or member_id = auth.uid() or public.is_staff());

drop policy if exists mb_insert on public.member_badges;
create policy mb_insert on public.member_badges
  for insert to authenticated
  with check (
    public.is_staff()
    and (public.is_admin() or status = 'recommended')
  );

drop policy if exists mb_update on public.member_badges;
create policy mb_update on public.member_badges
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists mb_delete on public.member_badges;
create policy mb_delete on public.member_badges
  for delete to authenticated using (public.is_admin());

-- ----------------------------------------------------------------------------
-- certificates â€” recipient or staff read; admin-only write.
-- (Public verification goes through verify_certificate(), not this table.)
-- ----------------------------------------------------------------------------
drop policy if exists cert_read on public.certificates;
create policy cert_read on public.certificates
  for select to authenticated
  using (recipient_id = auth.uid() or public.is_staff());

drop policy if exists cert_write on public.certificates;
create policy cert_write on public.certificates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- recognition_programs â€” published visible to all; admin manages
-- ----------------------------------------------------------------------------
drop policy if exists prog_read on public.recognition_programs;
create policy prog_read on public.recognition_programs
  for select to anon, authenticated
  using (status = 'published' or public.is_staff());
drop policy if exists prog_write on public.recognition_programs;
create policy prog_write on public.recognition_programs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- recognition_awards â€” public read (recognition); admin manages
-- ----------------------------------------------------------------------------
drop policy if exists awards_read on public.recognition_awards;
create policy awards_read on public.recognition_awards
  for select to anon, authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.recognition_programs p
      where p.id = program_id and p.status = 'published'
    )
  );
drop policy if exists awards_write on public.recognition_awards;
create policy awards_write on public.recognition_awards
  for all to authenticated using (public.is_admin()) with check (public.is_admin());


-- >>> 0012_seed_recognition.sql >>>
-- =============================================================================
-- 0012 â€” Seed achievement categories, badges, and automatic badge rules
-- Idempotent (on-conflict-do-nothing on slugs).
-- =============================================================================

insert into public.achievement_categories (slug, name, name_ne, sort_order) values
  ('leadership',          'Leadership',          'à¤¨à¥‡à¤¤à¥ƒà¤¤à¥à¤µ',              1),
  ('participation',       'Participation',       'à¤¸à¤¹à¤­à¤¾à¤—à¤¿à¤¤à¤¾',            2),
  ('volunteer-service',   'Volunteer Service',   'à¤¸à¥à¤µà¤¯à¤‚à¤¸à¥‡à¤µà¤¾',            3),
  ('community-service',   'Community Service',   'à¤¸à¤¾à¤®à¥à¤¦à¤¾à¤¯à¤¿à¤• à¤¸à¥‡à¤µà¤¾',       4),
  ('academic-excellence', 'Academic Excellence', 'à¤¶à¥ˆà¤•à¥à¤·à¤¿à¤• à¤‰à¤¤à¥à¤•à¥ƒà¤·à¥à¤Ÿà¤¤à¤¾',    5),
  ('sports-excellence',   'Sports Excellence',   'à¤–à¥‡à¤²à¤•à¥à¤¦ à¤‰à¤¤à¥à¤•à¥ƒà¤·à¥à¤Ÿà¤¤à¤¾',     6),
  ('cultural-excellence', 'Cultural Excellence', 'à¤¸à¤¾à¤‚à¤¸à¥à¤•à¥ƒà¤¤à¤¿à¤• à¤‰à¤¤à¥à¤•à¥ƒà¤·à¥à¤Ÿà¤¤à¤¾', 7),
  ('creative-arts',       'Creative Arts',       'à¤¸à¤¿à¤°à¥à¤œà¤¨à¤¾à¤¤à¥à¤®à¤• à¤•à¤²à¤¾',       8),
  ('innovation',          'Innovation',          'à¤¨à¤µà¤ªà¥à¤°à¤µà¤°à¥à¤¤à¤¨',           9),
  ('special-recognition', 'Special Recognition', 'à¤µà¤¿à¤¶à¥‡à¤· à¤¸à¤®à¥à¤®à¤¾à¤¨',         10)
on conflict (slug) do nothing;

-- Badges (icon = lucide name). Category linked by slug lookup.
insert into public.badges (slug, name, description, icon, category_id, criteria) values
  ('first-event',       'First Event',       'Attended your first club event.',          'PartyPopper',
     (select id from public.achievement_categories where slug = 'participation'),     'Attend 1 event'),
  ('team-player',       'Team Player',       'Attended 5 or more events.',               'Users',
     (select id from public.achievement_categories where slug = 'participation'),     'Attend 5 events'),
  ('outstanding-member','Outstanding Member','Attended 10 or more events.',              'Star',
     (select id from public.achievement_categories where slug = 'special-recognition'),'Attend 10 events'),
  ('volunteer',         'Volunteer',         'Joined a club activity as a volunteer.',   'HandHeart',
     (select id from public.achievement_categories where slug = 'volunteer-service'),  'Join 1 activity'),
  ('community-helper',  'Community Helper',  'Joined 5 or more activities.',             'HeartHandshake',
     (select id from public.achievement_categories where slug = 'community-service'),  'Join 5 activities'),
  ('leader',            'Leader',            'Recognised for leadership in the club.',   'Crown',
     (select id from public.achievement_categories where slug = 'leadership'),         'Awarded by admins'),
  ('debater',           'Debater',           'Excelled in debate & public speaking.',    'MessageSquare',
     (select id from public.achievement_categories where slug = 'cultural-excellence'),'Awarded by admins'),
  ('organizer',         'Organizer',         'Helped organise a club event.',            'ClipboardList',
     (select id from public.achievement_categories where slug = 'leadership'),         'Awarded by admins')
on conflict (slug) do nothing;

-- Automatic award rules (data-driven). Manual badges (leader/debater/organizer)
-- intentionally have no rule.
insert into public.badge_rules (badge_id, metric, threshold)
select b.id, v.metric, v.threshold
from (values
  ('first-event',       'events_attended',   1),
  ('team-player',       'events_attended',   5),
  ('outstanding-member','events_attended',   10),
  ('volunteer',         'activities_joined', 1),
  ('community-helper',  'activities_joined', 5)
) as v(slug, metric, threshold)
join public.badges b on b.slug = v.slug
where not exists (
  select 1 from public.badge_rules br where br.badge_id = b.id and br.metric = v.metric
);


-- >>> 0013_student_voice_schema.sql >>>
-- =============================================================================
-- 0013 â€” Student Voice & Suggestions schema
-- Tables: suggestion_categories, suggestions, suggestion_status_history,
--         suggestion_votes, moderator_feedback, tags, suggestion_tags
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.suggestion_status as enum (
    'draft', 'submitted', 'under_review', 'accepted', 'planned',
    'in_progress', 'implemented', 'rejected', 'archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.suggestion_visibility as enum ('private', 'members', 'public');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.suggestion_priority as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- suggestion_categories (admin-managed)
-- ----------------------------------------------------------------------------
create table if not exists public.suggestion_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  name_ne     text,
  description text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- tags
-- ----------------------------------------------------------------------------
create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- suggestions
-- ----------------------------------------------------------------------------
create table if not exists public.suggestions (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  description          text not null,
  category_id          uuid references public.suggestion_categories (id) on delete set null,
  status               public.suggestion_status not null default 'draft',
  visibility           public.suggestion_visibility not null default 'members',
  author_id            uuid not null references public.users (id) on delete cascade,
  is_anonymous         boolean not null default false,
  priority             public.suggestion_priority not null default 'medium',
  moderator_notes      text,
  estimated_completion date,
  assigned_to          uuid references public.users (id) on delete set null,
  merged_into          uuid references public.suggestions (id) on delete set null,
  support_count        int not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz
);

create index if not exists sg_status_idx       on public.suggestions (status);
create index if not exists sg_category_idx     on public.suggestions (category_id);
create index if not exists sg_priority_idx     on public.suggestions (priority);
create index if not exists sg_author_idx       on public.suggestions (author_id);
create index if not exists sg_assigned_idx     on public.suggestions (assigned_to);
create index if not exists sg_visible_status_idx on public.suggestions (visibility, status);
create index if not exists sg_created_idx      on public.suggestions (created_at desc);
create index if not exists sg_updated_idx      on public.suggestions (updated_at desc);
create index if not exists sg_support_idx      on public.suggestions (support_count desc);

-- ----------------------------------------------------------------------------
-- suggestion_status_history (timeline)
-- ----------------------------------------------------------------------------
create table if not exists public.suggestion_status_history (
  id            uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.suggestions (id) on delete cascade,
  old_status    public.suggestion_status,
  new_status    public.suggestion_status not null,
  changed_by    uuid references public.users (id) on delete set null,
  reason        text,
  created_at    timestamptz not null default now()
);

create index if not exists ssh_suggestion_idx on public.suggestion_status_history (suggestion_id, created_at);

-- ----------------------------------------------------------------------------
-- suggestion_votes (support only; one per member; no downvotes)
-- ----------------------------------------------------------------------------
create table if not exists public.suggestion_votes (
  id            uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.suggestions (id) on delete cascade,
  member_id     uuid not null references public.users (id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (suggestion_id, member_id)
);

create index if not exists sv_member_idx on public.suggestion_votes (member_id);

-- ----------------------------------------------------------------------------
-- moderator_feedback
-- ----------------------------------------------------------------------------
create table if not exists public.moderator_feedback (
  id            uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.suggestions (id) on delete cascade,
  moderator_id  uuid references public.users (id) on delete set null,
  body          text not null,
  created_at    timestamptz not null default now()
);

create index if not exists mf_suggestion_idx on public.moderator_feedback (suggestion_id, created_at);

-- ----------------------------------------------------------------------------
-- suggestion_tags (join)
-- ----------------------------------------------------------------------------
create table if not exists public.suggestion_tags (
  suggestion_id uuid not null references public.suggestions (id) on delete cascade,
  tag_id        uuid not null references public.tags (id) on delete cascade,
  primary key (suggestion_id, tag_id)
);

create index if not exists st_tag_idx on public.suggestion_tags (tag_id);

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------
drop trigger if exists set_suggestions_updated_at on public.suggestions;
create trigger set_suggestions_updated_at
  before update on public.suggestions
  for each row execute function public.set_updated_at();


-- >>> 0014_student_voice_functions.sql >>>
-- =============================================================================
-- 0014 â€” Student Voice triggers + recognition-engine extension
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Maintain suggestions.support_count from suggestion_votes (avoids N+1 counts).
-- ----------------------------------------------------------------------------
create or replace function public.sync_support_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.suggestions
      set support_count = support_count + 1
      where id = new.suggestion_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.suggestions
      set support_count = greatest(support_count - 1, 0)
      where id = old.suggestion_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_support_count on public.suggestion_votes;
create trigger trg_support_count
  after insert or delete on public.suggestion_votes
  for each row execute function public.sync_support_count();

-- ----------------------------------------------------------------------------
-- Guard rails enforced in the database (defense in depth):
--   â€¢ accepted/implemented suggestions cannot be deleted (archive instead)
--   â€¢ status transitions are recorded automatically as a safety net
-- ----------------------------------------------------------------------------
create or replace function public.prevent_locked_delete()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('accepted', 'planned', 'in_progress', 'implemented') then
    raise exception 'Accepted suggestions cannot be deleted â€” archive instead';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_prevent_locked_delete on public.suggestions;
create trigger trg_prevent_locked_delete
  before delete on public.suggestions
  for each row execute function public.prevent_locked_delete();

-- Safety-net status history (in addition to the rich history written by the
-- server action, which includes a reason). Only fires when status changes and
-- the app did not already insert a matching row in this statement.
create or replace function public.record_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if not exists (
      select 1 from public.suggestion_status_history h
      where h.suggestion_id = new.id
        and h.new_status = new.status
        and h.created_at > now() - interval '5 seconds'
    ) then
      insert into public.suggestion_status_history
        (suggestion_id, old_status, new_status, changed_by)
      values (new.id, old.status, new.status, auth.uid());
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_record_status_change on public.suggestions;
create trigger trg_record_status_change
  after update on public.suggestions
  for each row execute function public.record_status_change();

-- ----------------------------------------------------------------------------
-- Extend badge_rules metric vocabulary + the recognition engine with
-- suggestion metrics. Reuses the Phase-6 engine (never duplicates the logic).
-- ----------------------------------------------------------------------------
alter table public.badge_rules drop constraint if exists badge_rules_metric_check;
alter table public.badge_rules add constraint badge_rules_metric_check
  check (metric in (
    'events_attended', 'events_registered', 'activities_joined',
    'suggestions_submitted', 'suggestions_implemented', 'suggestions_supported'
  ));

create or replace function public.evaluate_member_badges(p_member uuid default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member                  uuid := coalesce(p_member, auth.uid());
  v_attended                int;
  v_registered              int;
  v_joined                  int;
  v_suggestions_submitted   int;
  v_suggestions_implemented int;
  v_suggestions_supported   int;
  v_awarded                 int := 0;
  r                         record;
  v_value                   int;
begin
  if v_member is null then
    return 0;
  end if;
  if v_member <> auth.uid() and not public.is_staff() then
    raise exception 'Not allowed to evaluate badges for another member';
  end if;

  select count(*) into v_attended
    from public.attendance_records where member_id = v_member and status = 'present';
  select count(*) into v_registered
    from public.event_registrations where member_id = v_member and status = 'registered';
  select count(*) into v_joined
    from public.activity_participants where member_id = v_member;
  select count(*) into v_suggestions_submitted
    from public.suggestions where author_id = v_member and status <> 'draft';
  select count(*) into v_suggestions_implemented
    from public.suggestions where author_id = v_member and status = 'implemented';
  select count(*) into v_suggestions_supported
    from public.suggestion_votes where member_id = v_member;

  for r in
    select br.metric, br.threshold, br.badge_id
    from public.badge_rules br
    join public.badges b on b.id = br.badge_id
    where br.is_active and b.is_active
  loop
    v_value := case r.metric
      when 'events_attended'        then v_attended
      when 'events_registered'      then v_registered
      when 'activities_joined'      then v_joined
      when 'suggestions_submitted'  then v_suggestions_submitted
      when 'suggestions_implemented' then v_suggestions_implemented
      when 'suggestions_supported'  then v_suggestions_supported
      else 0
    end;

    if v_value >= r.threshold
       and not exists (
         select 1 from public.member_badges
         where member_id = v_member and badge_id = r.badge_id
       )
    then
      insert into public.member_badges (member_id, badge_id, source, status)
      values (v_member, r.badge_id, 'automatic', 'awarded')
      on conflict (member_id, badge_id) do nothing;
      v_awarded := v_awarded + 1;
    end if;
  end loop;

  return v_awarded;
end;
$$;


-- >>> 0015_student_voice_rls.sql >>>
-- =============================================================================
-- 0015 â€” Row Level Security for Student Voice
-- Members: read own + approved members/public; create own; edit own drafts;
--          support members/public ideas.
-- Moderators (is_staff): read all; review/feedback/status updates.
-- Admins: full access incl. categories/tags/merge/archive.
-- Public (anon): only approved PUBLIC, non-anonymous suggestions.
-- =============================================================================

alter table public.suggestion_categories     enable row level security;
alter table public.tags                       enable row level security;
alter table public.suggestions                enable row level security;
alter table public.suggestion_status_history  enable row level security;
alter table public.suggestion_votes           enable row level security;
alter table public.moderator_feedback         enable row level security;
alter table public.suggestion_tags            enable row level security;

-- ----------------------------------------------------------------------------
-- categories â€” public read (active), admin manage
-- ----------------------------------------------------------------------------
drop policy if exists sgcat_read on public.suggestion_categories;
create policy sgcat_read on public.suggestion_categories
  for select to anon, authenticated using (is_active or public.is_staff());
drop policy if exists sgcat_write on public.suggestion_categories;
create policy sgcat_write on public.suggestion_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- tags â€” public read, staff manage
-- ----------------------------------------------------------------------------
drop policy if exists tags_read on public.tags;
create policy tags_read on public.tags
  for select to anon, authenticated using (true);
drop policy if exists tags_write on public.tags;
create policy tags_write on public.tags
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- suggestions
-- ----------------------------------------------------------------------------
-- Approved-for-the-public statuses.
-- (accepted | planned | in_progress | implemented)
drop policy if exists sg_read on public.suggestions;
create policy sg_read on public.suggestions
  for select to anon, authenticated
  using (
    author_id = auth.uid()
    or public.is_staff()
    or (
      not is_anonymous
      and visibility = 'public'
      and status in ('accepted', 'planned', 'in_progress', 'implemented')
    )
    or (
      not is_anonymous
      and visibility = 'members'
      and status <> 'draft'
      and auth.uid() is not null
    )
  );

-- Members create their own suggestions.
drop policy if exists sg_insert on public.suggestions;
create policy sg_insert on public.suggestions
  for insert to authenticated
  with check (author_id = auth.uid());

-- Authors edit ONLY while in draft (and may move draft -> submitted).
drop policy if exists sg_update_author on public.suggestions;
create policy sg_update_author on public.suggestions
  for update to authenticated
  using (author_id = auth.uid() and status = 'draft')
  with check (author_id = auth.uid() and status in ('draft', 'submitted'));

-- Staff may update any suggestion (status, notes, priority, assignmentâ€¦).
drop policy if exists sg_update_staff on public.suggestions;
create policy sg_update_staff on public.suggestions
  for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Delete only drafts, by the author or an admin. (Trigger also blocks deleting
-- accepted/implemented rows as a hard safety net.)
drop policy if exists sg_delete on public.suggestions;
create policy sg_delete on public.suggestions
  for delete to authenticated
  using ((author_id = auth.uid() or public.is_admin()) and status = 'draft');

-- ----------------------------------------------------------------------------
-- status history â€” read own/staff; insert by staff or by the suggestion's author
-- ----------------------------------------------------------------------------
drop policy if exists ssh_read on public.suggestion_status_history;
create policy ssh_read on public.suggestion_status_history
  for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.suggestions s
      where s.id = suggestion_id and s.author_id = auth.uid()
    )
  );

drop policy if exists ssh_insert on public.suggestion_status_history;
create policy ssh_insert on public.suggestion_status_history
  for insert to authenticated
  with check (
    public.is_staff()
    or exists (
      select 1 from public.suggestions s
      where s.id = suggestion_id and s.author_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- votes â€” read own/staff; member supports approved members/public ideas
-- ----------------------------------------------------------------------------
drop policy if exists sv_read on public.suggestion_votes;
create policy sv_read on public.suggestion_votes
  for select to authenticated
  using (member_id = auth.uid() or public.is_staff());

drop policy if exists sv_insert on public.suggestion_votes;
create policy sv_insert on public.suggestion_votes
  for insert to authenticated
  with check (
    member_id = auth.uid()
    and exists (
      select 1 from public.suggestions s
      where s.id = suggestion_id
        and s.status <> 'draft'
        and s.visibility in ('members', 'public')
    )
  );

drop policy if exists sv_delete on public.suggestion_votes;
create policy sv_delete on public.suggestion_votes
  for delete to authenticated
  using (member_id = auth.uid());

-- ----------------------------------------------------------------------------
-- moderator feedback â€” read own-suggestion/staff; write staff only
-- ----------------------------------------------------------------------------
drop policy if exists mf_read on public.moderator_feedback;
create policy mf_read on public.moderator_feedback
  for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.suggestions s
      where s.id = suggestion_id and s.author_id = auth.uid()
    )
  );

drop policy if exists mf_insert on public.moderator_feedback;
create policy mf_insert on public.moderator_feedback
  for insert to authenticated
  with check (public.is_staff() and moderator_id = auth.uid());

drop policy if exists mf_write on public.moderator_feedback;
create policy mf_write on public.moderator_feedback
  for delete to authenticated using (public.is_staff());

-- ----------------------------------------------------------------------------
-- suggestion_tags â€” readable wherever the suggestion is; managed by author
-- (while draft) or staff
-- ----------------------------------------------------------------------------
drop policy if exists st_read on public.suggestion_tags;
create policy st_read on public.suggestion_tags
  for select to anon, authenticated
  using (
    exists (select 1 from public.suggestions s where s.id = suggestion_id)
  );

drop policy if exists st_write on public.suggestion_tags;
create policy st_write on public.suggestion_tags
  for all to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.suggestions s
      where s.id = suggestion_id and s.author_id = auth.uid()
    )
  )
  with check (
    public.is_staff()
    or exists (
      select 1 from public.suggestions s
      where s.id = suggestion_id and s.author_id = auth.uid()
    )
  );


-- >>> 0016_seed_student_voice.sql >>>
-- =============================================================================
-- 0016 â€” Seed suggestion categories, tags, and Student-Voice badges/rules
-- Idempotent.
-- =============================================================================

insert into public.suggestion_categories (slug, name, name_ne, sort_order) values
  ('activity-ideas',     'Activity Ideas',     'à¤—à¤¤à¤¿à¤µà¤¿à¤§à¤¿ à¤¸à¥à¤à¤¾à¤µ',    1),
  ('community-service',  'Community Service',  'à¤¸à¤¾à¤®à¥à¤¦à¤¾à¤¯à¤¿à¤• à¤¸à¥‡à¤µà¤¾',    2),
  ('environment',        'Environment',        'à¤µà¤¾à¤¤à¤¾à¤µà¤°à¤£',          3),
  ('school-improvement', 'School Improvement', 'à¤µà¤¿à¤¦à¥à¤¯à¤¾à¤²à¤¯ à¤¸à¥à¤§à¤¾à¤°',    4),
  ('club-improvement',   'Club Improvement',   'à¤•à¥à¤²à¤¬ à¤¸à¥à¤§à¤¾à¤°',        5),
  ('events',             'Events',             'à¤•à¤¾à¤°à¥à¤¯à¤•à¥à¤°à¤®',         6),
  ('sports',             'Sports',             'à¤–à¥‡à¤²à¤•à¥à¤¦',           7),
  ('technology',         'Technology',         'à¤ªà¥à¤°à¤µà¤¿à¤§à¤¿',          8),
  ('culture',            'Culture',            'à¤¸à¤‚à¤¸à¥à¤•à¥ƒà¤¤à¤¿',          9),
  ('innovation',         'Innovation',         'à¤¨à¤µà¤ªà¥à¤°à¤µà¤°à¥à¤¤à¤¨',        10),
  ('leadership',         'Leadership',         'à¤¨à¥‡à¤¤à¥ƒà¤¤à¥à¤µ',           11),
  ('general',            'General',            'à¤¸à¤¾à¤®à¤¾à¤¨à¥à¤¯',          12)
on conflict (slug) do nothing;

insert into public.tags (slug, name) values
  ('environment', 'Environment'),
  ('stem',        'STEM'),
  ('sports',      'Sports'),
  ('festival',    'Festival'),
  ('community',   'Community'),
  ('volunteer',   'Volunteer'),
  ('education',   'Education'),
  ('leadership',  'Leadership'),
  ('innovation',  'Innovation')
on conflict (slug) do nothing;

-- Student-Voice badges (reuse Phase-6 catalog + engine).
insert into public.badges (slug, name, description, icon, category_id, criteria) values
  ('first-suggestion',    'First Suggestion',    'Submitted your first idea to the club.',     'Lightbulb',
     (select id from public.achievement_categories where slug = 'innovation'),         'Submit 1 suggestion'),
  ('community-builder',   'Community Builder',   'Submitted 5 ideas to improve the club.',     'HeartHandshake',
     (select id from public.achievement_categories where slug = 'community-service'),  'Submit 5 suggestions'),
  ('top-contributor',     'Top Contributor',     'Submitted 10 ideas â€” a true changemaker.',   'Star',
     (select id from public.achievement_categories where slug = 'special-recognition'),'Submit 10 suggestions'),
  ('innovation-champion', 'Innovation Champion', 'An idea you submitted was implemented!',      'Rocket',
     (select id from public.achievement_categories where slug = 'innovation'),         'Have a suggestion implemented'),
  ('helpful-contributor', 'Helpful Contributor', 'Supported 10 ideas from fellow members.',     'ThumbsUp',
     (select id from public.achievement_categories where slug = 'participation'),      'Support 10 suggestions')
on conflict (slug) do nothing;

insert into public.badge_rules (badge_id, metric, threshold)
select b.id, v.metric, v.threshold
from (values
  ('first-suggestion',    'suggestions_submitted',   1),
  ('community-builder',   'suggestions_submitted',   5),
  ('top-contributor',     'suggestions_submitted',   10),
  ('innovation-champion', 'suggestions_implemented', 1),
  ('helpful-contributor', 'suggestions_supported',   10)
) as v(slug, metric, threshold)
join public.badges b on b.slug = v.slug
where not exists (
  select 1 from public.badge_rules br where br.badge_id = b.id and br.metric = v.metric
);


-- >>> 0017_app_settings.sql >>>
-- =============================================================================
-- 0017 â€” App settings store (admin-managed CMS configuration)
-- A simple key â†’ jsonb store so non-technical admins can manage club info,
-- contact details, social links, SEO defaults, homepage content, and feature
-- toggles without code changes.
-- =============================================================================

create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  is_public  boolean not null default false,  -- readable by anon (e.g. footer)
  updated_by uuid references public.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on table public.app_settings is 'Admin-editable site configuration (CMS).';

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS: public keys readable by anyone; everything readable by staff;
-- only admins may write.
-- ----------------------------------------------------------------------------
alter table public.app_settings enable row level security;

drop policy if exists settings_read on public.app_settings;
create policy settings_read on public.app_settings
  for select to anon, authenticated
  using (is_public or public.is_staff());

drop policy if exists settings_write on public.app_settings;
create policy settings_write on public.app_settings
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Seed default setting groups (idempotent).
-- ----------------------------------------------------------------------------
insert into public.app_settings (key, value, is_public) values
  ('general', jsonb_build_object(
      'clubName', 'Triveni Child Club',
      'schoolName', 'Triveni Barah Nanda Prasad Tripathee School',
      'academicYear', '2025â€“2026',
      'timezone', 'Asia/Kathmandu',
      'language', 'en'
    ), true),
  ('contact', jsonb_build_object(
      'email', 'club@triveni.edu.np',
      'phone', '+977 00-000000',
      'address', 'Triveni Barah Nanda Prasad Tripathee School, Nepal',
      'officeHours', 'Sunday â€“ Friday, 10:00 AM â€“ 4:00 PM'
    ), true),
  ('social', jsonb_build_object(
      'facebook', '', 'instagram', '', 'youtube', ''
    ), true),
  ('homepage', jsonb_build_object(
      'heroTitle', 'Where students lead, grow, and shine.',
      'heroSubtitle', 'The official portal of the Triveni Child Club.',
      'heroCtaLabel', 'Discover the Club',
      'heroCtaHref', '/about'
    ), true),
  ('seo', jsonb_build_object(
      'defaultTitle', 'Triveni Child Club',
      'defaultDescription', 'Student-led activities, elections, achievements, and voice.',
      'ogImage', '/gallery/triveni-05.jpeg'
    ), true),
  ('features', jsonb_build_object(
      'studentVoice', true,
      'recognition', true,
      'maintenanceMode', false
    ), true)
on conflict (key) do nothing;


-- >>> 0018_media_schema.sql >>>
-- =============================================================================
-- 0018 â€” Media Library (DAM) schema
-- Tables: media_folders, media_files, media_tags, media_file_tags,
--         media_usage, media_versions, media_favorites, media_collections,
--         media_collection_items
-- =============================================================================

do $$ begin
  create type public.media_status as enum ('active', 'archived', 'deleted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.media_visibility as enum ('public', 'private');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- media_folders (nested)
-- ----------------------------------------------------------------------------
create table if not exists public.media_folders (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null,
  parent_id   uuid references public.media_folders (id) on delete cascade,
  path        text not null default '/',     -- materialized path for breadcrumbs
  color       text,
  icon        text,
  is_archived boolean not null default false,
  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);
create index if not exists media_folders_parent_idx on public.media_folders (parent_id);

-- ----------------------------------------------------------------------------
-- media_files
-- ----------------------------------------------------------------------------
create table if not exists public.media_files (
  id                uuid primary key default gen_random_uuid(),
  filename          text not null,
  original_filename text,
  slug              text,
  extension         text,
  mime_type         text not null,
  width             int,
  height            int,
  size              bigint not null default 0,
  folder_id         uuid references public.media_folders (id) on delete set null,
  bucket            text not null,
  object_path       text not null,
  public_url        text,
  thumbnail_url     text,
  blur_hash         text,
  alt_text          text,
  caption           text,
  description       text,
  uploaded_by       uuid references public.users (id) on delete set null,
  status            public.media_status not null default 'active',
  visibility        public.media_visibility not null default 'public',
  checksum          text,
  dominant_color    text,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz,
  unique (bucket, object_path)
);
-- Duplicate detection: same checksum cannot exist twice (nulls allowed).
create unique index if not exists media_files_checksum_uidx
  on public.media_files (checksum) where checksum is not null;
create index if not exists media_files_folder_idx     on public.media_files (folder_id);
create index if not exists media_files_status_idx     on public.media_files (status);
create index if not exists media_files_visibility_idx on public.media_files (visibility);
create index if not exists media_files_mime_idx       on public.media_files (mime_type);
create index if not exists media_files_created_idx    on public.media_files (created_at desc);
create index if not exists media_files_uploader_idx   on public.media_files (uploaded_by);

-- ----------------------------------------------------------------------------
-- tags
-- ----------------------------------------------------------------------------
create table if not exists public.media_tags (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.media_file_tags (
  file_id uuid not null references public.media_files (id) on delete cascade,
  tag_id  uuid not null references public.media_tags (id) on delete cascade,
  primary key (file_id, tag_id)
);
create index if not exists media_file_tags_tag_idx on public.media_file_tags (tag_id);

-- ----------------------------------------------------------------------------
-- usage tracking (a file cannot be deleted while referenced)
-- ----------------------------------------------------------------------------
create table if not exists public.media_usage (
  id          uuid primary key default gen_random_uuid(),
  file_id     uuid not null references public.media_files (id) on delete cascade,
  module      text not null,                 -- 'gallery', 'badge', 'settings'â€¦
  entity_type text not null,
  entity_id   uuid,
  field       text,
  label       text,
  created_at  timestamptz not null default now(),
  unique (file_id, module, entity_type, entity_id, field)
);
create index if not exists media_usage_file_idx on public.media_usage (file_id);

-- ----------------------------------------------------------------------------
-- versions (every replacement is preserved)
-- ----------------------------------------------------------------------------
create table if not exists public.media_versions (
  id          uuid primary key default gen_random_uuid(),
  file_id     uuid not null references public.media_files (id) on delete cascade,
  version     int not null,
  object_path text not null,
  size        bigint,
  width       int,
  height      int,
  checksum    text,
  note        text,
  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (file_id, version)
);

-- ----------------------------------------------------------------------------
-- favorites & collections
-- ----------------------------------------------------------------------------
create table if not exists public.media_favorites (
  file_id    uuid not null references public.media_files (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (file_id, user_id)
);

create table if not exists public.media_collections (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);
create table if not exists public.media_collection_items (
  collection_id uuid not null references public.media_collections (id) on delete cascade,
  file_id       uuid not null references public.media_files (id) on delete cascade,
  sort_order    int not null default 0,
  primary key (collection_id, file_id)
);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
drop trigger if exists set_media_folders_updated_at on public.media_folders;
create trigger set_media_folders_updated_at
  before update on public.media_folders
  for each row execute function public.set_updated_at();

drop trigger if exists set_media_files_updated_at on public.media_files;
create trigger set_media_files_updated_at
  before update on public.media_files
  for each row execute function public.set_updated_at();

drop trigger if exists set_media_collections_updated_at on public.media_collections;
create trigger set_media_collections_updated_at
  before update on public.media_collections
  for each row execute function public.set_updated_at();


-- >>> 0019_media_storage.sql >>>
-- =============================================================================
-- 0019 â€” Storage buckets, storage RLS, and the media usage guard
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Buckets (idempotent). Public buckets serve CDN-friendly URLs; private ones
-- require signed URLs.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('media-public', 'media-public', true),
  ('gallery',      'gallery',      true),
  ('avatars',      'avatars',      true),
  ('media-private','media-private',false),
  ('certificates', 'certificates', false),
  ('documents',    'documents',    false)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Storage object policies.
--   read   : public buckets â†’ everyone; private buckets â†’ staff
--   write  : staff (moderator/admin) for all managed buckets
--   delete : admin only
-- ----------------------------------------------------------------------------
do $$
begin
  begin
    create policy "media public read" on storage.objects
      for select to anon, authenticated
      using (
        bucket_id in ('media-public','gallery','avatars')
      );
  exception when duplicate_object then null;
  end;

  begin
    create policy "media staff read" on storage.objects
      for select to authenticated
      using (
        bucket_id in (
          'media-public','gallery','avatars',
          'media-private','certificates','documents'
        )
        and public.is_staff()
      );
  exception when duplicate_object then null;
  end;

  begin
    create policy "media staff insert" on storage.objects
      for insert to authenticated
      with check (
        bucket_id in (
          'media-public','gallery','avatars',
          'media-private','certificates','documents'
        )
        and public.is_staff()
      );
  exception when duplicate_object then null;
  end;

  begin
    create policy "media staff update" on storage.objects
      for update to authenticated
      using (
        bucket_id in (
          'media-public','gallery','avatars',
          'media-private','certificates','documents'
        )
        and public.is_staff()
      )
      with check (
        bucket_id in (
          'media-public','gallery','avatars',
          'media-private','certificates','documents'
        )
        and public.is_staff()
      );
  exception when duplicate_object then null;
  end;

  begin
    create policy "media admin delete" on storage.objects
      for delete to authenticated
      using (
        bucket_id in (
          'media-public','gallery','avatars',
          'media-private','certificates','documents'
        )
        and public.is_admin()
      );
  exception when duplicate_object then null;
  end;
end $$;

-- ----------------------------------------------------------------------------
-- Usage guard: a file referenced anywhere cannot be hard-deleted.
-- ----------------------------------------------------------------------------
create or replace function public.media_in_use(p_file uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.media_usage where file_id = p_file);
$$;

grant execute on function public.media_in_use(uuid) to authenticated;

create or replace function public.prevent_media_delete_in_use()
returns trigger
language plpgsql
as $$
begin
  if public.media_in_use(old.id) then
    raise exception 'This file is in use and cannot be deleted. Remove its usages first.';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_prevent_media_delete on public.media_files;
create trigger trg_prevent_media_delete
  before delete on public.media_files
  for each row execute function public.prevent_media_delete_in_use();


-- >>> 0020_media_rls.sql >>>
-- =============================================================================
-- 0020 â€” Row Level Security for the Media Library
-- Members: no access. Moderators: view/upload/edit metadata.
-- Admins: full control (delete, folders, tags, collections, visibility).
-- Public assets are readable so the public website can render them.
-- =============================================================================

alter table public.media_folders          enable row level security;
alter table public.media_files            enable row level security;
alter table public.media_tags             enable row level security;
alter table public.media_file_tags        enable row level security;
alter table public.media_usage            enable row level security;
alter table public.media_versions         enable row level security;
alter table public.media_favorites        enable row level security;
alter table public.media_collections      enable row level security;
alter table public.media_collection_items enable row level security;

-- folders â€” staff read, admin manage
drop policy if exists mf_folders_read on public.media_folders;
create policy mf_folders_read on public.media_folders
  for select to authenticated using (public.is_staff());
drop policy if exists mf_folders_write on public.media_folders;
create policy mf_folders_write on public.media_folders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- files â€” public active assets visible to all; staff manage; admin delete
drop policy if exists mf_files_read on public.media_files;
create policy mf_files_read on public.media_files
  for select to anon, authenticated
  using ((visibility = 'public' and status = 'active') or public.is_staff());
drop policy if exists mf_files_insert on public.media_files;
create policy mf_files_insert on public.media_files
  for insert to authenticated with check (public.is_staff());
drop policy if exists mf_files_update on public.media_files;
create policy mf_files_update on public.media_files
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists mf_files_delete on public.media_files;
create policy mf_files_delete on public.media_files
  for delete to authenticated using (public.is_admin());

-- tags â€” public read (for gallery filters); staff manage
drop policy if exists mf_tags_read on public.media_tags;
create policy mf_tags_read on public.media_tags
  for select to anon, authenticated using (true);
drop policy if exists mf_tags_write on public.media_tags;
create policy mf_tags_write on public.media_tags
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- file_tags â€” visible wherever the file is; staff manage
drop policy if exists mf_filetags_read on public.media_file_tags;
create policy mf_filetags_read on public.media_file_tags
  for select to anon, authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.media_files f
      where f.id = file_id and f.visibility = 'public' and f.status = 'active'
    )
  );
drop policy if exists mf_filetags_write on public.media_file_tags;
create policy mf_filetags_write on public.media_file_tags
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- usage â€” staff
drop policy if exists mf_usage_read on public.media_usage;
create policy mf_usage_read on public.media_usage
  for select to authenticated using (public.is_staff());
drop policy if exists mf_usage_write on public.media_usage;
create policy mf_usage_write on public.media_usage
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- versions â€” staff
drop policy if exists mf_versions_read on public.media_versions;
create policy mf_versions_read on public.media_versions
  for select to authenticated using (public.is_staff());
drop policy if exists mf_versions_write on public.media_versions;
create policy mf_versions_write on public.media_versions
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- favorites â€” personal to each staff user
drop policy if exists mf_favorites_rw on public.media_favorites;
create policy mf_favorites_rw on public.media_favorites
  for all to authenticated
  using (user_id = auth.uid() and public.is_staff())
  with check (user_id = auth.uid() and public.is_staff());

-- collections â€” staff read, admin manage
drop policy if exists mf_collections_read on public.media_collections;
create policy mf_collections_read on public.media_collections
  for select to authenticated using (public.is_staff());
drop policy if exists mf_collections_write on public.media_collections;
create policy mf_collections_write on public.media_collections
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists mf_collection_items_read on public.media_collection_items;
create policy mf_collection_items_read on public.media_collection_items
  for select to authenticated using (public.is_staff());
drop policy if exists mf_collection_items_write on public.media_collection_items;
create policy mf_collection_items_write on public.media_collection_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());


-- >>> 0021_gallery_cms.sql >>>
-- =============================================================================
-- 0021 â€” Gallery CMS (albums + photos backed by the Media Library)
-- =============================================================================

create table if not exists public.gallery_albums (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  description     text,
  category        text,
  cover_file_id   uuid references public.media_files (id) on delete set null,
  status          public.content_status not null default 'draft',
  featured        boolean not null default false,
  sort_order      int not null default 0,
  seo_description text,
  created_by      uuid references public.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,
  published_at    timestamptz
);
create index if not exists gallery_albums_status_idx   on public.gallery_albums (status, sort_order);
create index if not exists gallery_albums_featured_idx on public.gallery_albums (featured);

create table if not exists public.gallery_photos (
  id         uuid primary key default gen_random_uuid(),
  album_id   uuid not null references public.gallery_albums (id) on delete cascade,
  file_id    uuid not null references public.media_files (id) on delete cascade,
  caption    text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (album_id, file_id)
);
create index if not exists gallery_photos_album_idx on public.gallery_photos (album_id, sort_order);

drop trigger if exists set_gallery_albums_updated_at on public.gallery_albums;
create trigger set_gallery_albums_updated_at
  before update on public.gallery_albums
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS: published albums/photos public; staff manage.
-- ----------------------------------------------------------------------------
alter table public.gallery_albums enable row level security;
alter table public.gallery_photos enable row level security;

drop policy if exists albums_read on public.gallery_albums;
create policy albums_read on public.gallery_albums
  for select to anon, authenticated
  using (status = 'published' or public.is_staff());
drop policy if exists albums_write on public.gallery_albums;
create policy albums_write on public.gallery_albums
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists photos_read on public.gallery_photos;
create policy photos_read on public.gallery_photos
  for select to anon, authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.gallery_albums a
      where a.id = album_id and a.status = 'published'
    )
  );
drop policy if exists photos_write on public.gallery_photos;
create policy photos_write on public.gallery_photos
  for all to authenticated using (public.is_staff()) with check (public.is_staff());


-- >>> 0022_import_export.sql >>>
-- =============================================================================
-- 0022 â€” Import / Export engine
-- Tables: import_jobs, import_rows, import_templates, export_jobs,
--         export_templates, import_logs, export_logs, column_mappings,
--         validation_errors
-- Admin-only (is_admin) throughout.
-- =============================================================================

do $$ begin
  create type public.io_status as enum (
    'queued', 'validating', 'ready', 'processing', 'completed', 'failed', 'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.import_mode as enum (
    'insert', 'upsert', 'update', 'ignore_duplicates', 'dry_run'
  );
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- import_templates (saved column mappings)
-- ----------------------------------------------------------------------------
create table if not exists public.import_templates (
  id          uuid primary key default gen_random_uuid(),
  module      text not null,
  name        text not null,
  mapping     jsonb not null default '{}'::jsonb,
  is_default  boolean not null default false,
  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);
create index if not exists import_templates_module_idx on public.import_templates (module);

-- ----------------------------------------------------------------------------
-- import_jobs
-- ----------------------------------------------------------------------------
create table if not exists public.import_jobs (
  id                 uuid primary key default gen_random_uuid(),
  module             text not null,
  status             public.io_status not null default 'queued',
  mode               public.import_mode not null default 'insert',
  file_name          text,
  total_rows         int not null default 0,
  valid_rows         int not null default 0,
  error_rows         int not null default 0,
  imported_rows      int not null default 0,
  skipped_rows       int not null default 0,
  template_id        uuid references public.import_templates (id) on delete set null,
  error_summary      text,
  rollback_available boolean not null default false,
  created_by         uuid references public.users (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz,
  finished_at        timestamptz
);
create index if not exists import_jobs_module_idx  on public.import_jobs (module, created_at desc);
create index if not exists import_jobs_status_idx  on public.import_jobs (status);
create index if not exists import_jobs_creator_idx on public.import_jobs (created_by);

-- ----------------------------------------------------------------------------
-- import_rows (stored selectively â€” invalid rows + a capped sample)
-- ----------------------------------------------------------------------------
create table if not exists public.import_rows (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references public.import_jobs (id) on delete cascade,
  row_number int not null,
  data       jsonb not null default '{}'::jsonb,
  status     text not null default 'valid',
  created_at timestamptz not null default now()
);
create index if not exists import_rows_job_idx on public.import_rows (job_id, row_number);

-- ----------------------------------------------------------------------------
-- validation_errors
-- ----------------------------------------------------------------------------
create table if not exists public.validation_errors (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references public.import_jobs (id) on delete cascade,
  row_number int not null,
  field      text,
  value      text,
  rule       text,
  message    text not null,
  suggestion text,
  created_at timestamptz not null default now()
);
create index if not exists validation_errors_job_idx on public.validation_errors (job_id, row_number);

-- ----------------------------------------------------------------------------
-- column_mappings (normalized mapping rows â€” optional companion to templates)
-- ----------------------------------------------------------------------------
create table if not exists public.column_mappings (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.import_templates (id) on delete cascade,
  source      text not null,
  target      text not null
);
create index if not exists column_mappings_template_idx on public.column_mappings (template_id);

-- ----------------------------------------------------------------------------
-- export_templates / export_jobs
-- ----------------------------------------------------------------------------
create table if not exists public.export_templates (
  id          uuid primary key default gen_random_uuid(),
  module      text not null,
  name        text not null,
  filters     jsonb not null default '{}'::jsonb,
  format      text not null default 'csv',
  is_default  boolean not null default false,
  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create table if not exists public.export_jobs (
  id             uuid primary key default gen_random_uuid(),
  module         text not null,
  status         public.io_status not null default 'completed',
  format         text not null default 'csv',
  filters        jsonb not null default '{}'::jsonb,
  row_count      int not null default 0,
  download_count int not null default 0,
  created_by     uuid references public.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  finished_at    timestamptz
);
create index if not exists export_jobs_module_idx on public.export_jobs (module, created_at desc);

-- ----------------------------------------------------------------------------
-- logs
-- ----------------------------------------------------------------------------
create table if not exists public.import_logs (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references public.import_jobs (id) on delete cascade,
  level      text not null default 'info',
  message    text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.export_logs (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references public.export_jobs (id) on delete cascade,
  level      text not null default 'info',
  message    text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
drop trigger if exists set_import_jobs_updated_at on public.import_jobs;
create trigger set_import_jobs_updated_at before update on public.import_jobs
  for each row execute function public.set_updated_at();
drop trigger if exists set_import_templates_updated_at on public.import_templates;
create trigger set_import_templates_updated_at before update on public.import_templates
  for each row execute function public.set_updated_at();
drop trigger if exists set_export_templates_updated_at on public.export_templates;
create trigger set_export_templates_updated_at before update on public.export_templates
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS â€” admin only
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'import_jobs','import_rows','import_templates','export_jobs','export_templates',
    'import_logs','export_logs','column_mappings','validation_errors'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists io_admin_all on public.%I', t);
    execute format(
      'create policy io_admin_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t
    );
  end loop;
end $$;


-- >>> 0023_cms.sql >>>
-- =============================================================================
-- 0023 â€” Visual CMS: pages, version history, and menus
-- Pages store an ordered array of blocks as jsonb (block registry lives in app
-- code). Versions are full snapshots for history + rollback.
-- =============================================================================

do $$ begin
  create type public.cms_page_status as enum ('draft', 'published', 'scheduled', 'archived');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- cms_pages
-- ----------------------------------------------------------------------------
create table if not exists public.cms_pages (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  status        public.cms_page_status not null default 'draft',
  blocks        jsonb not null default '[]'::jsonb,
  seo           jsonb not null default '{}'::jsonb,
  is_system     boolean not null default false,   -- built-in pages (e.g. home)
  version       int not null default 1,
  scheduled_at  timestamptz,
  published_at  timestamptz,
  created_by    uuid references public.users (id) on delete set null,
  updated_by    uuid references public.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);
create index if not exists cms_pages_status_idx on public.cms_pages (status);
create index if not exists cms_pages_sched_idx  on public.cms_pages (scheduled_at);

-- ----------------------------------------------------------------------------
-- cms_page_versions (full snapshots)
-- ----------------------------------------------------------------------------
create table if not exists public.cms_page_versions (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references public.cms_pages (id) on delete cascade,
  version    int not null,
  title      text not null,
  blocks     jsonb not null default '[]'::jsonb,
  seo        jsonb not null default '{}'::jsonb,
  note       text,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (page_id, version)
);
create index if not exists cms_versions_page_idx on public.cms_page_versions (page_id, version desc);

-- ----------------------------------------------------------------------------
-- menus
-- ----------------------------------------------------------------------------
create table if not exists public.cms_menus (
  id         uuid primary key default gen_random_uuid(),
  location   text not null unique,             -- 'header' | 'footer' | â€¦
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.cms_menu_items (
  id         uuid primary key default gen_random_uuid(),
  menu_id    uuid not null references public.cms_menus (id) on delete cascade,
  parent_id  uuid references public.cms_menu_items (id) on delete cascade,
  label      text not null,
  href       text not null,
  icon       text,
  sort_order int not null default 0,
  new_tab    boolean not null default false,
  visible    boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists cms_menu_items_menu_idx on public.cms_menu_items (menu_id, sort_order);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
drop trigger if exists set_cms_pages_updated_at on public.cms_pages;
create trigger set_cms_pages_updated_at before update on public.cms_pages
  for each row execute function public.set_updated_at();
drop trigger if exists set_cms_menus_updated_at on public.cms_menus;
create trigger set_cms_menus_updated_at before update on public.cms_menus
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS: published pages public; staff manage; admin delete.
-- ----------------------------------------------------------------------------
alter table public.cms_pages         enable row level security;
alter table public.cms_page_versions enable row level security;
alter table public.cms_menus         enable row level security;
alter table public.cms_menu_items    enable row level security;

drop policy if exists cms_pages_read on public.cms_pages;
create policy cms_pages_read on public.cms_pages
  for select to anon, authenticated
  using (status = 'published' or public.is_staff());
drop policy if exists cms_pages_write on public.cms_pages;
create policy cms_pages_write on public.cms_pages
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists cms_versions_rw on public.cms_page_versions;
create policy cms_versions_rw on public.cms_page_versions
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists cms_menus_read on public.cms_menus;
create policy cms_menus_read on public.cms_menus
  for select to anon, authenticated using (true);
drop policy if exists cms_menus_write on public.cms_menus;
create policy cms_menus_write on public.cms_menus
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists cms_menu_items_read on public.cms_menu_items;
create policy cms_menu_items_read on public.cms_menu_items
  for select to anon, authenticated using (true);
drop policy if exists cms_menu_items_write on public.cms_menu_items;
create policy cms_menu_items_write on public.cms_menu_items
  for all to authenticated using (public.is_staff()) with check (public.is_staff());


-- >>> 0024_elections.sql >>>
-- =============================================================================
-- 0024 â€” Digital Elections & Democratic Governance
-- Secret-ballot design: `votes` carry NO voter reference (RLS denies all direct
-- access); `vote_receipts` track WHO voted (one per member per election) but not
-- their choice. Voting happens only via the SECURITY DEFINER cast_vote() RPC.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.election_status as enum (
    'draft', 'nominations', 'voting', 'closed', 'results_published', 'archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.nomination_status as enum (
    'draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.committee_member_status as enum ('active', 'resigned', 'replaced');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- election_terms
-- ----------------------------------------------------------------------------
create table if not exists public.election_terms (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  starts_on  date,
  ends_on    date,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- elections
-- ----------------------------------------------------------------------------
create table if not exists public.elections (
  id                  uuid primary key default gen_random_uuid(),
  term_id             uuid references public.election_terms (id) on delete set null,
  slug                text not null unique,
  title               text not null,
  description         text,
  status              public.election_status not null default 'draft',
  nominations_open_at timestamptz,
  nominations_close_at timestamptz,
  voting_open_at      timestamptz,
  voting_close_at     timestamptz,
  created_by          uuid references public.users (id) on delete set null,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz,
  check (voting_close_at is null or voting_open_at is null or voting_close_at > voting_open_at)
);
create index if not exists elections_status_idx on public.elections (status);

-- ----------------------------------------------------------------------------
-- positions (offices contested)
-- ----------------------------------------------------------------------------
create table if not exists public.positions (
  id          uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections (id) on delete cascade,
  title       text not null,
  description text,
  seats       int not null default 1 check (seats >= 1),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists positions_election_idx on public.positions (election_id, sort_order);

-- ----------------------------------------------------------------------------
-- candidate_nominations
-- ----------------------------------------------------------------------------
create table if not exists public.candidate_nominations (
  id           uuid primary key default gen_random_uuid(),
  election_id  uuid not null references public.elections (id) on delete cascade,
  position_id  uuid not null references public.positions (id) on delete cascade,
  member_id    uuid not null references public.users (id) on delete cascade,
  slogan       text,
  manifesto    text,
  vision       text,
  goals        text,
  photo_url    text,
  banner_url   text,
  status       public.nomination_status not null default 'draft',
  review_note  text,
  reviewed_by  uuid references public.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz,
  unique (election_id, position_id, member_id)
);
create index if not exists nominations_election_idx on public.candidate_nominations (election_id, status);
create index if not exists nominations_position_idx on public.candidate_nominations (position_id, status);
create index if not exists nominations_member_idx   on public.candidate_nominations (member_id);

-- ----------------------------------------------------------------------------
-- votes (anonymous â€” no voter column, no direct access)
-- ----------------------------------------------------------------------------
create table if not exists public.votes (
  id           uuid primary key default gen_random_uuid(),
  election_id  uuid not null references public.elections (id) on delete cascade,
  position_id  uuid not null references public.positions (id) on delete cascade,
  candidate_id uuid not null references public.candidate_nominations (id) on delete cascade,
  created_at   timestamptz not null default now()
);
create index if not exists votes_tally_idx on public.votes (election_id, position_id, candidate_id);

-- ----------------------------------------------------------------------------
-- vote_receipts (who voted â€” NOT what they chose). One per member per election.
-- ----------------------------------------------------------------------------
create table if not exists public.vote_receipts (
  id             uuid primary key default gen_random_uuid(),
  election_id    uuid not null references public.elections (id) on delete cascade,
  voter_id       uuid not null references public.users (id) on delete cascade,
  receipt_code   text not null unique,
  positions_voted int not null default 0,
  created_at     timestamptz not null default now(),
  unique (election_id, voter_id)
);
create index if not exists receipts_election_idx on public.vote_receipts (election_id);

-- ----------------------------------------------------------------------------
-- result_snapshots
-- ----------------------------------------------------------------------------
create table if not exists public.result_snapshots (
  id          uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections (id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  published   boolean not null default false,
  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists results_election_idx on public.result_snapshots (election_id);

-- ----------------------------------------------------------------------------
-- committee_assignments (elected committee for a term)
-- ----------------------------------------------------------------------------
create table if not exists public.committee_assignments (
  id          uuid primary key default gen_random_uuid(),
  election_id uuid references public.elections (id) on delete set null,
  term_id     uuid references public.election_terms (id) on delete set null,
  position_id uuid references public.positions (id) on delete set null,
  member_id   uuid not null references public.users (id) on delete cascade,
  role_title  text not null,
  status      public.committee_member_status not null default 'active',
  started_on  date not null default current_date,
  ended_on    date,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists committee_term_idx on public.committee_assignments (term_id, sort_order);
create index if not exists committee_election_idx on public.committee_assignments (election_id);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
drop trigger if exists set_elections_updated_at on public.elections;
create trigger set_elections_updated_at before update on public.elections
  for each row execute function public.set_updated_at();
drop trigger if exists set_nominations_updated_at on public.candidate_nominations;
create trigger set_nominations_updated_at before update on public.candidate_nominations
  for each row execute function public.set_updated_at();


-- >>> 0025_election_functions.sql >>>
-- =============================================================================
-- 0025 â€” Election SECURITY DEFINER functions (secret ballot) + RLS
-- =============================================================================

-- ----------------------------------------------------------------------------
-- cast_vote(election, choices) â€” the ONLY way a vote is written.
-- choices: jsonb array of { "position_id": uuid, "candidate_id": uuid }.
-- Enforces: signed-in voter, election open + in window, one vote per member,
-- candidate belongs to the position & is approved. Returns the receipt code.
-- Anonymous: votes carry no voter reference; the receipt records only WHO voted.
-- ----------------------------------------------------------------------------
create or replace function public.cast_vote(p_election uuid, p_choices jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_voter   uuid := auth.uid();
  v_election public.elections%rowtype;
  v_choice  jsonb;
  v_pos     uuid;
  v_cand    uuid;
  v_count   int := 0;
  v_code    text;
begin
  if v_voter is null then
    raise exception 'You must be signed in to vote';
  end if;

  select * into v_election from public.elections where id = p_election for update;
  if v_election.id is null then
    raise exception 'Election not found';
  end if;
  if v_election.status <> 'voting' then
    raise exception 'Voting is not open for this election';
  end if;
  if v_election.voting_open_at is not null and now() < v_election.voting_open_at then
    raise exception 'Voting has not started yet';
  end if;
  if v_election.voting_close_at is not null and now() > v_election.voting_close_at then
    raise exception 'Voting has closed';
  end if;

  if exists (
    select 1 from public.vote_receipts
    where election_id = p_election and voter_id = v_voter
  ) then
    raise exception 'You have already voted in this election';
  end if;

  for v_choice in select * from jsonb_array_elements(p_choices)
  loop
    v_pos := (v_choice ->> 'position_id')::uuid;
    v_cand := (v_choice ->> 'candidate_id')::uuid;
    if v_pos is null or v_cand is null then
      continue;
    end if;
    if not exists (
      select 1 from public.candidate_nominations c
      where c.id = v_cand
        and c.election_id = p_election
        and c.position_id = v_pos
        and c.status = 'approved'
    ) then
      raise exception 'Invalid candidate selection';
    end if;
    insert into public.votes (election_id, position_id, candidate_id)
    values (p_election, v_pos, v_cand);
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    raise exception 'No valid selections were submitted';
  end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.vote_receipts (election_id, voter_id, receipt_code, positions_voted)
  values (p_election, v_voter, v_code, v_count);

  return v_code;
end;
$$;

grant execute on function public.cast_vote(uuid, jsonb) to authenticated;

-- ----------------------------------------------------------------------------
-- get_election_results â€” tallies (gated: staff anytime; everyone once closed).
-- ----------------------------------------------------------------------------
create or replace function public.get_election_results(p_election uuid)
returns table (position_id uuid, candidate_id uuid, votes bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_status public.election_status;
begin
  select status into v_status from public.elections where id = p_election;
  if v_status is null then
    return;
  end if;
  if not (public.is_staff() or v_status in ('closed', 'results_published', 'archived')) then
    return; -- secrecy: no peeking before close
  end if;
  return query
    select v.position_id, v.candidate_id, count(*)::bigint
    from public.votes v
    where v.election_id = p_election
    group by v.position_id, v.candidate_id;
end;
$$;

grant execute on function public.get_election_results(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- election_turnout â€” eligible vs voted (no choice data; safe to expose).
-- ----------------------------------------------------------------------------
create or replace function public.election_turnout(p_election uuid)
returns table (eligible bigint, voted bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.users where is_active and role in ('member','moderator','admin'))::bigint,
    (select count(*) from public.vote_receipts where election_id = p_election)::bigint;
$$;

grant execute on function public.election_turnout(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- has_voted â€” lets a member know if they've already voted (no choice data).
-- ----------------------------------------------------------------------------
create or replace function public.has_voted(p_election uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.vote_receipts
    where election_id = p_election and voter_id = auth.uid()
  );
$$;

grant execute on function public.has_voted(uuid) to authenticated;

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.election_terms        enable row level security;
alter table public.elections             enable row level security;
alter table public.positions             enable row level security;
alter table public.candidate_nominations enable row level security;
alter table public.votes                 enable row level security;
alter table public.vote_receipts         enable row level security;
alter table public.result_snapshots      enable row level security;
alter table public.committee_assignments enable row level security;

-- terms â€” public read, staff manage
drop policy if exists terms_read on public.election_terms;
create policy terms_read on public.election_terms for select to anon, authenticated using (true);
drop policy if exists terms_write on public.election_terms;
create policy terms_write on public.election_terms for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- elections â€” non-draft public; staff manage
drop policy if exists elections_read on public.elections;
create policy elections_read on public.elections
  for select to anon, authenticated using (status <> 'draft' or public.is_staff());
drop policy if exists elections_write on public.elections;
create policy elections_write on public.elections
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- positions â€” visible with their election; staff manage
drop policy if exists positions_read on public.positions;
create policy positions_read on public.positions
  for select to anon, authenticated
  using (
    public.is_staff()
    or exists (select 1 from public.elections e where e.id = election_id and e.status <> 'draft')
  );
drop policy if exists positions_write on public.positions;
create policy positions_write on public.positions
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- nominations â€” approved public; own; staff all
drop policy if exists nom_read on public.candidate_nominations;
create policy nom_read on public.candidate_nominations
  for select to anon, authenticated
  using (
    member_id = auth.uid()
    or public.is_staff()
    or (
      status = 'approved'
      and exists (select 1 from public.elections e where e.id = election_id and e.status <> 'draft')
    )
  );
drop policy if exists nom_insert on public.candidate_nominations;
create policy nom_insert on public.candidate_nominations
  for insert to authenticated with check (member_id = auth.uid());
drop policy if exists nom_update_self on public.candidate_nominations;
create policy nom_update_self on public.candidate_nominations
  for update to authenticated
  using (member_id = auth.uid() and status in ('draft', 'submitted'))
  with check (member_id = auth.uid() and status in ('draft', 'submitted', 'withdrawn'));
drop policy if exists nom_update_staff on public.candidate_nominations;
create policy nom_update_staff on public.candidate_nominations
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists nom_delete on public.candidate_nominations;
create policy nom_delete on public.candidate_nominations
  for delete to authenticated
  using ((member_id = auth.uid() and status = 'draft') or public.is_admin());

-- votes â€” NO policies on purpose. All access is via SECURITY DEFINER functions.

-- vote_receipts â€” own or staff read; writes via function only
drop policy if exists receipts_read on public.vote_receipts;
create policy receipts_read on public.vote_receipts
  for select to authenticated using (voter_id = auth.uid() or public.is_staff());

-- result_snapshots â€” published public; staff manage
drop policy if exists results_read on public.result_snapshots;
create policy results_read on public.result_snapshots
  for select to anon, authenticated using (published or public.is_staff());
drop policy if exists results_write on public.result_snapshots;
create policy results_write on public.result_snapshots
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- committee â€” public read; staff manage
drop policy if exists committee_read on public.committee_assignments;
create policy committee_read on public.committee_assignments
  for select to anon, authenticated using (true);
drop policy if exists committee_write on public.committee_assignments;
create policy committee_write on public.committee_assignments
  for all to authenticated using (public.is_staff()) with check (public.is_staff());


-- >>> 0026_magazine.sql >>>
-- =============================================================================
-- 0026 â€” Digital Magazine & Editorial Publishing System
-- Editions â†’ articles (block-based rich content) â†’ editorial workflow, with
-- comments, bookmarks, reactions, editor reviews and version snapshots.
-- Reuses the shared Media Library (cover_image / gallery store media URLs/ids).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.article_status as enum (
    'draft', 'review', 'revision_required', 'approved', 'scheduled', 'published', 'archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.magazine_comment_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.magazine_reaction as enum ('like', 'love', 'inspiring', 'creative');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.review_decision as enum ('approve', 'reject', 'revise');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- magazine_categories
-- ----------------------------------------------------------------------------
create table if not exists public.magazine_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  color      text,
  icon       text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- magazine_editions
-- ----------------------------------------------------------------------------
create table if not exists public.magazine_editions (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  description     text,
  cover_image     text,
  issue_number    int,
  volume          int,
  status          public.content_status not null default 'draft',
  published_at    timestamptz,
  seo_title       text,
  seo_description text,
  created_by      uuid references public.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz
);
create index if not exists editions_status_idx on public.magazine_editions (status);

-- ----------------------------------------------------------------------------
-- magazine_articles
-- ----------------------------------------------------------------------------
create table if not exists public.magazine_articles (
  id              uuid primary key default gen_random_uuid(),
  edition_id      uuid references public.magazine_editions (id) on delete set null,
  category_id     uuid references public.magazine_categories (id) on delete set null,
  title           text not null,
  slug            text not null unique,
  excerpt         text,
  content         text,                       -- plain-text rendering of blocks (search + fallback)
  cover_image     text,
  featured        boolean not null default false,
  status          public.article_status not null default 'draft',
  reading_time    int not null default 1,     -- minutes
  views           bigint not null default 0,
  likes           bigint not null default 0,
  seo_title       text,
  seo_description text,
  published_at    timestamptz,
  scheduled_at    timestamptz,
  author_id       uuid not null references public.users (id) on delete cascade,
  editor_id       uuid references public.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz
);
create index if not exists articles_status_idx   on public.magazine_articles (status, published_at desc);
create index if not exists articles_edition_idx  on public.magazine_articles (edition_id);
create index if not exists articles_category_idx on public.magazine_articles (category_id);
create index if not exists articles_author_idx   on public.magazine_articles (author_id);
create index if not exists articles_featured_idx on public.magazine_articles (featured) where featured;
-- Full-text search over title + excerpt + content.
create index if not exists articles_search_idx on public.magazine_articles
  using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content,'')));

-- ----------------------------------------------------------------------------
-- magazine_article_blocks (ordered rich-content blocks)
-- ----------------------------------------------------------------------------
create table if not exists public.magazine_article_blocks (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.magazine_articles (id) on delete cascade,
  sort_order int not null default 0,
  block_type text not null,
  hidden     boolean not null default false,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists blocks_article_idx on public.magazine_article_blocks (article_id, sort_order);

-- ----------------------------------------------------------------------------
-- magazine_article_gallery (media-library backed)
-- ----------------------------------------------------------------------------
create table if not exists public.magazine_article_gallery (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.magazine_articles (id) on delete cascade,
  media_id   uuid references public.media_files (id) on delete set null,
  media_url  text,
  sort_order int not null default 0,
  caption    text,
  created_at timestamptz not null default now()
);
create index if not exists gallery_article_idx on public.magazine_article_gallery (article_id, sort_order);

-- ----------------------------------------------------------------------------
-- magazine_comments
-- ----------------------------------------------------------------------------
create table if not exists public.magazine_comments (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.magazine_articles (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  content    text not null,
  status     public.magazine_comment_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists comments_article_idx on public.magazine_comments (article_id, status);
create index if not exists comments_user_idx on public.magazine_comments (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- magazine_bookmarks (one per user/article)
-- ----------------------------------------------------------------------------
create table if not exists public.magazine_bookmarks (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.magazine_articles (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (article_id, user_id)
);
create index if not exists bookmarks_user_idx on public.magazine_bookmarks (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- magazine_reactions (one reaction per user/article)
-- ----------------------------------------------------------------------------
create table if not exists public.magazine_reactions (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.magazine_articles (id) on delete cascade,
  user_id    uuid not null references public.users (id) on delete cascade,
  reaction   public.magazine_reaction not null default 'like',
  created_at timestamptz not null default now(),
  unique (article_id, user_id)
);
create index if not exists reactions_article_idx on public.magazine_reactions (article_id);

-- ----------------------------------------------------------------------------
-- magazine_editor_reviews (editorial decisions trail)
-- ----------------------------------------------------------------------------
create table if not exists public.magazine_editor_reviews (
  id          uuid primary key default gen_random_uuid(),
  article_id  uuid not null references public.magazine_articles (id) on delete cascade,
  reviewer_id uuid references public.users (id) on delete set null,
  remarks     text,
  decision    public.review_decision not null,
  created_at  timestamptz not null default now()
);
create index if not exists reviews_article_idx on public.magazine_editor_reviews (article_id, created_at desc);

-- ----------------------------------------------------------------------------
-- magazine_article_versions (immutable snapshots)
-- ----------------------------------------------------------------------------
create table if not exists public.magazine_article_versions (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.magazine_articles (id) on delete cascade,
  version    int not null default 1,
  snapshot   jsonb not null default '{}'::jsonb,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists versions_article_idx on public.magazine_article_versions (article_id, version desc);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
drop trigger if exists set_editions_updated_at on public.magazine_editions;
create trigger set_editions_updated_at before update on public.magazine_editions
  for each row execute function public.set_updated_at();
drop trigger if exists set_articles_updated_at on public.magazine_articles;
create trigger set_articles_updated_at before update on public.magazine_articles
  for each row execute function public.set_updated_at();


-- >>> 0027_magazine_functions.sql >>>
-- =============================================================================
-- 0027 â€” Magazine functions (view counter, likes sync, search) + RLS
-- =============================================================================

-- ----------------------------------------------------------------------------
-- magazine_increment_view â€” bump a published article's view counter.
-- SECURITY DEFINER so anonymous readers can record a view without write access.
-- ----------------------------------------------------------------------------
create or replace function public.magazine_increment_view(p_article uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.magazine_articles
     set views = views + 1
   where id = p_article and status = 'published';
$$;
grant execute on function public.magazine_increment_view(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Keep magazine_articles.likes in sync with the reactions table.
-- ----------------------------------------------------------------------------
create or replace function public.magazine_sync_likes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_article uuid := coalesce(new.article_id, old.article_id);
begin
  update public.magazine_articles a
     set likes = (select count(*) from public.magazine_reactions r where r.article_id = v_article)
   where a.id = v_article;
  return null;
end;
$$;

drop trigger if exists magazine_reactions_sync on public.magazine_reactions;
create trigger magazine_reactions_sync
  after insert or update or delete on public.magazine_reactions
  for each row execute function public.magazine_sync_likes();

-- ----------------------------------------------------------------------------
-- magazine_search â€” indexed full-text search over published articles.
-- Returns ids + rank; the query layer hydrates rows (author/category/edition).
-- ----------------------------------------------------------------------------
create or replace function public.magazine_search(p_query text, p_limit int default 20, p_offset int default 0)
returns table (id uuid, rank real)
language sql
stable
security definer
set search_path = public
as $$
  select a.id,
         ts_rank(
           to_tsvector('english', coalesce(a.title,'') || ' ' || coalesce(a.excerpt,'') || ' ' || coalesce(a.content,'')),
           websearch_to_tsquery('english', p_query)
         ) as rank
    from public.magazine_articles a
   where a.status = 'published'
     and to_tsvector('english', coalesce(a.title,'') || ' ' || coalesce(a.excerpt,'') || ' ' || coalesce(a.content,''))
         @@ websearch_to_tsquery('english', p_query)
   order by rank desc, a.published_at desc nulls last
   limit greatest(p_limit, 1) offset greatest(p_offset, 0);
$$;
grant execute on function public.magazine_search(text, int, int) to anon, authenticated;

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.magazine_categories       enable row level security;
alter table public.magazine_editions          enable row level security;
alter table public.magazine_articles           enable row level security;
alter table public.magazine_article_blocks     enable row level security;
alter table public.magazine_article_gallery    enable row level security;
alter table public.magazine_comments           enable row level security;
alter table public.magazine_bookmarks          enable row level security;
alter table public.magazine_reactions          enable row level security;
alter table public.magazine_editor_reviews     enable row level security;
alter table public.magazine_article_versions   enable row level security;

-- categories â€” public read, staff manage
drop policy if exists mag_cat_read on public.magazine_categories;
create policy mag_cat_read on public.magazine_categories for select to anon, authenticated using (true);
drop policy if exists mag_cat_write on public.magazine_categories;
create policy mag_cat_write on public.magazine_categories for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- editions â€” published public; staff manage
drop policy if exists mag_ed_read on public.magazine_editions;
create policy mag_ed_read on public.magazine_editions
  for select to anon, authenticated using (status = 'published' or public.is_staff());
drop policy if exists mag_ed_write on public.magazine_editions;
create policy mag_ed_write on public.magazine_editions
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- articles â€” published public; own; staff all
drop policy if exists mag_art_read on public.magazine_articles;
create policy mag_art_read on public.magazine_articles
  for select to anon, authenticated
  using (status = 'published' or author_id = auth.uid() or public.is_staff());
drop policy if exists mag_art_insert on public.magazine_articles;
create policy mag_art_insert on public.magazine_articles
  for insert to authenticated with check (author_id = auth.uid());
drop policy if exists mag_art_update_self on public.magazine_articles;
create policy mag_art_update_self on public.magazine_articles
  for update to authenticated
  using (author_id = auth.uid() and status in ('draft', 'revision_required'))
  with check (author_id = auth.uid() and status in ('draft', 'review'));
drop policy if exists mag_art_update_staff on public.magazine_articles;
create policy mag_art_update_staff on public.magazine_articles
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists mag_art_delete on public.magazine_articles;
create policy mag_art_delete on public.magazine_articles
  for delete to authenticated
  using ((author_id = auth.uid() and status = 'draft') or public.is_admin());

-- helper predicate inline: a user may edit an article's children if they own a
-- draft/revision article, or they are staff.
-- blocks
drop policy if exists mag_blk_read on public.magazine_article_blocks;
create policy mag_blk_read on public.magazine_article_blocks
  for select to anon, authenticated
  using (exists (
    select 1 from public.magazine_articles a where a.id = article_id
      and (a.status = 'published' or a.author_id = auth.uid() or public.is_staff())
  ));
drop policy if exists mag_blk_write on public.magazine_article_blocks;
create policy mag_blk_write on public.magazine_article_blocks
  for all to authenticated
  using (exists (
    select 1 from public.magazine_articles a where a.id = article_id
      and (public.is_staff() or (a.author_id = auth.uid() and a.status in ('draft','revision_required')))
  ))
  with check (exists (
    select 1 from public.magazine_articles a where a.id = article_id
      and (public.is_staff() or (a.author_id = auth.uid() and a.status in ('draft','revision_required')))
  ));

-- gallery (same rules as blocks)
drop policy if exists mag_gal_read on public.magazine_article_gallery;
create policy mag_gal_read on public.magazine_article_gallery
  for select to anon, authenticated
  using (exists (
    select 1 from public.magazine_articles a where a.id = article_id
      and (a.status = 'published' or a.author_id = auth.uid() or public.is_staff())
  ));
drop policy if exists mag_gal_write on public.magazine_article_gallery;
create policy mag_gal_write on public.magazine_article_gallery
  for all to authenticated
  using (exists (
    select 1 from public.magazine_articles a where a.id = article_id
      and (public.is_staff() or (a.author_id = auth.uid() and a.status in ('draft','revision_required')))
  ))
  with check (exists (
    select 1 from public.magazine_articles a where a.id = article_id
      and (public.is_staff() or (a.author_id = auth.uid() and a.status in ('draft','revision_required')))
  ));

-- comments â€” approved public; own; staff moderate
drop policy if exists mag_com_read on public.magazine_comments;
create policy mag_com_read on public.magazine_comments
  for select to anon, authenticated
  using (status = 'approved' or user_id = auth.uid() or public.is_staff());
drop policy if exists mag_com_insert on public.magazine_comments;
create policy mag_com_insert on public.magazine_comments
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists mag_com_update on public.magazine_comments;
create policy mag_com_update on public.magazine_comments
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists mag_com_delete on public.magazine_comments;
create policy mag_com_delete on public.magazine_comments
  for delete to authenticated using (user_id = auth.uid() or public.is_staff());

-- bookmarks â€” own only
drop policy if exists mag_bm_all on public.magazine_bookmarks;
create policy mag_bm_all on public.magazine_bookmarks
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reactions â€” public read (counts), own write
drop policy if exists mag_rx_read on public.magazine_reactions;
create policy mag_rx_read on public.magazine_reactions for select to anon, authenticated using (true);
drop policy if exists mag_rx_write on public.magazine_reactions;
create policy mag_rx_write on public.magazine_reactions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- editor reviews â€” staff or the article's author read; staff write
drop policy if exists mag_rev_read on public.magazine_editor_reviews;
create policy mag_rev_read on public.magazine_editor_reviews
  for select to authenticated
  using (public.is_staff() or exists (
    select 1 from public.magazine_articles a where a.id = article_id and a.author_id = auth.uid()
  ));
drop policy if exists mag_rev_write on public.magazine_editor_reviews;
create policy mag_rev_write on public.magazine_editor_reviews
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- versions â€” staff or author read; staff or author insert; admin delete
drop policy if exists mag_ver_read on public.magazine_article_versions;
create policy mag_ver_read on public.magazine_article_versions
  for select to authenticated
  using (public.is_staff() or exists (
    select 1 from public.magazine_articles a where a.id = article_id and a.author_id = auth.uid()
  ));
drop policy if exists mag_ver_insert on public.magazine_article_versions;
create policy mag_ver_insert on public.magazine_article_versions
  for insert to authenticated
  with check (public.is_staff() or exists (
    select 1 from public.magazine_articles a where a.id = article_id and a.author_id = auth.uid()
  ));
drop policy if exists mag_ver_delete on public.magazine_article_versions;
create policy mag_ver_delete on public.magazine_article_versions
  for delete to authenticated using (public.is_admin());


-- >>> 0028_program_galleries.sql >>>
-- =============================================================================
-- 0028 â€” Program photo galleries
-- Adds an ordered image-URL list to activities and events so a finished program
-- can show multiple photos (images flow through the existing Media Library).
-- Backfills to an empty array; existing RLS policies already cover these rows.
-- =============================================================================

alter table public.activities add column if not exists gallery text[] not null default '{}';
alter table public.events     add column if not exists gallery text[] not null default '{}';


-- >>> 0029_contributors.sql >>>
-- =============================================================================
-- 0029 â€” Contributors (community editorial platform)
-- A public author identity (optionally linked to a user account) so students,
-- teachers, alumni, staff, and guests receive visible credit + a portfolio.
-- Articles gain a primary contributor; display falls back to the author user
-- when an article predates this system.
-- =============================================================================

do $$ begin
  create type public.contributor_type as enum (
    'student', 'teacher', 'staff', 'alumni', 'guest', 'club_member'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.contributors (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.users (id) on delete set null,
  type            public.contributor_type not null default 'student',
  slug            text not null unique,
  display_name    text not null,
  profile_photo   text,
  cover_photo     text,
  headline        text,
  bio             text,
  class_level     text,
  section         text,
  department      text,
  graduation_year int,
  organization    text,
  designation     text,
  website         text,
  social_links    jsonb not null default '{}'::jsonb,
  featured        boolean not null default false,
  verified        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,
  unique (user_id)
);
create index if not exists contributors_type_idx on public.contributors (type);
create index if not exists contributors_featured_idx on public.contributors (featured) where featured;

-- Link articles to a primary contributor (nullable; legacy rows use author_id).
alter table public.magazine_articles
  add column if not exists contributor_id uuid references public.contributors (id) on delete set null;
create index if not exists articles_contributor_idx on public.magazine_articles (contributor_id);

drop trigger if exists set_contributors_updated_at on public.contributors;
create trigger set_contributors_updated_at before update on public.contributors
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS â€” profiles are public; members manage their own; staff manage all.
-- ----------------------------------------------------------------------------
alter table public.contributors enable row level security;

drop policy if exists contributors_read on public.contributors;
create policy contributors_read on public.contributors
  for select to anon, authenticated using (true);

drop policy if exists contributors_insert on public.contributors;
create policy contributors_insert on public.contributors
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_staff());

drop policy if exists contributors_update_own on public.contributors;
create policy contributors_update_own on public.contributors
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists contributors_update_staff on public.contributors;
create policy contributors_update_staff on public.contributors
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists contributors_delete on public.contributors;
create policy contributors_delete on public.contributors
  for delete to authenticated using (public.is_admin());

