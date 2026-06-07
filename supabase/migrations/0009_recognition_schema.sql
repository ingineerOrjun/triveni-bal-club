-- =============================================================================
-- 0009 — Achievements & Recognition schema
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
-- metric ∈ {events_attended, events_registered, activities_joined}
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
