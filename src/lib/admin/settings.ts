import "server-only";

import { createClient as createAnonClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";
import type { AppSettingRow, Database } from "@/types/database";

export type SettingsMap = Record<string, Record<string, unknown>>;

/** Default values used when the DB has no row yet (keeps UI populated). */
export const SETTING_DEFAULTS: SettingsMap = {
  general: {
    clubName: "Triveni Child Club",
    schoolName: "Triveni Barah Nanda Prasad Tripathee School",
    academicYear: "2025–2026",
    timezone: "Asia/Kathmandu",
    language: "en",
  },
  contact: {
    email: "club@triveni.edu.np",
    phone: "+977 00-000000",
    address: "Triveni Barah Nanda Prasad Tripathee School, Nepal",
    officeHours: "Sunday – Friday, 10:00 AM – 4:00 PM",
  },
  social: { facebook: "", instagram: "", youtube: "" },
  homepage: {
    heroTitle: "Where students lead, grow, and shine.",
    heroSubtitle: "The official portal of the Triveni Child Club.",
    heroCtaLabel: "Discover the Club",
    heroCtaHref: "/about",
  },
  seo: {
    defaultTitle: "Triveni Child Club",
    defaultDescription:
      "Student-led activities, elections, achievements, and voice.",
    ogImage: "/gallery/triveni-05.jpeg",
  },
  features: { studentVoice: true, recognition: true, maintenanceMode: false },
};

export async function getSettings(): Promise<SettingsMap> {
  const merged: SettingsMap = structuredClone(SETTING_DEFAULTS);
  if (!isSupabaseConfigured()) return merged;
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("key, value");
  for (const row of (data as Pick<AppSettingRow, "key" | "value">[] | null) ?? []) {
    merged[row.key] = { ...(merged[row.key] ?? {}), ...(row.value ?? {}) };
  }
  return merged;
}

export async function getSettingGroup(
  key: string
): Promise<Record<string, unknown>> {
  const all = await getSettings();
  return all[key] ?? {};
}

/**
 * Read PUBLIC settings without touching cookies, so public pages that use them
 * stay statically renderable + ISR-revalidated (settings saves call
 * revalidatePath). Uses a cookie-free anon client.
 */
export async function getPublicSettings(): Promise<SettingsMap> {
  const merged: SettingsMap = structuredClone(SETTING_DEFAULTS);
  if (!isSupabaseConfigured()) return merged;
  const anon = createAnonClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await anon.from("app_settings").select("key, value").eq("is_public", true);
  for (const row of (data as Pick<AppSettingRow, "key" | "value">[] | null) ?? []) {
    merged[row.key] = { ...(merged[row.key] ?? {}), ...(row.value ?? {}) };
  }
  return merged;
}

/** Convenience accessor with a typed default. */
export function readSetting<T = string>(
  group: Record<string, unknown> | undefined,
  field: string,
  fallback: T
): T {
  const v = group?.[field];
  return (v === undefined || v === null ? fallback : (v as T)) ?? fallback;
}
