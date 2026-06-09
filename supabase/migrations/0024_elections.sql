-- =============================================================================
-- 0024 — Digital Elections & Democratic Governance
-- Secret-ballot design: `votes` carry NO voter reference (RLS denies all direct
-- access); `vote_receipts` track WHO voted (one per member per election) but not
-- their choice. Voting happens only via the SECURITY DEFINER cast_vote() RPC.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.election_status as enum (
    'draft', 'nominations', 'voting', 'closed', 'results_published', 'archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.nomination_status as enum (
    'draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.committee_member_status as enum ('active', 'resigned', 'replaced');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- election_terms
-- ----------------------------------------------------------------------------
create table if not exists public.election_terms (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  starts_on  date,
  ends_on    date,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- elections
-- ----------------------------------------------------------------------------
create table if not exists public.elections (
  id                  uuid primary key default gen_random_uuid(),
  term_id             uuid references public.election_terms (id) on delete set null,
  slug                text not null unique,
  title               text not null,
  description         text,
  status              public.election_status not null default 'draft',
  nominations_open_at timestamptz,
  nominations_close_at timestamptz,
  voting_open_at      timestamptz,
  voting_close_at     timestamptz,
  created_by          uuid references public.users (id) on delete set null,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz,
  check (voting_close_at is null or voting_open_at is null or voting_close_at > voting_open_at)
);
create index if not exists elections_status_idx on public.elections (status);

-- ----------------------------------------------------------------------------
-- positions (offices contested)
-- ----------------------------------------------------------------------------
create table if not exists public.positions (
  id          uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections (id) on delete cascade,
  title       text not null,
  description text,
  seats       int not null default 1 check (seats >= 1),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists positions_election_idx on public.positions (election_id, sort_order);

-- ----------------------------------------------------------------------------
-- candidate_nominations
-- ----------------------------------------------------------------------------
create table if not exists public.candidate_nominations (
  id           uuid primary key default gen_random_uuid(),
  election_id  uuid not null references public.elections (id) on delete cascade,
  position_id  uuid not null references public.positions (id) on delete cascade,
  member_id    uuid not null references public.users (id) on delete cascade,
  slogan       text,
  manifesto    text,
  vision       text,
  goals        text,
  photo_url    text,
  banner_url   text,
  status       public.nomination_status not null default 'draft',
  review_note  text,
  reviewed_by  uuid references public.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz,
  unique (election_id, position_id, member_id)
);
create index if not exists nominations_election_idx on public.candidate_nominations (election_id, status);
create index if not exists nominations_position_idx on public.candidate_nominations (position_id, status);
create index if not exists nominations_member_idx   on public.candidate_nominations (member_id);

-- ----------------------------------------------------------------------------
-- votes (anonymous — no voter column, no direct access)
-- ----------------------------------------------------------------------------
create table if not exists public.votes (
  id           uuid primary key default gen_random_uuid(),
  election_id  uuid not null references public.elections (id) on delete cascade,
  position_id  uuid not null references public.positions (id) on delete cascade,
  candidate_id uuid not null references public.candidate_nominations (id) on delete cascade,
  created_at   timestamptz not null default now()
);
create index if not exists votes_tally_idx on public.votes (election_id, position_id, candidate_id);

-- ----------------------------------------------------------------------------
-- vote_receipts (who voted — NOT what they chose). One per member per election.
-- ----------------------------------------------------------------------------
create table if not exists public.vote_receipts (
  id             uuid primary key default gen_random_uuid(),
  election_id    uuid not null references public.elections (id) on delete cascade,
  voter_id       uuid not null references public.users (id) on delete cascade,
  receipt_code   text not null unique,
  positions_voted int not null default 0,
  created_at     timestamptz not null default now(),
  unique (election_id, voter_id)
);
create index if not exists receipts_election_idx on public.vote_receipts (election_id);

-- ----------------------------------------------------------------------------
-- result_snapshots
-- ----------------------------------------------------------------------------
create table if not exists public.result_snapshots (
  id          uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections (id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  published   boolean not null default false,
  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists results_election_idx on public.result_snapshots (election_id);

-- ----------------------------------------------------------------------------
-- committee_assignments (elected committee for a term)
-- ----------------------------------------------------------------------------
create table if not exists public.committee_assignments (
  id          uuid primary key default gen_random_uuid(),
  election_id uuid references public.elections (id) on delete set null,
  term_id     uuid references public.election_terms (id) on delete set null,
  position_id uuid references public.positions (id) on delete set null,
  member_id   uuid not null references public.users (id) on delete cascade,
  role_title  text not null,
  status      public.committee_member_status not null default 'active',
  started_on  date not null default current_date,
  ended_on    date,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists committee_term_idx on public.committee_assignments (term_id, sort_order);
create index if not exists committee_election_idx on public.committee_assignments (election_id);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
drop trigger if exists set_elections_updated_at on public.elections;
create trigger set_elections_updated_at before update on public.elections
  for each row execute function public.set_updated_at();
drop trigger if exists set_nominations_updated_at on public.candidate_nominations;
create trigger set_nominations_updated_at before update on public.candidate_nominations
  for each row execute function public.set_updated_at();
