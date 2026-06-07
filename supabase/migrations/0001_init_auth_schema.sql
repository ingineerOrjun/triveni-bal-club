-- =============================================================================
-- 0001 — Auth & member schema
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
-- users — mirror of auth.users carrying app role + display fields
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
-- member_profiles — 1:1 profile for members
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
-- audit_logs — append-only record of sensitive actions
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
-- handle_new_user — on auth signup, create users + member_profiles rows
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
