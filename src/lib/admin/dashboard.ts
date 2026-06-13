import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { COMMITTEE } from "@/content/committee";
import type {
  AuditLogsRow,
  SuggestionStatus,
  ContentStatus,
} from "@/types/database";

export interface DashboardStats {
  members: number;
  committee: number;
  activities: number;
  upcomingEvents: number;
  suggestionsPending: number;
  certificates: number;
  badgesAwarded: number;
  achievements: number;
  programs: number;
  pendingApprovals: number;
  magazineDrafts: number;
  magazineInReview: number;
  magazineCommentsPending: number;
  activeElections: number;
  nominationsSubmitted: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentAudit: AuditLogsRow[];
  suggestionsByStatus: { label: string; value: number }[];
  activitiesByStatus: { label: string; value: number }[];
  recentMembers: { id: string; full_name: string; created_at: string }[];
}

const EMPTY: DashboardData = {
  stats: {
    members: 0,
    committee: COMMITTEE.filter((m) => m.kind !== "advisor").length,
    activities: 0,
    upcomingEvents: 0,
    suggestionsPending: 0,
    certificates: 0,
    badgesAwarded: 0,
    achievements: 0,
    programs: 0,
    pendingApprovals: 0,
    magazineDrafts: 0,
    magazineInReview: 0,
    magazineCommentsPending: 0,
    activeElections: 0,
    nominationsSubmitted: 0,
  },
  recentAudit: [],
  suggestionsByStatus: [],
  activitiesByStatus: [],
  recentMembers: [],
};

export async function getDashboardData(): Promise<DashboardData> {
  if (!isSupabaseConfigured()) return EMPTY;
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const headCount = (build: () => PromiseLike<{ count: number | null }>) =>
    build().then((r) => r.count ?? 0);

  const [
    members,
    activities,
    upcomingEvents,
    suggestionsPending,
    certificates,
    badgesAwarded,
    achievements,
    programs,
    recAch,
    recBadge,
    submittedSug,
    magazineDrafts,
    magazineInReview,
    magazineCommentsPending,
    activeElections,
    nominationsSubmitted,
  ] = await Promise.all([
    headCount(() =>
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "member")
    ),
    headCount(() =>
      supabase.from("activities").select("*", { count: "exact", head: true }).eq("status", "published")
    ),
    headCount(() =>
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("status", "published")
        .gte("starts_at", nowIso)
    ),
    headCount(() =>
      supabase
        .from("suggestions")
        .select("*", { count: "exact", head: true })
        .in("status", ["submitted", "under_review"])
    ),
    headCount(() =>
      supabase.from("certificates").select("*", { count: "exact", head: true })
    ),
    headCount(() =>
      supabase.from("member_badges").select("*", { count: "exact", head: true }).eq("status", "awarded")
    ),
    headCount(() =>
      supabase.from("member_achievements").select("*", { count: "exact", head: true }).eq("status", "awarded")
    ),
    headCount(() =>
      supabase.from("recognition_programs").select("*", { count: "exact", head: true })
    ),
    headCount(() =>
      supabase.from("member_achievements").select("*", { count: "exact", head: true }).eq("status", "recommended")
    ),
    headCount(() =>
      supabase.from("member_badges").select("*", { count: "exact", head: true }).eq("status", "recommended")
    ),
    headCount(() =>
      supabase.from("suggestions").select("*", { count: "exact", head: true }).eq("status", "submitted")
    ),
    headCount(() =>
      supabase.from("magazine_articles").select("*", { count: "exact", head: true }).eq("status", "draft")
    ),
    headCount(() =>
      supabase
        .from("magazine_articles")
        .select("*", { count: "exact", head: true })
        .in("status", ["review", "revision_required"])
    ),
    headCount(() =>
      supabase.from("magazine_comments").select("*", { count: "exact", head: true }).eq("status", "pending")
    ),
    headCount(() =>
      supabase
        .from("elections")
        .select("*", { count: "exact", head: true })
        .in("status", ["nominations", "voting", "closed"])
    ),
    headCount(() =>
      supabase
        .from("candidate_nominations")
        .select("*", { count: "exact", head: true })
        .in("status", ["submitted", "under_review"])
    ),
  ]);

  const [{ data: audit }, { data: sugStatuses }, { data: actStatuses }, { data: recent }] =
    await Promise.all([
      supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("suggestions").select("status"),
      supabase.from("activities").select("status"),
      supabase
        .from("users")
        .select("id, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const tally = <T extends string>(rows: { status: T }[] | null) => {
    const m = new Map<T, number>();
    for (const r of rows ?? []) m.set(r.status, (m.get(r.status) ?? 0) + 1);
    return m;
  };
  const sugMap = tally<SuggestionStatus>(sugStatuses as { status: SuggestionStatus }[] | null);
  const actMap = tally<ContentStatus>(actStatuses as { status: ContentStatus }[] | null);

  return {
    stats: {
      members,
      committee: COMMITTEE.filter((m) => m.kind !== "advisor").length,
      activities,
      upcomingEvents,
      suggestionsPending,
      certificates,
      badgesAwarded,
      achievements,
      programs,
      pendingApprovals:
        recAch + recBadge + submittedSug + magazineInReview + magazineCommentsPending + nominationsSubmitted,
      magazineDrafts,
      magazineInReview,
      magazineCommentsPending,
      activeElections,
      nominationsSubmitted,
    },
    recentAudit: (audit as AuditLogsRow[] | null) ?? [],
    suggestionsByStatus: (
      ["submitted", "under_review", "accepted", "in_progress", "implemented", "rejected"] as SuggestionStatus[]
    ).map((s) => ({ label: s.replace(/_/g, " "), value: sugMap.get(s) ?? 0 })),
    activitiesByStatus: (["draft", "published", "archived"] as ContentStatus[]).map(
      (s) => ({ label: s, value: actMap.get(s) ?? 0 })
    ),
    recentMembers:
      (recent as { id: string; full_name: string; created_at: string }[] | null) ?? [],
  };
}
