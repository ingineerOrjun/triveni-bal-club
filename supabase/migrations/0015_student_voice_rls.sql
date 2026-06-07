-- =============================================================================
-- 0015 — Row Level Security for Student Voice
-- Members: read own + approved members/public; create own; edit own drafts;
--          support members/public ideas.
-- Moderators (is_staff): read all; review/feedback/status updates.
-- Admins: full access incl. categories/tags/merge/archive.
-- Public (anon): only approved PUBLIC, non-anonymous suggestions.
-- =============================================================================

alter table public.suggestion_categories     enable row level security;
alter table public.tags                       enable row level security;
alter table public.suggestions                enable row level security;
alter table public.suggestion_status_history  enable row level security;
alter table public.suggestion_votes           enable row level security;
alter table public.moderator_feedback         enable row level security;
alter table public.suggestion_tags            enable row level security;

-- ----------------------------------------------------------------------------
-- categories — public read (active), admin manage
-- ----------------------------------------------------------------------------
drop policy if exists sgcat_read on public.suggestion_categories;
create policy sgcat_read on public.suggestion_categories
  for select to anon, authenticated using (is_active or public.is_staff());
drop policy if exists sgcat_write on public.suggestion_categories;
create policy sgcat_write on public.suggestion_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- tags — public read, staff manage
-- ----------------------------------------------------------------------------
drop policy if exists tags_read on public.tags;
create policy tags_read on public.tags
  for select to anon, authenticated using (true);
drop policy if exists tags_write on public.tags;
create policy tags_write on public.tags
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- suggestions
-- ----------------------------------------------------------------------------
-- Approved-for-the-public statuses.
-- (accepted | planned | in_progress | implemented)
drop policy if exists sg_read on public.suggestions;
create policy sg_read on public.suggestions
  for select to anon, authenticated
  using (
    author_id = auth.uid()
    or public.is_staff()
    or (
      not is_anonymous
      and visibility = 'public'
      and status in ('accepted', 'planned', 'in_progress', 'implemented')
    )
    or (
      not is_anonymous
      and visibility = 'members'
      and status <> 'draft'
      and auth.uid() is not null
    )
  );

-- Members create their own suggestions.
drop policy if exists sg_insert on public.suggestions;
create policy sg_insert on public.suggestions
  for insert to authenticated
  with check (author_id = auth.uid());

-- Authors edit ONLY while in draft (and may move draft -> submitted).
drop policy if exists sg_update_author on public.suggestions;
create policy sg_update_author on public.suggestions
  for update to authenticated
  using (author_id = auth.uid() and status = 'draft')
  with check (author_id = auth.uid() and status in ('draft', 'submitted'));

-- Staff may update any suggestion (status, notes, priority, assignment…).
drop policy if exists sg_update_staff on public.suggestions;
create policy sg_update_staff on public.suggestions
  for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Delete only drafts, by the author or an admin. (Trigger also blocks deleting
-- accepted/implemented rows as a hard safety net.)
drop policy if exists sg_delete on public.suggestions;
create policy sg_delete on public.suggestions
  for delete to authenticated
  using ((author_id = auth.uid() or public.is_admin()) and status = 'draft');

-- ----------------------------------------------------------------------------
-- status history — read own/staff; insert by staff or by the suggestion's author
-- ----------------------------------------------------------------------------
drop policy if exists ssh_read on public.suggestion_status_history;
create policy ssh_read on public.suggestion_status_history
  for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.suggestions s
      where s.id = suggestion_id and s.author_id = auth.uid()
    )
  );

drop policy if exists ssh_insert on public.suggestion_status_history;
create policy ssh_insert on public.suggestion_status_history
  for insert to authenticated
  with check (
    public.is_staff()
    or exists (
      select 1 from public.suggestions s
      where s.id = suggestion_id and s.author_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- votes — read own/staff; member supports approved members/public ideas
-- ----------------------------------------------------------------------------
drop policy if exists sv_read on public.suggestion_votes;
create policy sv_read on public.suggestion_votes
  for select to authenticated
  using (member_id = auth.uid() or public.is_staff());

drop policy if exists sv_insert on public.suggestion_votes;
create policy sv_insert on public.suggestion_votes
  for insert to authenticated
  with check (
    member_id = auth.uid()
    and exists (
      select 1 from public.suggestions s
      where s.id = suggestion_id
        and s.status <> 'draft'
        and s.visibility in ('members', 'public')
    )
  );

drop policy if exists sv_delete on public.suggestion_votes;
create policy sv_delete on public.suggestion_votes
  for delete to authenticated
  using (member_id = auth.uid());

-- ----------------------------------------------------------------------------
-- moderator feedback — read own-suggestion/staff; write staff only
-- ----------------------------------------------------------------------------
drop policy if exists mf_read on public.moderator_feedback;
create policy mf_read on public.moderator_feedback
  for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.suggestions s
      where s.id = suggestion_id and s.author_id = auth.uid()
    )
  );

drop policy if exists mf_insert on public.moderator_feedback;
create policy mf_insert on public.moderator_feedback
  for insert to authenticated
  with check (public.is_staff() and moderator_id = auth.uid());

drop policy if exists mf_write on public.moderator_feedback;
create policy mf_write on public.moderator_feedback
  for delete to authenticated using (public.is_staff());

-- ----------------------------------------------------------------------------
-- suggestion_tags — readable wherever the suggestion is; managed by author
-- (while draft) or staff
-- ----------------------------------------------------------------------------
drop policy if exists st_read on public.suggestion_tags;
create policy st_read on public.suggestion_tags
  for select to anon, authenticated
  using (
    exists (select 1 from public.suggestions s where s.id = suggestion_id)
  );

drop policy if exists st_write on public.suggestion_tags;
create policy st_write on public.suggestion_tags
  for all to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.suggestions s
      where s.id = suggestion_id and s.author_id = auth.uid()
    )
  )
  with check (
    public.is_staff()
    or exists (
      select 1 from public.suggestions s
      where s.id = suggestion_id and s.author_id = auth.uid()
    )
  );
