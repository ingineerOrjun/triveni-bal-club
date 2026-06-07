-- =============================================================================
-- 0013 — Student Voice & Suggestions schema
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
