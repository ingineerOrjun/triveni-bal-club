import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  ElectionRow,
  PositionRow,
  CandidateNominationRow,
  ResultSnapshotRow,
  CommitteeAssignmentRow,
  UsersRow,
} from "@/types/database";

export type MemberRef = Pick<UsersRow, "id" | "full_name">;
export type CandidateView = CandidateNominationRow & { memberName: string | null };
export type PositionWithCandidates = PositionRow & { candidates: CandidateView[] };
export type ElectionDetail = ElectionRow & {
  positions: PositionWithCandidates[];
};
export type ElectionWithCounts = ElectionRow & {
  positionCount: number;
  candidateCount: number;
};

type Rpc = (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;

async function namesByIds(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const clean = Array.from(new Set(ids.filter(Boolean)));
  if (clean.length === 0) return map;
  const supabase = await createClient();
  const { data } = await supabase.from("users").select("id, full_name").in("id", clean);
  for (const u of (data as MemberRef[] | null) ?? []) map.set(u.id, u.full_name);
  return map;
}

export async function listElections(): Promise<ElectionWithCounts[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("elections")
    .select("*")
    .order("created_at", { ascending: false });
  const elections = (data as ElectionRow[] | null) ?? [];
  if (elections.length === 0) return [];

  const ids = elections.map((e) => e.id);
  const [{ data: pos }, { data: noms }] = await Promise.all([
    supabase.from("positions").select("election_id").in("election_id", ids),
    supabase.from("candidate_nominations").select("election_id, status").in("election_id", ids).eq("status", "approved"),
  ]);
  const posCount = new Map<string, number>();
  for (const p of (pos as { election_id: string }[] | null) ?? [])
    posCount.set(p.election_id, (posCount.get(p.election_id) ?? 0) + 1);
  const candCount = new Map<string, number>();
  for (const n of (noms as { election_id: string }[] | null) ?? [])
    candCount.set(n.election_id, (candCount.get(n.election_id) ?? 0) + 1);

  return elections.map((e) => ({
    ...e,
    positionCount: posCount.get(e.id) ?? 0,
    candidateCount: candCount.get(e.id) ?? 0,
  }));
}

async function buildDetail(
  election: ElectionRow,
  opts: { approvedOnly: boolean }
): Promise<ElectionDetail> {
  const supabase = await createClient();
  const { data: posRows } = await supabase
    .from("positions")
    .select("*")
    .eq("election_id", election.id)
    .order("sort_order", { ascending: true });
  const positions = (posRows as PositionRow[] | null) ?? [];

  let nq = supabase
    .from("candidate_nominations")
    .select("*")
    .eq("election_id", election.id);
  if (opts.approvedOnly) nq = nq.eq("status", "approved");
  const { data: nomRows } = await nq.order("created_at", { ascending: true });
  const noms = (nomRows as CandidateNominationRow[] | null) ?? [];

  const names = await namesByIds(noms.map((n) => n.member_id));
  const byPosition = new Map<string, CandidateView[]>();
  for (const n of noms) {
    const arr = byPosition.get(n.position_id) ?? [];
    arr.push({ ...n, memberName: names.get(n.member_id) ?? null });
    byPosition.set(n.position_id, arr);
  }

  return {
    ...election,
    positions: positions.map((p) => ({ ...p, candidates: byPosition.get(p.id) ?? [] })),
  };
}

export async function getElectionBySlug(slug: string): Promise<ElectionDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("elections").select("*").eq("slug", slug).maybeSingle();
  const e = data as ElectionRow | null;
  return e ? buildDetail(e, { approvedOnly: true }) : null;
}

export async function getElectionById(
  id: string,
  approvedOnly = false
): Promise<ElectionDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("elections").select("*").eq("id", id).maybeSingle();
  const e = data as ElectionRow | null;
  return e ? buildDetail(e, { approvedOnly }) : null;
}

export async function listMyNominations(memberId: string): Promise<CandidateNominationRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("candidate_nominations")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });
  return (data as CandidateNominationRow[] | null) ?? [];
}

export interface ResultRow {
  candidate: CandidateView;
  votes: number;
}
export interface PositionResult {
  position: PositionRow;
  rows: ResultRow[];
  winnerIds: string[];
}

export async function getResults(electionId: string): Promise<PositionResult[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const rpc = supabase.rpc.bind(supabase) as Rpc;
  const { data } = await rpc("get_election_results", { p_election: electionId });
  const tallies = (data as { position_id: string; candidate_id: string; votes: number }[] | null) ?? [];

  const detail = await getElectionById(electionId, false);
  if (!detail) return [];
  const candById = new Map<string, CandidateView>();
  for (const p of detail.positions) for (const c of p.candidates) candById.set(c.id, c);

  const votesByPos = new Map<string, Map<string, number>>();
  for (const t of tallies) {
    const m = votesByPos.get(t.position_id) ?? new Map<string, number>();
    m.set(t.candidate_id, Number(t.votes));
    votesByPos.set(t.position_id, m);
  }

  return detail.positions.map((p) => {
    const counts = votesByPos.get(p.id) ?? new Map();
    const rows: ResultRow[] = p.candidates
      .map((c) => ({ candidate: c, votes: counts.get(c.id) ?? 0 }))
      .sort((a, b) => b.votes - a.votes);
    // Winners = top `seats`, but only those with >0 votes; ties surface as
    // multiple at the boundary (commissioner resolves manually).
    const topVotes = rows.slice(0, p.seats).map((r) => r.votes);
    const cutoff = topVotes.length ? topVotes[topVotes.length - 1] : 0;
    const winnerIds = rows.filter((r) => r.votes > 0 && r.votes >= cutoff).map((r) => r.candidate.id);
    return { position: p, rows, winnerIds };
  });
}

export async function getTurnout(electionId: string): Promise<{ eligible: number; voted: number }> {
  if (!isSupabaseConfigured()) return { eligible: 0, voted: 0 };
  const supabase = await createClient();
  const rpc = supabase.rpc.bind(supabase) as Rpc;
  const { data } = await rpc("election_turnout", { p_election: electionId });
  const row = (data as { eligible: number; voted: number }[] | null)?.[0];
  return { eligible: Number(row?.eligible ?? 0), voted: Number(row?.voted ?? 0) };
}

export async function hasVoted(electionId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = await createClient();
  const rpc = supabase.rpc.bind(supabase) as Rpc;
  const { data } = await rpc("has_voted", { p_election: electionId });
  return Boolean(data);
}

export async function getReceipt(electionId: string, memberId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("vote_receipts")
    .select("receipt_code")
    .eq("election_id", electionId)
    .eq("voter_id", memberId)
    .maybeSingle();
  return (data as { receipt_code: string } | null)?.receipt_code ?? null;
}

export async function listCommittee(): Promise<(CommitteeAssignmentRow & { memberName: string | null })[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("committee_assignments")
    .select("*")
    .eq("status", "active")
    .order("sort_order", { ascending: true });
  const rows = (data as CommitteeAssignmentRow[] | null) ?? [];
  const names = await namesByIds(rows.map((r) => r.member_id));
  return rows.map((r) => ({ ...r, memberName: names.get(r.member_id) ?? null }));
}
