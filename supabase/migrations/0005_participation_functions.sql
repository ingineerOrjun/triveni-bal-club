-- =============================================================================
-- 0005 — Participation integrity: capacity / deadline / publish enforcement
-- These run in the DATABASE so rules hold even if app-layer checks are bypassed.
-- =============================================================================

-- Enforce event-registration rules on insert OR when (re)setting status to
-- 'registered'. Counting + state checks happen atomically inside the trigger.
create or replace function public.enforce_event_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event   public.events%rowtype;
  v_count   int;
begin
  if new.status <> 'registered' then
    return new; -- cancellations/waitlist updates are unrestricted here
  end if;

  select * into v_event from public.events where id = new.event_id;

  if v_event.id is null then
    raise exception 'Event not found';
  end if;

  if v_event.status <> 'published' then
    raise exception 'Registration is not open for this event';
  end if;

  if v_event.registration_deadline is not null
     and now() > v_event.registration_deadline then
    raise exception 'The registration deadline has passed';
  end if;

  if v_event.capacity is not null then
    select count(*) into v_count
    from public.event_registrations
    where event_id = new.event_id
      and status = 'registered'
      and member_id <> new.member_id; -- exclude this member's own (re)registration

    if v_count >= v_event.capacity then
      raise exception 'This event is full';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_registration on public.event_registrations;
create trigger trg_enforce_registration
  before insert or update on public.event_registrations
  for each row execute function public.enforce_event_registration();

-- Stamp cancelled_at when a registration is cancelled.
create or replace function public.stamp_registration_cancel()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'cancelled' and (old.status is distinct from 'cancelled') then
    new.cancelled_at := now();
  elsif new.status = 'registered' then
    new.cancelled_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_cancel on public.event_registrations;
create trigger trg_stamp_cancel
  before update on public.event_registrations
  for each row execute function public.stamp_registration_cancel();

-- Helper: live registered count for an event (used by queries/UI).
create or replace function public.event_registered_count(p_event_id uuid)
returns int
language sql
stable
as $$
  select count(*)::int
  from public.event_registrations
  where event_id = p_event_id and status = 'registered';
$$;

grant execute on function public.event_registered_count(uuid) to authenticated, anon;
