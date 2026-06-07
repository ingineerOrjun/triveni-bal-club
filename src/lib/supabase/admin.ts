import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabaseUrl } from "./env";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client — BYPASSES RLS. Server-only.
 * Use exclusively for trusted admin operations (e.g. creating member accounts).
 * Never import into client bundles or expose the key.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
