-- =============================================================================
-- 0008 — Phase 5 audit fixes
--   • missing indexes for unindexed sort paths
--   • close the capacity overbooking race in the registration trigger
--   • defense-in-depth RLS: members may only INSERT a registration for a
--     published event (previously enforced only by the trigger)
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Indexes for sort keys used by list queries
-- ----------------------------------------------------------------------------
-- listActivities(): order by created_at desc, no SQL filter.
create index if not exists activities_created_idx
  on public.activities (created_at desc);

-- listRegistrationsForEvent(): eq(event_id) + order(registered_at asc).
create index if not exists event_registrations_event_registered_idx
  on public.event_registrations (event_id, registered_at);

-- ----------------------------------------------------------------------------
-- Capacity race: serialize concurrent registrations for the same event by
-- taking a row lock on the event before counting. Two simultaneous inserts can
-- no longer both observe count < capacity and overbook.
-- ----------------------------------------------------------------------------
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

  -- Lock the event row so concurrent registrations are serialized.
  select * into v_event from public.events where id = new.event_id for update;

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
      and member_id <> new.member_id;

    if v_count >= v_event.capacity then
      raise exception 'This event is full';
    end if;
  end if;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- RLS: a member may only create a registration for a published event.
-- (Re-registration after cancelling goes through UPDATE / reg_update.)
-- ----------------------------------------------------------------------------
drop policy if exists reg_insert on public.event_registrations;
create policy reg_insert on public.event_registrations
  for insert to authenticated
  with check (
    member_id = auth.uid()
    and exists (
      select 1 from public.events e
      where e.id = event_id and e.status = 'published'
    )
  );
