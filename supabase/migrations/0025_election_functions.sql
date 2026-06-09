-- =============================================================================
-- 0025 — Election SECURITY DEFINER functions (secret ballot) + RLS
-- =============================================================================

-- ----------------------------------------------------------------------------
-- cast_vote(election, choices) — the ONLY way a vote is written.
-- choices: jsonb array of { "position_id": uuid, "candidate_id": uuid }.
-- Enforces: signed-in voter, election open + in window, one vote per member,
-- candidate belongs to the position & is approved. Returns the receipt code.
-- Anonymous: votes carry no voter reference; the receipt records only WHO voted.
-- ----------------------------------------------------------------------------
create or replace function public.cast_vote(p_election uuid, p_choices jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_voter   uuid := auth.uid();
  v_election public.elections%rowtype;
  v_choice  jsonb;
  v_pos     uuid;
  v_cand    uuid;
  v_count   int := 0;
  v_code    text;
begin
  if v_voter is null then
    raise exception 'You must be signed in to vote';
  end if;

  select * into v_election from public.elections where id = p_election for update;
  if v_election.id is null then
    raise exception 'Election not found';
  end if;
  if v_election.status <> 'voting' then
    raise exception 'Voting is not open for this election';
  end if;
  if v_election.voting_open_at is not null and now() < v_election.voting_open_at then
    raise exception 'Voting has not started yet';
  end if;
  if v_election.voting_close_at is not null and now() > v_election.voting_close_at then
    raise exception 'Voting has closed';
  end if;

  if exists (
    select 1 from public.vote_receipts
    where election_id = p_election and voter_id = v_voter
  ) then
    raise exception 'You have already voted in this election';
  end if;

  for v_choice in select * from jsonb_array_elements(p_choices)
  loop
    v_pos := (v_choice ->> 'position_id')::uuid;
    v_cand := (v_choice ->> 'candidate_id')::uuid;
    if v_pos is null or v_cand is null then
      continue;
    end if;
    if not exists (
      select 1 from public.candidate_nominations c
      where c.id = v_cand
        and c.election_id = p_election
        and c.position_id = v_pos
        and c.status = 'approved'
    ) then
      raise exception 'Invalid candidate selection';
    end if;
    insert into public.votes (election_id, position_id, candidate_id)
    values (p_election, v_pos, v_cand);
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    raise exception 'No valid selections were submitted';
  end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.vote_receipts (election_id, voter_id, receipt_code, positions_voted)
  values (p_election, v_voter, v_code, v_count);

  return v_code;
end;
$$;

grant execute on function public.cast_vote(uuid, jsonb) to authenticated;

-- ----------------------------------------------------------------------------
-- get_election_results — tallies (gated: staff anytime; everyone once closed).
-- ----------------------------------------------------------------------------
create or replace function public.get_election_results(p_election uuid)
returns table (position_id uuid, candidate_id uuid, votes bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_status public.election_status;
begin
  select status into v_status from public.elections where id = p_election;
  if v_status is null then
    return;
  end if;
  if not (public.is_staff() or v_status in ('closed', 'results_published', 'archived')) then
    return; -- secrecy: no peeking before close
  end if;
  return query
    select v.position_id, v.candidate_id, count(*)::bigint
    from public.votes v
    where v.election_id = p_election
    group by v.position_id, v.candidate_id;
end;
$$;

grant execute on function public.get_election_results(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- election_turnout — eligible vs voted (no choice data; safe to expose).
-- ----------------------------------------------------------------------------
create or replace function public.election_turnout(p_election uuid)
returns table (eligible bigint, voted bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.users where is_active and role in ('member','moderator','admin'))::bigint,
    (select count(*) from public.vote_receipts where election_id = p_election)::bigint;
$$;

grant execute on function public.election_turnout(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- has_voted — lets a member know if they've already voted (no choice data).
-- ----------------------------------------------------------------------------
create or replace function public.has_voted(p_election uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.vote_receipts
    where election_id = p_election and voter_id = auth.uid()
  );
$$;

grant execute on function public.has_voted(uuid) to authenticated;

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.election_terms        enable row level security;
alter table public.elections             enable row level security;
alter table public.positions             enable row level security;
alter table public.candidate_nominations enable row level security;
alter table public.votes                 enable row level security;
alter table public.vote_receipts         enable row level security;
alter table public.result_snapshots      enable row level security;
alter table public.committee_assignments enable row level security;

-- terms — public read, staff manage
drop policy if exists terms_read on public.election_terms;
create policy terms_read on public.election_terms for select to anon, authenticated using (true);
drop policy if exists terms_write on public.election_terms;
create policy terms_write on public.election_terms for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- elections — non-draft public; staff manage
drop policy if exists elections_read on public.elections;
create policy elections_read on public.elections
  for select to anon, authenticated using (status <> 'draft' or public.is_staff());
drop policy if exists elections_write on public.elections;
create policy elections_write on public.elections
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- positions — visible with their election; staff manage
drop policy if exists positions_read on public.positions;
create policy positions_read on public.positions
  for select to anon, authenticated
  using (
    public.is_staff()
    or exists (select 1 from public.elections e where e.id = election_id and e.status <> 'draft')
  );
drop policy if exists positions_write on public.positions;
create policy positions_write on public.positions
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- nominations — approved public; own; staff all
drop policy if exists nom_read on public.candidate_nominations;
create policy nom_read on public.candidate_nominations
  for select to anon, authenticated
  using (
    member_id = auth.uid()
    or public.is_staff()
    or (
      status = 'approved'
      and exists (select 1 from public.elections e where e.id = election_id and e.status <> 'draft')
    )
  );
drop policy if exists nom_insert on public.candidate_nominations;
create policy nom_insert on public.candidate_nominations
  for insert to authenticated with check (member_id = auth.uid());
drop policy if exists nom_update_self on public.candidate_nominations;
create policy nom_update_self on public.candidate_nominations
  for update to authenticated
  using (member_id = auth.uid() and status in ('draft', 'submitted'))
  with check (member_id = auth.uid() and status in ('draft', 'submitted', 'withdrawn'));
drop policy if exists nom_update_staff on public.candidate_nominations;
create policy nom_update_staff on public.candidate_nominations
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists nom_delete on public.candidate_nominations;
create policy nom_delete on public.candidate_nominations
  for delete to authenticated
  using ((member_id = auth.uid() and status = 'draft') or public.is_admin());

-- votes — NO policies on purpose. All access is via SECURITY DEFINER functions.

-- vote_receipts — own or staff read; writes via function only
drop policy if exists receipts_read on public.vote_receipts;
create policy receipts_read on public.vote_receipts
  for select to authenticated using (voter_id = auth.uid() or public.is_staff());

-- result_snapshots — published public; staff manage
drop policy if exists results_read on public.result_snapshots;
create policy results_read on public.result_snapshots
  for select to anon, authenticated using (published or public.is_staff());
drop policy if exists results_write on public.result_snapshots;
create policy results_write on public.result_snapshots
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- committee — public read; staff manage
drop policy if exists committee_read on public.committee_assignments;
create policy committee_read on public.committee_assignments
  for select to anon, authenticated using (true);
drop policy if exists committee_write on public.committee_assignments;
create policy committee_write on public.committee_assignments
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
