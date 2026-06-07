-- =============================================================================
-- 0010 — Recognition engine + certificate verification
-- =============================================================================

-- ----------------------------------------------------------------------------
-- evaluate_member_badges(member) — data-driven automatic badge engine.
-- Reads badge_rules, computes participation metrics, and awards any earned
-- badges not already held. Idempotent. SECURITY DEFINER so it can write
-- member_badges; callable for self, or for anyone by staff.
-- Returns the number of badges newly awarded.
-- ----------------------------------------------------------------------------
create or replace function public.evaluate_member_badges(p_member uuid default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member       uuid := coalesce(p_member, auth.uid());
  v_attended     int;
  v_registered   int;
  v_joined       int;
  v_awarded      int := 0;
  r              record;
  v_value        int;
begin
  if v_member is null then
    return 0;
  end if;
  if v_member <> auth.uid() and not public.is_staff() then
    raise exception 'Not allowed to evaluate badges for another member';
  end if;

  select count(*) into v_attended
    from public.attendance_records
    where member_id = v_member and status = 'present';

  select count(*) into v_registered
    from public.event_registrations
    where member_id = v_member and status = 'registered';

  select count(*) into v_joined
    from public.activity_participants
    where member_id = v_member;

  for r in
    select br.metric, br.threshold, br.badge_id
    from public.badge_rules br
    join public.badges b on b.id = br.badge_id
    where br.is_active and b.is_active
  loop
    v_value := case r.metric
      when 'events_attended'   then v_attended
      when 'events_registered' then v_registered
      when 'activities_joined' then v_joined
      else 0
    end;

    if v_value >= r.threshold
       and not exists (
         select 1 from public.member_badges
         where member_id = v_member and badge_id = r.badge_id
       )
    then
      insert into public.member_badges (member_id, badge_id, source, status)
      values (v_member, r.badge_id, 'automatic', 'awarded')
      on conflict (member_id, badge_id) do nothing;
      v_awarded := v_awarded + 1;
    end if;
  end loop;

  return v_awarded;
end;
$$;

grant execute on function public.evaluate_member_badges(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- verify_certificate(code) — PUBLIC, safe certificate verification.
-- Returns only non-sensitive fields; never exposes the certificates table.
-- ----------------------------------------------------------------------------
create or replace function public.verify_certificate(p_code text)
returns table (
  certificate_number text,
  title              text,
  recipient_name     text,
  issued_date        date,
  valid              boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.certificate_number,
    c.title,
    u.full_name as recipient_name,
    c.issued_date,
    true as valid
  from public.certificates c
  join public.users u on u.id = c.recipient_id
  where c.verification_code = p_code;
$$;

grant execute on function public.verify_certificate(text) to anon, authenticated;
