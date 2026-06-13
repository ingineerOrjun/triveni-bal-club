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

  const [
    members,
    activities,
    events,
    suggestions,
    badges,
    articles,
    editions,
    elections,
    albums,
    cmsPages,
    certificates,
    achievements,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email")
      .or(`full_name.ilike.${like},email.ilike.${like}`)
      .limit(5),
    supabase.from("activities").select("id, title").ilike("title", like).limit(5),
    supabase.from("events").select("id, title").ilike("title", like).limit(5),
    supabase.from("suggestions").select("id, title").ilike("title", like).limit(5),
    supabase.from("badges").select("id, name").ilike("name", like).limit(5),
    supabase.from("magazine_articles").select("id, title, status").ilike("title", like).limit(5),
    supabase.from("magazine_editions").select("id, title").ilike("title", like).limit(3),
    supabase.from("elections").select("id, title, status").ilike("title", like).limit(5),
    supabase.from("gallery_albums").select("id, title").ilike("title", like).limit(5),
    supabase.from("cms_pages").select("id, title, slug").ilike("title", like).limit(5),
    supabase
      .from("certificates")
      .select("id, title, certificate_number")
      .or(`title.ilike.${like},certificate_number.ilike.${like}`)
      .limit(5),
    supabase.from("member_achievements").select("id, title").ilike("title", like).limit(5),
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
  push(
    "Magazine",
    ((articles.data as { id: string; title: string; status: string }[] | null) ?? []).map((a) => ({
      id: a.id,
      label: a.title,
      sub: a.status.replace(/_/g, " "),
      href: `/admin/magazine/articles/${a.id}`,
    }))
  );
  push(
    "Editions",
    ((editions.data as { id: string; title: string }[] | null) ?? []).map((e) => ({
      id: e.id,
      label: e.title,
      href: "/admin/magazine/editions",
    }))
  );
  push(
    "Elections",
    ((elections.data as { id: string; title: string; status: string }[] | null) ?? []).map((e) => ({
      id: e.id,
      label: e.title,
      sub: e.status.replace(/_/g, " "),
      href: `/admin/elections/${e.id}`,
    }))
  );
  push(
    "Gallery",
    ((albums.data as { id: string; title: string }[] | null) ?? []).map((a) => ({
      id: a.id,
      label: a.title,
      href: `/admin/gallery/${a.id}`,
    }))
  );
  push(
    "Pages",
    ((cmsPages.data as { id: string; title: string; slug: string }[] | null) ?? []).map((p) => ({
      id: p.id,
      label: p.title,
      sub: `/${p.slug}`,
      href: `/admin/pages/${p.id}`,
    }))
  );
  push(
    "Certificates",
    ((certificates.data as { id: string; title: string; certificate_number: string }[] | null) ?? []).map(
      (c) => ({ id: c.id, label: c.title, sub: c.certificate_number, href: "/admin/certificates" })
    )
  );
  push(
    "Achievements",
    ((achievements.data as { id: string; title: string }[] | null) ?? []).map((a) => ({
      id: a.id,
      label: a.title,
      href: "/admin/achievements",
    }))
  );

  return groups;
}
