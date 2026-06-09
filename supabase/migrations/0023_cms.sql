-- =============================================================================
-- 0023 — Visual CMS: pages, version history, and menus
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
  location   text not null unique,             -- 'header' | 'footer' | …
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
