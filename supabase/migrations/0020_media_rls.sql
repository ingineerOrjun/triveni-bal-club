-- =============================================================================
-- 0020 — Row Level Security for the Media Library
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

-- folders — staff read, admin manage
drop policy if exists mf_folders_read on public.media_folders;
create policy mf_folders_read on public.media_folders
  for select to authenticated using (public.is_staff());
drop policy if exists mf_folders_write on public.media_folders;
create policy mf_folders_write on public.media_folders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- files — public active assets visible to all; staff manage; admin delete
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

-- tags — public read (for gallery filters); staff manage
drop policy if exists mf_tags_read on public.media_tags;
create policy mf_tags_read on public.media_tags
  for select to anon, authenticated using (true);
drop policy if exists mf_tags_write on public.media_tags;
create policy mf_tags_write on public.media_tags
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- file_tags — visible wherever the file is; staff manage
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

-- usage — staff
drop policy if exists mf_usage_read on public.media_usage;
create policy mf_usage_read on public.media_usage
  for select to authenticated using (public.is_staff());
drop policy if exists mf_usage_write on public.media_usage;
create policy mf_usage_write on public.media_usage
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- versions — staff
drop policy if exists mf_versions_read on public.media_versions;
create policy mf_versions_read on public.media_versions
  for select to authenticated using (public.is_staff());
drop policy if exists mf_versions_write on public.media_versions;
create policy mf_versions_write on public.media_versions
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- favorites — personal to each staff user
drop policy if exists mf_favorites_rw on public.media_favorites;
create policy mf_favorites_rw on public.media_favorites
  for all to authenticated
  using (user_id = auth.uid() and public.is_staff())
  with check (user_id = auth.uid() and public.is_staff());

-- collections — staff read, admin manage
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
