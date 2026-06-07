-- =============================================================================
-- 0019 — Storage buckets, storage RLS, and the media usage guard
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
--   read   : public buckets → everyone; private buckets → staff
--   write  : staff (moderator/admin) for all managed buckets
--   delete : admin only
-- ----------------------------------------------------------------------------
do $$
declare
  public_buckets text[]  := array['media-public','gallery','avatars'];
  managed_buckets text[] := array['media-public','gallery','avatars','media-private','certificates','documents'];
begin
  -- public read
  begin
    execute $p$
      create policy "media public read" on storage.objects
      for select to anon, authenticated
      using (bucket_id = any($1))
    $p$ using public_buckets;
  exception when duplicate_object then null; end;

  -- staff read of private managed buckets
  begin
    execute $p$
      create policy "media staff read" on storage.objects
      for select to authenticated
      using (bucket_id = any($1) and public.is_staff())
    $p$ using managed_buckets;
  exception when duplicate_object then null; end;

  -- staff upload
  begin
    execute $p$
      create policy "media staff insert" on storage.objects
      for insert to authenticated
      with check (bucket_id = any($1) and public.is_staff())
    $p$ using managed_buckets;
  exception when duplicate_object then null; end;

  -- staff update (replace / move)
  begin
    execute $p$
      create policy "media staff update" on storage.objects
      for update to authenticated
      using (bucket_id = any($1) and public.is_staff())
      with check (bucket_id = any($1) and public.is_staff())
    $p$ using managed_buckets;
  exception when duplicate_object then null; end;

  -- admin delete
  begin
    execute $p$
      create policy "media admin delete" on storage.objects
      for delete to authenticated
      using (bucket_id = any($1) and public.is_admin())
    $p$ using managed_buckets;
  exception when duplicate_object then null; end;
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
