import "server-only";

import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";

/**
 * Returns the current user only if they may moderate content (moderator/admin),
 * otherwise null. Shared by activity & event server actions so the staff check
 * lives in exactly one place.
 */
export async function requireStaffUser(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "content:moderate")) return null;
  return user;
}

/** Returns the current user only if they are an admin, otherwise null. */
export async function requireAdminUser(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}
