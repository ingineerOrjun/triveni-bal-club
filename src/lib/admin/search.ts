"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireStaffUser } from "@/lib/auth/guards";

export interface SearchHit {
  id: string;
  label: string;
  sub?: string;
  href: string;
}
export interface SearchGroup {
  module: string;
  hits: SearchHit[];
}

/** Universal admin search (Ctrl+K). Results grouped by module. Staff only. */
export async function adminSearch(query: string): Promise<SearchGroup[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const like = `%${q}%`;

  const [members, activities, events, suggestions, badges] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email")
      .or(`full_name.ilike.${like},email.ilike.${like}`)
      .limit(5),
    supabase.from("activities").select("id, title").ilike("title", like).limit(5),
    supabase.from("events").select("id, title").ilike("title", like).limit(5),
    supabase.from("suggestions").select("id, title").ilike("title", like).limit(5),
    supabase.from("badges").select("id, name").ilike("name", like).limit(5),
  ]);

  const groups: SearchGroup[] = [];
  const push = (module: string, hits: SearchHit[]) => {
    if (hits.length) groups.push({ module, hits });
  };

  push(
    "Members",
    ((members.data as { id: string; full_name: string; email: string }[] | null) ?? []).map(
      (m) => ({ id: m.id, label: m.full_name, sub: m.email, href: `/admin/members/${m.id}` })
    )
  );
  push(
    "Activities",
    ((activities.data as { id: string; title: string }[] | null) ?? []).map((a) => ({
      id: a.id,
      label: a.title,
      href: `/admin/activities/${a.id}/edit`,
    }))
  );
  push(
    "Events",
    ((events.data as { id: string; title: string }[] | null) ?? []).map((e) => ({
      id: e.id,
      label: e.title,
      href: `/admin/events/${e.id}/edit`,
    }))
  );
  push(
    "Suggestions",
    ((suggestions.data as { id: string; title: string }[] | null) ?? []).map((s) => ({
      id: s.id,
      label: s.title,
      href: `/admin/suggestions/${s.id}`,
    }))
  );
  push(
    "Badges",
    ((badges.data as { id: string; name: string }[] | null) ?? []).map((b) => ({
      id: b.id,
      label: b.name,
      href: `/admin/badges/${b.id}/edit`,
    }))
  );

  return groups;
}
