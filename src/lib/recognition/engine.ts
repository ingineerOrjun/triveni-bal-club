import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Run the data-driven automatic badge engine for a member.
 *
 * Rules live in the `badge_rules` table (not in code), and evaluation happens in
 * the SECURITY DEFINER `evaluate_member_badges()` function so it can award
 * badges under RLS. This wrapper simply invokes it and is safe to call after any
 * participation change (attendance, registration, joining an activity).
 *
 * Best-effort: never throws — a recognition failure must not break the action
 * that triggered it.
 *
 * @returns the number of badges newly awarded (0 on failure / not configured).
 */
export async function runBadgeEngine(memberId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  try {
    const supabase = await createClient();
    const rpc = supabase.rpc.bind(supabase) as (
      fn: string,
      args: Record<string, unknown>
    ) => PromiseLike<{ data: number | null; error: unknown }>;
    const { data } = await rpc("evaluate_member_badges", { p_member: memberId });
    return typeof data === "number" ? data : 0;
  } catch {
    return 0;
  }
}
