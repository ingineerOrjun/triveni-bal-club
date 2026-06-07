import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  AchievementCategoryRow,
  BadgeRow,
  MemberBadgeRow,
  MemberAchievementRow,
  CertificateRow,
  RecognitionProgramRow,
  RecognitionAwardRow,
  UsersRow,
} from "@/types/database";

export type MemberRef = Pick<UsersRow, "id" | "full_name" | "email">;
export type MemberBadgeView = MemberBadgeRow & { badge: BadgeRow | null };
export type AchievementView = MemberAchievementRow & {
  category: AchievementCategoryRow | null;
  member: MemberRef | null;
};
export type CertificateView = CertificateRow & { recipient: MemberRef | null };
export type AwardView = RecognitionAwardRow & {
  member: MemberRef | null;
  program: RecognitionProgramRow | null;
};
export type HallOfFameEntry = { member: MemberRef; badgeCount: number };
export type VerifiedCertificate = {
  certificate_number: string;
  title: string;
  recipient_name: string;
  issued_date: string;
  valid: boolean;
};

async function membersByIds(ids: string[]): Promise<Map<string, MemberRef>> {
  const map = new Map<string, MemberRef>();
  if (ids.length === 0) return map;
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, full_name, email")
    .in("id", Array.from(new Set(ids)));
  for (const m of (data as MemberRef[] | null) ?? []) map.set(m.id, m);
  return map;
}

/* ------------------------------- catalog ---------------------------------- */
export async function listAchievementCategories(): Promise<
  AchievementCategoryRow[]
> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("achievement_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data as AchievementCategoryRow[] | null) ?? [];
}

export async function listBadges(activeOnly = false): Promise<BadgeRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let query = supabase.from("badges").select("*").order("name", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);
  const { data } = await query;
  return (data as BadgeRow[] | null) ?? [];
}

export async function getBadgeById(id: string): Promise<BadgeRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("badges").select("*").eq("id", id).maybeSingle();
  return (data as BadgeRow | null) ?? null;
}

/* --------------------------- member-facing reads -------------------------- */
export async function listMemberBadges(
  memberId: string
): Promise<MemberBadgeView[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("member_badges")
    .select("*")
    .eq("member_id", memberId)
    .eq("status", "awarded")
    .order("awarded_at", { ascending: false });
  const rows = (data as MemberBadgeRow[] | null) ?? [];
  if (rows.length === 0) return [];

  const { data: badgeRows } = await supabase
    .from("badges")
    .select("*")
    .in("id", rows.map((r) => r.badge_id));
  const byId = new Map(
    ((badgeRows as BadgeRow[] | null) ?? []).map((b) => [b.id, b])
  );
  return rows.map((r) => ({ ...r, badge: byId.get(r.badge_id) ?? null }));
}

export async function listMemberAchievements(
  memberId: string
): Promise<AchievementView[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("member_achievements")
    .select("*")
    .eq("member_id", memberId)
    .order("award_date", { ascending: false });
  return decorateAchievements((data as MemberAchievementRow[] | null) ?? []);
}

export async function listMemberCertificates(
  memberId: string
): Promise<CertificateRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("certificates")
    .select("*")
    .eq("recipient_id", memberId)
    .order("issued_date", { ascending: false });
  return (data as CertificateRow[] | null) ?? [];
}

/* ------------------------------- staff reads ------------------------------ */
async function decorateAchievements(
  rows: MemberAchievementRow[]
): Promise<AchievementView[]> {
  if (rows.length === 0) return [];
  const categories = await listAchievementCategories();
  const catById = new Map(categories.map((c) => [c.id, c]));
  const members = await membersByIds(rows.map((r) => r.member_id));
  return rows.map((r) => ({
    ...r,
    category: r.category_id ? catById.get(r.category_id) ?? null : null,
    member: members.get(r.member_id) ?? null,
  }));
}

export async function listAllAchievements(): Promise<AchievementView[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("member_achievements")
    .select("*")
    .order("created_at", { ascending: false });
  return decorateAchievements((data as MemberAchievementRow[] | null) ?? []);
}

export async function listAllCertificates(): Promise<CertificateView[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("certificates")
    .select("*")
    .order("issued_date", { ascending: false });
  const rows = (data as CertificateRow[] | null) ?? [];
  const members = await membersByIds(rows.map((r) => r.recipient_id));
  return rows.map((r) => ({ ...r, recipient: members.get(r.recipient_id) ?? null }));
}

/** Active members for recipient pickers (staff only). */
export async function listMemberOptions(): Promise<MemberRef[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, full_name, email")
    .eq("role", "member")
    .eq("is_active", true)
    .order("full_name", { ascending: true });
  return (data as MemberRef[] | null) ?? [];
}

/* --------------------------- recognition programs ------------------------- */
export async function listPrograms(): Promise<RecognitionProgramRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("recognition_programs")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as RecognitionProgramRow[] | null) ?? [];
}

export async function getProgramById(
  id: string
): Promise<RecognitionProgramRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("recognition_programs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as RecognitionProgramRow | null) ?? null;
}

export async function listAwards(programId?: string): Promise<AwardView[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let query = supabase
    .from("recognition_awards")
    .select("*")
    .order("awarded_at", { ascending: false });
  if (programId) query = query.eq("program_id", programId);
  const { data } = await query;
  const rows = (data as RecognitionAwardRow[] | null) ?? [];
  if (rows.length === 0) return [];

  const members = await membersByIds(rows.map((r) => r.member_id));
  const programs = await listPrograms();
  const progById = new Map(programs.map((p) => [p.id, p]));
  return rows.map((r) => ({
    ...r,
    member: members.get(r.member_id) ?? null,
    program: progById.get(r.program_id) ?? null,
  }));
}

/* ------------------------------- public views ----------------------------- */
export async function listPublicAchievements(
  limit = 24
): Promise<AchievementView[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("member_achievements")
    .select("*")
    .eq("visibility", "public")
    .eq("status", "awarded")
    .order("award_date", { ascending: false })
    .limit(limit);
  return decorateAchievements((data as MemberAchievementRow[] | null) ?? []);
}

/** Top badge earners for the hall of fame. */
export async function getHallOfFame(limit = 10): Promise<HallOfFameEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("member_badges")
    .select("member_id")
    .eq("status", "awarded");
  const counts = new Map<string, number>();
  for (const r of (data as { member_id: string }[] | null) ?? []) {
    counts.set(r.member_id, (counts.get(r.member_id) ?? 0) + 1);
  }
  const top = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  const members = await membersByIds(top.map(([id]) => id));
  return top
    .map(([id, badgeCount]) => {
      const member = members.get(id);
      return member ? { member, badgeCount } : null;
    })
    .filter((x): x is HallOfFameEntry => x !== null);
}

/** Public certificate verification via the SECURITY DEFINER RPC. */
export async function verifyCertificate(
  code: string
): Promise<VerifiedCertificate | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const rpc = supabase.rpc.bind(supabase) as (
    fn: string,
    args: Record<string, unknown>
  ) => PromiseLike<{ data: VerifiedCertificate[] | null; error: unknown }>;
  const { data } = await rpc("verify_certificate", { p_code: code });
  return data && data.length > 0 ? data[0] : null;
}
