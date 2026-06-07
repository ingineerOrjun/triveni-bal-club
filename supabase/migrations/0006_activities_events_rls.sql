-- =============================================================================
-- 0006 — Row Level Security for activities & events
-- =============================================================================

-- Staff = moderator or admin (content managers).
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('moderator', 'admin');
$$;

grant execute on function public.is_staff() to authenticated;

alter table public.activity_categories  enable row level security;
alter table public.activities           enable row level security;
alter table public.activity_participants enable row level security;
alter table public.events               enable row level security;
alter table public.event_registrations  enable row level security;
alter table public.attendance_records   enable row level security;

-- ----------------------------------------------------------------------------
-- activity_categories — public read, staff manage
-- ----------------------------------------------------------------------------
drop policy if exists cat_read on public.activity_categories;
create policy cat_read on public.activity_categories
  for select to anon, authenticated using (true);

drop policy if exists cat_write on public.activity_categories;
create policy cat_write on public.activity_categories
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- activities — published visible to all; staff see + manage everything
-- ----------------------------------------------------------------------------
drop policy if exists activities_read on public.activities;
create policy activities_read on public.activities
  for select to anon, authenticated
  using (status = 'published' or public.is_staff());

drop policy if exists activities_insert on public.activities;
create policy activities_insert on public.activities
  for insert to authenticated with check (public.is_staff());

drop policy if exists activities_update on public.activities;
create policy activities_update on public.activities
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists activities_delete on public.activities;
create policy activities_delete on public.activities
  for delete to authenticated using (public.is_staff());

-- ----------------------------------------------------------------------------
-- activity_participants — member manages own membership; staff read all
-- ----------------------------------------------------------------------------
drop policy if exists ap_read on public.activity_participants;
create policy ap_read on public.activity_participants
  for select to authenticated
  using (member_id = auth.uid() or public.is_staff());

drop policy if exists ap_join on public.activity_participants;
create policy ap_join on public.activity_participants
  for insert to authenticated
  with check (
    member_id = auth.uid()
    and exists (
      select 1 from public.activities a
      where a.id = activity_id and a.status = 'published'
    )
  );

drop policy if exists ap_leave on public.activity_participants;
create policy ap_leave on public.activity_participants
  for delete to authenticated
  using (member_id = auth.uid() or public.is_staff());

-- ----------------------------------------------------------------------------
-- events — published visible to all; staff manage
-- ----------------------------------------------------------------------------
drop policy if exists events_read on public.events;
create policy events_read on public.events
  for select to anon, authenticated
  using (status = 'published' or public.is_staff());

drop policy if exists events_insert on public.events;
create policy events_insert on public.events
  for insert to authenticated with check (public.is_staff());

drop policy if exists events_update on public.events;
create policy events_update on public.events
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists events_delete on public.events;
create policy events_delete on public.events
  for delete to authenticated using (public.is_staff());

-- ----------------------------------------------------------------------------
-- event_registrations — member manages own; staff read all
-- (capacity/deadline enforced by trigger in 0005)
-- ----------------------------------------------------------------------------
drop policy if exists reg_read on public.event_registrations;
create policy reg_read on public.event_registrations
  for select to authenticated
  using (member_id = auth.uid() or public.is_staff());

drop policy if exists reg_insert on public.event_registrations;
create policy reg_insert on public.event_registrations
  for insert to authenticated
  with check (member_id = auth.uid());

drop policy if exists reg_update on public.event_registrations;
create policy reg_update on public.event_registrations
  for update to authenticated
  using (member_id = auth.uid() or public.is_staff())
  with check (member_id = auth.uid() or public.is_staff());

-- ----------------------------------------------------------------------------
-- attendance_records — member reads own; only staff write
-- ----------------------------------------------------------------------------
drop policy if exists att_read on public.attendance_records;
create policy att_read on public.attendance_records
  for select to authenticated
  using (member_id = auth.uid() or public.is_staff());

drop policy if exists att_write on public.attendance_records;
create policy att_write on public.attendance_records
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
