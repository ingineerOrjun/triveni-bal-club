-- =============================================================================
-- 0021 — Gallery CMS (albums + photos backed by the Media Library)
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
