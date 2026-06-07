-- =============================================================================
-- 0003 — Row Level Security
-- Enable RLS on every table and define least-privilege policies.
-- =============================================================================

alter table public.users           enable row level security;
alter table public.member_profiles enable row level security;
alter table public.audit_logs      enable row level security;

-- ----------------------------------------------------------------------------
-- users
-- ----------------------------------------------------------------------------
-- Read own row; admins read all.
drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Update own safe fields; admins update all. (Role changes go through admin
-- tooling using the service role — members cannot escalate their own role.)
drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Only admins may insert directly (signups are handled by the trigger).
drop policy if exists users_insert_admin on public.users;
create policy users_insert_admin on public.users
  for insert to authenticated
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- member_profiles
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select_self on public.member_profiles;
create policy profiles_select_self on public.member_profiles
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_role() in ('moderator', 'admin')
  );

drop policy if exists profiles_update_self on public.member_profiles;
create policy profiles_update_self on public.member_profiles
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_self on public.member_profiles;
create policy profiles_insert_self on public.member_profiles
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- audit_logs — admin read only; writes happen via SECURITY DEFINER log_audit()
-- (no INSERT/UPDATE/DELETE policy => members cannot write/read rows directly).
-- ----------------------------------------------------------------------------
drop policy if exists audit_select_admin on public.audit_logs;
create policy audit_select_admin on public.audit_logs
  for select to authenticated
  using (public.is_admin());
