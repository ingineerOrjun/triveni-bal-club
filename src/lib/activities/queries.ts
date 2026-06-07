import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  ActivityRow,
  ActivityCategoryRow,
  ActivityParticipantRow,
} from "@/types/database";

export type ActivityWithCategory = ActivityRow & {
  category: ActivityCategoryRow | null;
};

export type MemberActivity = {
  participant: ActivityParticipantRow;
  activity: ActivityRow;
};

export async function listCategories(): Promise<ActivityCategoryRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data as ActivityCategoryRow[] | null) ?? [];
}

/**
 * List activities. RLS decides visibility: anonymous/members see only
 * published; staff see everything (incl. drafts/archived).
 */
export async function listActivities(): Promise<ActivityWithCategory[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false });
  const activities = (rows as ActivityRow[] | null) ?? [];
  if (activities.length === 0) return [];

  const categories = await listCategories();
  const byId = new Map(categories.map((c) => [c.id, c]));
  return activities.map((a) => ({
    ...a,
    category: a.category_id ? byId.get(a.category_id) ?? null : null,
  }));
}

export async function getActivityById(
  id: string
): Promise<ActivityWithCategory | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const activity = data as ActivityRow | null;
  if (!activity) return null;
  const categories = await listCategories();
  return {
    ...activity,
    category:
      categories.find((c) => c.id === activity.category_id) ?? null,
  };
}

/** Activities the member has joined. */
export async function listMemberActivities(
  memberId: string
): Promise<MemberActivity[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data: parts } = await supabase
    .from("activity_participants")
    .select("*")
    .eq("member_id", memberId);
  const participants = (parts as ActivityParticipantRow[] | null) ?? [];
  if (participants.length === 0) return [];

  const ids = participants.map((p) => p.activity_id);
  const { data: acts } = await supabase
    .from("activities")
    .select("*")
    .in("id", ids);
  const activities = (acts as ActivityRow[] | null) ?? [];
  const byId = new Map(activities.map((a) => [a.id, a]));

  return participants
    .map((p) => {
      const activity = byId.get(p.activity_id);
      return activity ? { participant: p, activity } : null;
    })
    .filter((x): x is MemberActivity => x !== null);
}

/** Set of activity ids the member currently participates in. */
export async function getJoinedActivityIds(
  memberId: string
): Promise<Set<string>> {
  if (!isSupabaseConfigured()) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_participants")
    .select("activity_id")
    .eq("member_id", memberId);
  const rows = (data as { activity_id: string }[] | null) ?? [];
  return new Set(rows.map((r) => r.activity_id));
}
