"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth/session";
import { requireStaffUser } from "@/lib/auth/guards";
import { logAudit } from "@/lib/supabase/audit";
import { slugify } from "@/lib/utils";
import { type FormState, zodFieldErrors } from "@/lib/forms";
import { getResults } from "./queries";
import {
  electionInputSchema,
  positionInputSchema,
  nominationInputSchema,
} from "./schema";
import type { ElectionStatus, ElectionUpdate, NominationStatus } from "@/types/database";

type Rpc = (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;

/* ------------------------------ admin: setup ----------------------------- */
export async function createElection(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "You don't have permission to do that." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = electionInputSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const supabase = await createClient();
  const slug = `${slugify(parsed.data.title)}-${crypto.randomUUID().slice(0, 5)}`;
  const { data, error } = await supabase
    .from("elections")
    .insert({
      slug,
      title: parsed.data.title,
      description: parsed.data.description || null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not create the election." };

  await logAudit(supabase, "election.create", "election", (data as { id: string }).id);
  revalidatePath("/admin/elections");
  redirect(`/admin/elections/${(data as { id: string }).id}`);
}

export async function addPosition(
  electionId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "Not allowed." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };
  const parsed = positionInputSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    seats: formData.get("seats") ?? 1,
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const supabase = await createClient();
  const { count } = await supabase
    .from("positions")
    .select("*", { count: "exact", head: true })
    .eq("election_id", electionId);
  await supabase.from("positions").insert({
    election_id: electionId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    seats: parsed.data.seats,
    sort_order: count ?? 0,
  });
  await logAudit(supabase, "election.position_add", "election", electionId);
  revalidatePath(`/admin/elections/${electionId}`);
  return { message: "Position added." };
}

export async function deletePosition(id: string, electionId: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("positions").delete().eq("id", id);
  await logAudit(supabase, "election.position_delete", "election", electionId);
  revalidatePath(`/admin/elections/${electionId}`);
}

export async function setElectionStatus(id: string, status: ElectionStatus) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  const patch: ElectionUpdate = { status };
  const nowIso = new Date().toISOString();
  if (status === "nominations") patch.nominations_open_at = nowIso;
  if (status === "voting") patch.voting_open_at = nowIso;
  if (status === "closed") patch.voting_close_at = nowIso;
  await supabase.from("elections").update(patch).eq("id", id);
  await logAudit(supabase, `election.status_${status}`, "election", id);
  revalidatePath(`/admin/elections/${id}`);
  revalidatePath("/admin/elections");
  revalidatePath("/elections");
}

/* ---------------------------- candidate review --------------------------- */
export async function reviewNomination(
  id: string,
  electionId: string,
  decision: NominationStatus,
  note?: string
) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase
    .from("candidate_nominations")
    .update({ status: decision, review_note: note ?? null, reviewed_by: user.id })
    .eq("id", id);
  await logAudit(supabase, `nomination.${decision}`, "nomination", id);
  revalidatePath(`/admin/elections/${electionId}`);
}

/* --------------------------- member: nominate ---------------------------- */
export async function submitNomination(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = nominationInputSchema.safeParse({
    election_id: formData.get("election_id"),
    position_id: formData.get("position_id"),
    slogan: formData.get("slogan") ?? "",
    manifesto: formData.get("manifesto") ?? "",
    vision: formData.get("vision") ?? "",
    goals: formData.get("goals") ?? "",
    photo_url: formData.get("photo_url") ?? "",
    banner_url: formData.get("banner_url") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const asDraft = formData.get("intent") === "draft";
  const supabase = await createClient();
  const { error } = await supabase.from("candidate_nominations").upsert(
    {
      election_id: parsed.data.election_id,
      position_id: parsed.data.position_id,
      member_id: user.id,
      slogan: parsed.data.slogan || null,
      manifesto: parsed.data.manifesto || null,
      vision: parsed.data.vision || null,
      goals: parsed.data.goals || null,
      photo_url: parsed.data.photo_url || null,
      banner_url: parsed.data.banner_url || null,
      status: asDraft ? "draft" : "submitted",
    },
    { onConflict: "election_id,position_id,member_id" }
  );
  if (error) return { error: "Could not submit your nomination." };

  await logAudit(supabase, asDraft ? "nomination.draft" : "nomination.submit", "election", parsed.data.election_id);
  revalidatePath("/portal/elections");
  redirect("/portal/elections");
}

export async function withdrawNomination(id: string) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase
    .from("candidate_nominations")
    .update({ status: "withdrawn" })
    .eq("id", id)
    .eq("member_id", user.id);
  await logAudit(supabase, "nomination.withdraw", "nomination", id);
  revalidatePath("/portal/elections");
}

/* -------------------------------- voting --------------------------------- */
export async function castVote(
  electionId: string,
  choices: { position_id: string; candidate_id: string }[]
): Promise<{ ok: boolean; code?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to vote." };
  if (!isSupabaseConfigured()) return { ok: false, error: "Backend not configured." };
  if (!Array.isArray(choices) || choices.length === 0)
    return { ok: false, error: "Select at least one candidate." };

  const supabase = await createClient();
  const rpc = supabase.rpc.bind(supabase) as Rpc;
  const { data, error } = await rpc("cast_vote", { p_election: electionId, p_choices: choices });
  if (error) return { ok: false, error: error.message ?? "Could not record your vote." };

  await logAudit(supabase, "election.vote", "election", electionId);
  revalidatePath(`/portal/elections/${electionId}`);
  revalidatePath("/portal/elections");
  return { ok: true, code: typeof data === "string" ? data : undefined };
}

/* ------------------------------- results --------------------------------- */
export async function publishResults(id: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();

  const results = await getResults(id);
  const data = {
    positions: results.map((r) => ({
      positionId: r.position.id,
      title: r.position.title,
      seats: r.position.seats,
      winnerIds: r.winnerIds,
      rows: r.rows.map((row) => ({
        candidateId: row.candidate.id,
        name: row.candidate.memberName,
        votes: row.votes,
      })),
    })),
  };

  await supabase.from("result_snapshots").insert({
    election_id: id,
    data,
    published: true,
    created_by: user.id,
  });
  await supabase
    .from("elections")
    .update({ status: "results_published", published_at: new Date().toISOString() })
    .eq("id", id);
  await logAudit(supabase, "election.publish_results", "election", id);
  revalidatePath(`/admin/elections/${id}`);
  revalidatePath("/admin/elections");
  revalidatePath("/elections");
}

/* --------------------------- committee generation ------------------------ */
export async function generateCommittee(id: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();

  const election = await supabase.from("elections").select("term_id").eq("id", id).maybeSingle();
  const termId = (election.data as { term_id: string | null } | null)?.term_id ?? null;

  // Idempotent: clear any previously generated committee for this election.
  await supabase.from("committee_assignments").delete().eq("election_id", id);

  const results = await getResults(id);
  let sort = 0;
  for (const r of results) {
    for (const winnerId of r.winnerIds) {
      const cand = r.rows.find((row) => row.candidate.id === winnerId)?.candidate;
      if (!cand) continue;
      await supabase.from("committee_assignments").insert({
        election_id: id,
        term_id: termId,
        position_id: r.position.id,
        member_id: cand.member_id,
        role_title: r.position.title,
        sort_order: sort++,
      });
    }
  }
  await logAudit(supabase, "election.generate_committee", "election", id);
  revalidatePath(`/admin/elections/${id}`);
  revalidatePath("/committee");
}
