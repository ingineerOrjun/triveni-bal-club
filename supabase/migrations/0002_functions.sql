-- =============================================================================
-- 0002 — Helper functions: role accessor, access-token hook, audit logger
-- =============================================================================

-- ----------------------------------------------------------------------------
-- current_user_role() — read the caller's role from the users table.
-- STABLE + SECURITY DEFINER so RLS policies can call it without recursion.
-- ----------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.users where id = auth.uid()),
    'public'::public.user_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin';
$$;

-- ----------------------------------------------------------------------------
-- Custom Access Token Hook — injects `user_role` into the JWT.
-- Enable in Supabase Dashboard: Authentication → Hooks → Customize Access Token
-- (select public.custom_access_token_hook).
-- ----------------------------------------------------------------------------
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  v_claims jsonb;
  v_role   public.user_role;
begin
  select role into v_role from public.users where id = (event ->> 'user_id')::uuid;

  v_claims := event -> 'claims';
  if v_role is not null then
    v_claims := jsonb_set(v_claims, '{user_role}', to_jsonb(v_role::text));
  else
    v_claims := jsonb_set(v_claims, '{user_role}', to_jsonb('member'::text));
  end if;

  return jsonb_set(event, '{claims}', v_claims);
end;
$$;

-- Grant the auth admin role permission to run the hook.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on table public.users to supabase_auth_admin;

-- ----------------------------------------------------------------------------
-- log_audit() — SECURITY DEFINER so members can append (but not read) audit
-- entries attributed to themselves. Read access is admin-only via RLS.
-- ----------------------------------------------------------------------------
create or replace function public.log_audit(
  p_action      text,
  p_entity_type text,
  p_entity_id   uuid default null,
  p_metadata    jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

grant execute on function public.log_audit(text, text, uuid, jsonb) to authenticated;
grant execute on function public.current_user_role() to authenticated, anon;
grant execute on function public.is_admin() to authenticated;
