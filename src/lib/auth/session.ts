import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PORTAL_ROLES, type UserRole } from "./roles";
import type { Database, MembershipStatus } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type ProfileRow = Database["public"]["Tables"]["member_profiles"]["Row"];

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  fullNameNe: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  profile: {
    studentCode: string | null;
    classLevel: string | null;
    section: string | null;
    bio: string | null;
    bioNe: string | null;
    interests: string[];
    membershipStatus: MembershipStatus;
    joinedOn: string;
  } | null;
}

/**
 * Resolve the authenticated user + role + profile from the SERVER.
 * Cached per-request (React.cache) to avoid duplicate auth/DB calls.
 * Returns null when not authenticated (or Supabase isn't configured).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const usersQuery = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  const userRow = usersQuery.data as UserRow | null;

  const profilesQuery = await supabase
    .from("member_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const profileRow = profilesQuery.data as ProfileRow | null;

  const role = (userRow?.role ?? "member") as UserRole;

  return {
    id: user.id,
    email: user.email ?? userRow?.email ?? "",
    role,
    fullName: userRow?.full_name ?? user.email?.split("@")[0] ?? "Member",
    fullNameNe: userRow?.full_name_ne ?? null,
    avatarUrl: userRow?.avatar_url ?? null,
    isActive: userRow?.is_active ?? true,
    profile: profileRow
      ? {
          studentCode: profileRow.student_code,
          classLevel: profileRow.class_level,
          section: profileRow.section,
          bio: profileRow.bio,
          bioNe: profileRow.bio_ne,
          interests: profileRow.interests ?? [],
          membershipStatus: profileRow.membership_status,
          joinedOn: profileRow.joined_on,
        }
      : null,
  };
});

/** Redirect to login unless authenticated. Returns the user otherwise. */
export async function requireUser(nextPath = "/portal"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (!user.isActive) {
    redirect("/auth/login?error=inactive");
  }
  return user;
}

/** Require one of the given roles; redirect if not allowed. */
export async function requireRole(
  roles: UserRole[],
  nextPath = "/portal"
): Promise<CurrentUser> {
  const user = await requireUser(nextPath);
  if (!roles.includes(user.role)) {
    redirect("/portal?error=forbidden");
  }
  return user;
}

/** Convenience guard for the member portal. */
export function requirePortalAccess(nextPath = "/portal") {
  return requireRole(PORTAL_ROLES, nextPath);
}
