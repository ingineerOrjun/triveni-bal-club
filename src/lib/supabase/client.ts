"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
import type { Database } from "@/types/database";

/**
 * Browser Supabase client (anon key). RLS-bound to the logged-in user.
 * Use inside Client Components only.
 */
export function createClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}
