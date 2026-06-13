-- =============================================================================
-- 0029 — Contributors (community editorial platform)
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
-- RLS — profiles are public; members manage their own; staff manage all.
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
