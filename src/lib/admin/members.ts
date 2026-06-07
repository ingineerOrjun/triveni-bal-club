import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  UsersRow,
  MemberProfilesRow,
  UserRole,
  MembershipStatus,
} from "@/types/database";

export interface MemberRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  classLevel: string | null;
  section: string | null;
  membershipStatus: MembershipStatus | null;
}

export interface MemberFilters {
  q?: string;
  role?: string;
  status?: string; // membership status
  active?: string; // "active" | "inactive"
  page?: number;
  pageSize?: number;
}

const PAGE_SIZE = 20;

export async function listMembers(
  filters: MemberFilters
): Promise<{ items: MemberRow[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? PAGE_SIZE;
  if (!isSupabaseConfigured()) return { items: [], total: 0, page, pageSize };
  const supabase = await createClient();

  let q = supabase
    .from("users")
    .select("id, full_name, email, role, is_active, created_at", { count: "exact" });
  if (filters.role) q = q.eq("role", filters.role as UserRole);
  if (filters.active === "active") q = q.eq("is_active", true);
  if (filters.active === "inactive") q = q.eq("is_active", false);
  if (filters.q) q = q.or(`full_name.ilike.%${filters.q}%,email.ilike.%${filters.q}%`);

  const { data, count } = await q
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const users = (data as Omit<UsersRow, "full_name_ne" | "avatar_url" | "updated_at">[] | null) ?? [];
  if (users.length === 0) return { items: [], total: count ?? 0, page, pageSize };

  const { data: profiles } = await supabase
    .from("member_profiles")
    .select("user_id, class_level, section, membership_status")
    .in("user_id", users.map((u) => u.id));
  const byId = new Map(
    (
      (profiles as Pick<
        MemberProfilesRow,
        "user_id" | "class_level" | "section" | "membership_status"
      >[] | null) ?? []
    ).map((p) => [p.user_id, p])
  );

  const items: MemberRow[] = users
    .filter((u) => {
      if (!filters.status) return true;
      return byId.get(u.id)?.membership_status === filters.status;
    })
    .map((u) => {
      const p = byId.get(u.id);
      return {
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        role: u.role,
        is_active: u.is_active,
        created_at: u.created_at,
        classLevel: p?.class_level ?? null,
        section: p?.section ?? null,
        membershipStatus: p?.membership_status ?? null,
      };
    });

  return { items, total: count ?? 0, page, pageSize };
}

export interface MemberDetail extends MemberRow {
  bio: string | null;
  joinedOn: string | null;
  participation: { activities: number; eventsAttended: number };
  recognition: { badges: number; achievements: number; certificates: number };
  suggestions: number;
}

export async function getMemberDetail(id: string): Promise<MemberDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: u } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  const user = u as UsersRow | null;
  if (!user) return null;
  const { data: p } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();
  const profile = p as MemberProfilesRow | null;

  const headCount = (build: () => PromiseLike<{ count: number | null }>) =>
    build().then((r) => r.count ?? 0);

  const [acts, attended, badges, achievements, certs, suggestions] = await Promise.all([
    headCount(() => supabase.from("activity_participants").select("*", { count: "exact", head: true }).eq("member_id", id)),
    headCount(() => supabase.from("attendance_records").select("*", { count: "exact", head: true }).eq("member_id", id).eq("status", "present")),
    headCount(() => supabase.from("member_badges").select("*", { count: "exact", head: true }).eq("member_id", id).eq("status", "awarded")),
    headCount(() => supabase.from("member_achievements").select("*", { count: "exact", head: true }).eq("member_id", id)),
    headCount(() => supabase.from("certificates").select("*", { count: "exact", head: true }).eq("recipient_id", id)),
    headCount(() => supabase.from("suggestions").select("*", { count: "exact", head: true }).eq("author_id", id)),
  ]);

  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    classLevel: profile?.class_level ?? null,
    section: profile?.section ?? null,
    membershipStatus: profile?.membership_status ?? null,
    bio: profile?.bio ?? null,
    joinedOn: profile?.joined_on ?? null,
    participation: { activities: acts, eventsAttended: attended },
    recognition: { badges, achievements, certificates: certs },
    suggestions,
  };
}

/** Full export dataset (no pagination) for CSV export. */
export async function listAllMembersForExport(): Promise<MemberRow[]> {
  const { items } = await listMembers({ page: 1, pageSize: 10000 });
  return items;
}
