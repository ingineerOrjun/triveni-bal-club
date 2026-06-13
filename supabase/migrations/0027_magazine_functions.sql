-- =============================================================================
-- 0027 — Magazine functions (view counter, likes sync, search) + RLS
-- =============================================================================

-- ----------------------------------------------------------------------------
-- magazine_increment_view — bump a published article's view counter.
-- SECURITY DEFINER so anonymous readers can record a view without write access.
-- ----------------------------------------------------------------------------
create or replace function public.magazine_increment_view(p_article uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.magazine_articles
     set views = views + 1
   where id = p_article and status = 'published';
$$;
grant execute on function public.magazine_increment_view(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Keep magazine_articles.likes in sync with the reactions table.
-- ----------------------------------------------------------------------------
create or replace function public.magazine_sync_likes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_article uuid := coalesce(new.article_id, old.article_id);
begin
  update public.magazine_articles a
     set likes = (select count(*) from public.magazine_reactions r where r.article_id = v_article)
   where a.id = v_article;
  return null;
end;
$$;

drop trigger if exists magazine_reactions_sync on public.magazine_reactions;
create trigger magazine_reactions_sync
  after insert or update or delete on public.magazine_reactions
  for each row execute function public.magazine_sync_likes();

-- ----------------------------------------------------------------------------
-- magazine_search — indexed full-text search over published articles.
-- Returns ids + rank; the query layer hydrates rows (author/category/edition).
-- ----------------------------------------------------------------------------
create or replace function public.magazine_search(p_query text, p_limit int default 20, p_offset int default 0)
returns table (id uuid, rank real)
language sql
stable
security definer
set search_path = public
as $$
  select a.id,
         ts_rank(
           to_tsvector('english', coalesce(a.title,'') || ' ' || coalesce(a.excerpt,'') || ' ' || coalesce(a.content,'')),
           websearch_to_tsquery('english', p_query)
         ) as rank
    from public.magazine_articles a
   where a.status = 'published'
     and to_tsvector('english', coalesce(a.title,'') || ' ' || coalesce(a.excerpt,'') || ' ' || coalesce(a.content,''))
         @@ websearch_to_tsquery('english', p_query)
   order by rank desc, a.published_at desc nulls last
   limit greatest(p_limit, 1) offset greatest(p_offset, 0);
$$;
grant execute on function public.magazine_search(text, int, int) to anon, authenticated;

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.magazine_categories       enable row level security;
alter table public.magazine_editions          enable row level security;
alter table public.magazine_articles           enable row level security;
alter table public.magazine_article_blocks     enable row level security;
alter table public.magazine_article_gallery    enable row level security;
alter table public.magazine_comments           enable row level security;
alter table public.magazine_bookmarks          enable row level security;
alter table public.magazine_reactions          enable row level security;
alter table public.magazine_editor_reviews     enable row level security;
alter table public.magazine_article_versions   enable row level security;

-- categories — public read, staff manage
drop policy if exists mag_cat_read on public.magazine_categories;
create policy mag_cat_read on public.magazine_categories for select to anon, authenticated using (true);
drop policy if exists mag_cat_write on public.magazine_categories;
create policy mag_cat_write on public.magazine_categories for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- editions — published public; staff manage
drop policy if exists mag_ed_read on public.magazine_editions;
create policy mag_ed_read on public.magazine_editions
  for select to anon, authenticated using (status = 'published' or public.is_staff());
drop policy if exists mag_ed_write on public.magazine_editions;
create policy mag_ed_write on public.magazine_editions
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- articles — published public; own; staff all
drop policy if exists mag_art_read on public.magazine_articles;
create policy mag_art_read on public.magazine_articles
  for select to anon, authenticated
  using (status = 'published' or author_id = auth.uid() or public.is_staff());
drop policy if exists mag_art_insert on public.magazine_articles;
create policy mag_art_insert on public.magazine_articles
  for insert to authenticated with check (author_id = auth.uid());
drop policy if exists mag_art_update_self on public.magazine_articles;
create policy mag_art_update_self on public.magazine_articles
  for update to authenticated
  using (author_id = auth.uid() and status in ('draft', 'revision_required'))
  with check (author_id = auth.uid() and status in ('draft', 'review'));
drop policy if exists mag_art_update_staff on public.magazine_articles;
create policy mag_art_update_staff on public.magazine_articles
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists mag_art_delete on public.magazine_articles;
create policy mag_art_delete on public.magazine_articles
  for delete to authenticated
  using ((author_id = auth.uid() and status = 'draft') or public.is_admin());

-- helper predicate inline: a user may edit an article's children if they own a
-- draft/revision article, or they are staff.
-- blocks
drop policy if exists mag_blk_read on public.magazine_article_blocks;
create policy mag_blk_read on public.magazine_article_blocks
  for select to anon, authenticated
  using (exists (
    select 1 from public.magazine_articles a where a.id = article_id
      and (a.status = 'published' or a.author_id = auth.uid() or public.is_staff())
  ));
drop policy if exists mag_blk_write on public.magazine_article_blocks;
create policy mag_blk_write on public.magazine_article_blocks
  for all to authenticated
  using (exists (
    select 1 from public.magazine_articles a where a.id = article_id
      and (public.is_staff() or (a.author_id = auth.uid() and a.status in ('draft','revision_required')))
  ))
  with check (exists (
    select 1 from public.magazine_articles a where a.id = article_id
      and (public.is_staff() or (a.author_id = auth.uid() and a.status in ('draft','revision_required')))
  ));

-- gallery (same rules as blocks)
drop policy if exists mag_gal_read on public.magazine_article_gallery;
create policy mag_gal_read on public.magazine_article_gallery
  for select to anon, authenticated
  using (exists (
    select 1 from public.magazine_articles a where a.id = article_id
      and (a.status = 'published' or a.author_id = auth.uid() or public.is_staff())
  ));
drop policy if exists mag_gal_write on public.magazine_article_gallery;
create policy mag_gal_write on public.magazine_article_gallery
  for all to authenticated
  using (exists (
    select 1 from public.magazine_articles a where a.id = article_id
      and (public.is_staff() or (a.author_id = auth.uid() and a.status in ('draft','revision_required')))
  ))
  with check (exists (
    select 1 from public.magazine_articles a where a.id = article_id
      and (public.is_staff() or (a.author_id = auth.uid() and a.status in ('draft','revision_required')))
  ));

-- comments — approved public; own; staff moderate
drop policy if exists mag_com_read on public.magazine_comments;
create policy mag_com_read on public.magazine_comments
  for select to anon, authenticated
  using (status = 'approved' or user_id = auth.uid() or public.is_staff());
drop policy if exists mag_com_insert on public.magazine_comments;
create policy mag_com_insert on public.magazine_comments
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists mag_com_update on public.magazine_comments;
create policy mag_com_update on public.magazine_comments
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists mag_com_delete on public.magazine_comments;
create policy mag_com_delete on public.magazine_comments
  for delete to authenticated using (user_id = auth.uid() or public.is_staff());

-- bookmarks — own only
drop policy if exists mag_bm_all on public.magazine_bookmarks;
create policy mag_bm_all on public.magazine_bookmarks
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reactions — public read (counts), own write
drop policy if exists mag_rx_read on public.magazine_reactions;
create policy mag_rx_read on public.magazine_reactions for select to anon, authenticated using (true);
drop policy if exists mag_rx_write on public.magazine_reactions;
create policy mag_rx_write on public.magazine_reactions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- editor reviews — staff or the article's author read; staff write
drop policy if exists mag_rev_read on public.magazine_editor_reviews;
create policy mag_rev_read on public.magazine_editor_reviews
  for select to authenticated
  using (public.is_staff() or exists (
    select 1 from public.magazine_articles a where a.id = article_id and a.author_id = auth.uid()
  ));
drop policy if exists mag_rev_write on public.magazine_editor_reviews;
create policy mag_rev_write on public.magazine_editor_reviews
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- versions — staff or author read; staff or author insert; admin delete
drop policy if exists mag_ver_read on public.magazine_article_versions;
create policy mag_ver_read on public.magazine_article_versions
  for select to authenticated
  using (public.is_staff() or exists (
    select 1 from public.magazine_articles a where a.id = article_id and a.author_id = auth.uid()
  ));
drop policy if exists mag_ver_insert on public.magazine_article_versions;
create policy mag_ver_insert on public.magazine_article_versions
  for insert to authenticated
  with check (public.is_staff() or exists (
    select 1 from public.magazine_articles a where a.id = article_id and a.author_id = auth.uid()
  ));
drop policy if exists mag_ver_delete on public.magazine_article_versions;
create policy mag_ver_delete on public.magazine_article_versions
  for delete to authenticated using (public.is_admin());
