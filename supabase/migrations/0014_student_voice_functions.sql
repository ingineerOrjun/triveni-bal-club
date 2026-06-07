-- =============================================================================
-- 0014 — Student Voice triggers + recognition-engine extension
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Maintain suggestions.support_count from suggestion_votes (avoids N+1 counts).
-- ----------------------------------------------------------------------------
create or replace function public.sync_support_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.suggestions
      set support_count = support_count + 1
      where id = new.suggestion_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.suggestions
      set support_count = greatest(support_count - 1, 0)
      where id = old.suggestion_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_support_count on public.suggestion_votes;
create trigger trg_support_count
  after insert or delete on public.suggestion_votes
  for each row execute function public.sync_support_count();

-- ----------------------------------------------------------------------------
-- Guard rails enforced in the database (defense in depth):
--   • accepted/implemented suggestions cannot be deleted (archive instead)
--   • status transitions are recorded automatically as a safety net
-- ----------------------------------------------------------------------------
create or replace function public.prevent_locked_delete()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('accepted', 'planned', 'in_progress', 'implemented') then
    raise exception 'Accepted suggestions cannot be deleted — archive instead';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_prevent_locked_delete on public.suggestions;
create trigger trg_prevent_locked_delete
  before delete on public.suggestions
  for each row execute function public.prevent_locked_delete();

-- Safety-net status history (in addition to the rich history written by the
-- server action, which includes a reason). Only fires when status changes and
-- the app did not already insert a matching row in this statement.
create or replace function public.record_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if not exists (
      select 1 from public.suggestion_status_history h
      where h.suggestion_id = new.id
        and h.new_status = new.status
        and h.created_at > now() - interval '5 seconds'
    ) then
      insert into public.suggestion_status_history
        (suggestion_id, old_status, new_status, changed_by)
      values (new.id, old.status, new.status, auth.uid());
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_record_status_change on public.suggestions;
create trigger trg_record_status_change
  after update on public.suggestions
  for each row execute function public.record_status_change();

-- ----------------------------------------------------------------------------
-- Extend badge_rules metric vocabulary + the recognition engine with
-- suggestion metrics. Reuses the Phase-6 engine (never duplicates the logic).
-- ----------------------------------------------------------------------------
alter table public.badge_rules drop constraint if exists badge_rules_metric_check;
alter table public.badge_rules add constraint badge_rules_metric_check
  check (metric in (
    'events_attended', 'events_registered', 'activities_joined',
    'suggestions_submitted', 'suggestions_implemented', 'suggestions_supported'
  ));

create or replace function public.evaluate_member_badges(p_member uuid default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member                  uuid := coalesce(p_member, auth.uid());
  v_attended                int;
  v_registered              int;
  v_joined                  int;
  v_suggestions_submitted   int;
  v_suggestions_implemented int;
  v_suggestions_supported   int;
  v_awarded                 int := 0;
  r                         record;
  v_value                   int;
begin
  if v_member is null then
    return 0;
  end if;
  if v_member <> auth.uid() and not public.is_staff() then
    raise exception 'Not allowed to evaluate badges for another member';
  end if;

  select count(*) into v_attended
    from public.attendance_records where member_id = v_member and status = 'present';
  select count(*) into v_registered
    from public.event_registrations where member_id = v_member and status = 'registered';
  select count(*) into v_joined
    from public.activity_participants where member_id = v_member;
  select count(*) into v_suggestions_submitted
    from public.suggestions where author_id = v_member and status <> 'draft';
  select count(*) into v_suggestions_implemented
    from public.suggestions where author_id = v_member and status = 'implemented';
  select count(*) into v_suggestions_supported
    from public.suggestion_votes where member_id = v_member;

  for r in
    select br.metric, br.threshold, br.badge_id
    from public.badge_rules br
    join public.badges b on b.id = br.badge_id
    where br.is_active and b.is_active
  loop
    v_value := case r.metric
      when 'events_attended'        then v_attended
      when 'events_registered'      then v_registered
      when 'activities_joined'      then v_joined
      when 'suggestions_submitted'  then v_suggestions_submitted
      when 'suggestions_implemented' then v_suggestions_implemented
      when 'suggestions_supported'  then v_suggestions_supported
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
