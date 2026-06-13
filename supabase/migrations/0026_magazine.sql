-- =============================================================================
-- 0026 — Digital Magazine & Editorial Publishing System
-- Editions → articles (block-based rich content) → editorial workflow, with
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
