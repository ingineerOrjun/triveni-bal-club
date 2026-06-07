-- =============================================================================
-- 0018 — Media Library (DAM) schema
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
  module      text not null,                 -- 'gallery', 'badge', 'settings'…
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
