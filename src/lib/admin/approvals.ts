import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface ApprovalItem {
  id: string;
  label: string;
  sub?: string;
  href: string;
}

export interface ApprovalBucket {
  key: string;
  title: string;
  /** lucide icon name, resolved by the page. */
  icon: string;
  count: number;
  href: string;
  items: ApprovalItem[];
}

async function namesByIds(ids: (string | null)[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const clean = Array.from(new Set(ids.filter((x): x is string => Boolean(x))));
  if (clean.length === 0) return map;
  const supabase = await createClient();
  const { data } = await supabase.from("users").select("id, full_name").in("id", clean);
  for (const u of (data as { id: string; full_name: string }[] | null) ?? []) map.set(u.id, u.full_name);
  return map;
}

/**
 * Aggregates everything awaiting staff action into one executive view
 * (PART 6). Pure reads against existing tables; RLS lets staff see pending
 * rows. Each bucket links to the module's existing review screen.
 */
export async function getApprovalCenter(): Promise<{ buckets: ApprovalBucket[]; total: number }> {
  if (!isSupabaseConfigured()) return { buckets: [], total: 0 };
  const supabase = await createClient();
  const LIMIT = 5;

  const [articles, comments, suggestions, achievements, badges, nominations, pages] = await Promise.all([
    supabase
      .from("magazine_articles")
      .select("id, title, author_id, status")
      .in("status", ["review", "revision_required"])
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(LIMIT),
    supabase
      .from("magazine_comments")
      .select("id, content, article_id")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("suggestions")
      .select("id, title, author_id, status")
      .in("status", ["submitted", "under_review"])
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("member_achievements")
      .select("id, title, member_id")
      .eq("status", "recommended")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("member_badges")
      .select("id, member_id")
      .eq("status", "recommended")
      .order("awarded_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("candidate_nominations")
      .select("id, member_id, election_id, status")
      .in("status", ["submitted", "under_review"])
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("cms_pages")
      .select("id, title, slug, status")
      .in("status", ["draft", "scheduled"])
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(LIMIT),
  ]);

  // Exact counts (head requests) run in parallel with the list fetches above.
  const [artC, comC, sugC, achC, badC, nomC, pageC] = await Promise.all([
    supabase.from("magazine_articles").select("*", { count: "exact", head: true }).in("status", ["review", "revision_required"]),
    supabase.from("magazine_comments").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("suggestions").select("*", { count: "exact", head: true }).in("status", ["submitted", "under_review"]),
    supabase.from("member_achievements").select("*", { count: "exact", head: true }).eq("status", "recommended"),
    supabase.from("member_badges").select("*", { count: "exact", head: true }).eq("status", "recommended"),
    supabase.from("candidate_nominations").select("*", { count: "exact", head: true }).in("status", ["submitted", "under_review"]),
    supabase.from("cms_pages").select("*", { count: "exact", head: true }).in("status", ["draft", "scheduled"]),
  ]);

  const artRows = (articles.data as { id: string; title: string; author_id: string; status: string }[] | null) ?? [];
  const sugRows = (suggestions.data as { id: string; title: string; author_id: string }[] | null) ?? [];
  const achRows = (achievements.data as { id: string; title: string; member_id: string }[] | null) ?? [];
  const badRows = (badges.data as { id: string; member_id: string }[] | null) ?? [];
  const nomRows = (nominations.data as { id: string; member_id: string }[] | null) ?? [];
  const comRows = (comments.data as { id: string; content: string }[] | null) ?? [];
  const pageRows = (pages.data as { id: string; title: string; slug: string }[] | null) ?? [];

  const names = await namesByIds([
    ...artRows.map((r) => r.author_id),
    ...sugRows.map((r) => r.author_id),
    ...achRows.map((r) => r.member_id),
    ...badRows.map((r) => r.member_id),
    ...nomRows.map((r) => r.member_id),
  ]);

  const buckets: ApprovalBucket[] = [
    {
      key: "magazine",
      title: "Magazine reviews",
      icon: "Newspaper",
      count: artC.count ?? 0,
      href: "/admin/magazine/review",
      items: artRows.map((r) => ({
        id: r.id,
        label: r.title,
        sub: `${names.get(r.author_id) ?? "Member"} · ${r.status.replace(/_/g, " ")}`,
        href: `/admin/magazine/articles/${r.id}`,
      })),
    },
    {
      key: "comments",
      title: "Comment moderation",
      icon: "MessageSquare",
      count: comC.count ?? 0,
      href: "/admin/magazine/comments",
      items: comRows.map((r) => ({
        id: r.id,
        label: r.content.slice(0, 60) + (r.content.length > 60 ? "…" : ""),
        href: "/admin/magazine/comments",
      })),
    },
    {
      key: "suggestions",
      title: "Suggestion approvals",
      icon: "Lightbulb",
      count: sugC.count ?? 0,
      href: "/admin/suggestions?status=submitted",
      items: sugRows.map((r) => ({
        id: r.id,
        label: r.title,
        sub: names.get(r.author_id) ?? undefined,
        href: `/admin/suggestions/${r.id}`,
      })),
    },
    {
      key: "nominations",
      title: "Election nominations",
      icon: "Vote",
      count: nomC.count ?? 0,
      href: "/admin/elections",
      items: nomRows.map((r) => ({
        id: r.id,
        label: names.get(r.member_id) ?? "Candidate",
        sub: "Awaiting review",
        href: "/admin/elections",
      })),
    },
    {
      key: "achievements",
      title: "Achievement approvals",
      icon: "Trophy",
      count: achC.count ?? 0,
      href: "/admin/achievements",
      items: achRows.map((r) => ({
        id: r.id,
        label: r.title,
        sub: names.get(r.member_id) ?? undefined,
        href: "/admin/achievements",
      })),
    },
    {
      key: "badges",
      title: "Badge recommendations",
      icon: "BadgeCheck",
      count: badC.count ?? 0,
      href: "/admin/badges",
      items: badRows.map((r) => ({
        id: r.id,
        label: names.get(r.member_id) ?? "Member",
        sub: "Recommended badge",
        href: "/admin/badges",
      })),
    },
    {
      key: "cms",
      title: "CMS drafts & scheduled",
      icon: "LayoutTemplate",
      count: pageC.count ?? 0,
      href: "/admin/pages",
      items: pageRows.map((r) => ({
        id: r.id,
        label: r.title,
        sub: `/${r.slug}`,
        href: `/admin/pages/${r.id}`,
      })),
    },
  ];

  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  return { buckets, total };
}
