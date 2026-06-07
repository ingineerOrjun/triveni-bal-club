-- =============================================================================
-- 0011 — Row Level Security for recognition tables
-- Roles: is_admin() (full), is_staff() (moderator+admin), members, anon.
-- Moderators may RECOMMEND achievements/badges (status='recommended') but only
-- admins may award, issue certificates, or manage programs.
-- =============================================================================

alter table public.achievement_categories enable row level security;
alter table public.badges                 enable row level security;
alter table public.badge_rules            enable row level security;
alter table public.member_achievements    enable row level security;
alter table public.member_badges          enable row level security;
alter table public.certificates           enable row level security;
alter table public.recognition_programs   enable row level security;
alter table public.recognition_awards     enable row level security;

-- ----------------------------------------------------------------------------
-- achievement_categories — public read, admin manage
-- ----------------------------------------------------------------------------
drop policy if exists achcat_read on public.achievement_categories;
create policy achcat_read on public.achievement_categories
  for select to anon, authenticated using (true);
drop policy if exists achcat_write on public.achievement_categories;
create policy achcat_write on public.achievement_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- badges (catalog) — active visible to all, admin manages
-- ----------------------------------------------------------------------------
drop policy if exists badges_read on public.badges;
create policy badges_read on public.badges
  for select to anon, authenticated using (is_active or public.is_staff());
drop policy if exists badges_write on public.badges;
create policy badges_write on public.badges
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- badge_rules — staff read, admin manage
-- ----------------------------------------------------------------------------
drop policy if exists rules_read on public.badge_rules;
create policy rules_read on public.badge_rules
  for select to authenticated using (public.is_staff());
drop policy if exists rules_write on public.badge_rules;
create policy rules_write on public.badge_rules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- member_achievements
--   read: public+awarded, or own, or staff
--   insert: staff; moderators limited to status='recommended'
--   update/delete: admin only
-- ----------------------------------------------------------------------------
drop policy if exists ach_read on public.member_achievements;
create policy ach_read on public.member_achievements
  for select to anon, authenticated
  using (
    (status = 'awarded' and visibility = 'public')
    or member_id = auth.uid()
    or public.is_staff()
  );

drop policy if exists ach_insert on public.member_achievements;
create policy ach_insert on public.member_achievements
  for insert to authenticated
  with check (
    public.is_staff()
    and (public.is_admin() or status = 'recommended')
  );

drop policy if exists ach_update on public.member_achievements;
create policy ach_update on public.member_achievements
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists ach_delete on public.member_achievements;
create policy ach_delete on public.member_achievements
  for delete to authenticated using (public.is_admin());

-- ----------------------------------------------------------------------------
-- member_badges
--   read: awarded visible to all, or own, or staff
--   insert: staff; moderators limited to status='recommended'
--           (automatic awards are inserted by the SECURITY DEFINER engine)
--   update/delete: admin only
-- ----------------------------------------------------------------------------
drop policy if exists mb_read on public.member_badges;
create policy mb_read on public.member_badges
  for select to anon, authenticated
  using (status = 'awarded' or member_id = auth.uid() or public.is_staff());

drop policy if exists mb_insert on public.member_badges;
create policy mb_insert on public.member_badges
  for insert to authenticated
  with check (
    public.is_staff()
    and (public.is_admin() or status = 'recommended')
  );

drop policy if exists mb_update on public.member_badges;
create policy mb_update on public.member_badges
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists mb_delete on public.member_badges;
create policy mb_delete on public.member_badges
  for delete to authenticated using (public.is_admin());

-- ----------------------------------------------------------------------------
-- certificates — recipient or staff read; admin-only write.
-- (Public verification goes through verify_certificate(), not this table.)
-- ----------------------------------------------------------------------------
drop policy if exists cert_read on public.certificates;
create policy cert_read on public.certificates
  for select to authenticated
  using (recipient_id = auth.uid() or public.is_staff());

drop policy if exists cert_write on public.certificates;
create policy cert_write on public.certificates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- recognition_programs — published visible to all; admin manages
-- ----------------------------------------------------------------------------
drop policy if exists prog_read on public.recognition_programs;
create policy prog_read on public.recognition_programs
  for select to anon, authenticated
  using (status = 'published' or public.is_staff());
drop policy if exists prog_write on public.recognition_programs;
create policy prog_write on public.recognition_programs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- recognition_awards — public read (recognition); admin manages
-- ----------------------------------------------------------------------------
drop policy if exists awards_read on public.recognition_awards;
create policy awards_read on public.recognition_awards
  for select to anon, authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.recognition_programs p
      where p.id = program_id and p.status = 'published'
    )
  );
drop policy if exists awards_write on public.recognition_awards;
create policy awards_write on public.recognition_awards
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
