import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { slugify } from "@/lib/utils";
import type { ContributorRow, MagazineArticleRow } from "@/types/database";
import type { ArticleListItem } from "@/lib/magazine/queries";

/**
 * Returns the contributor profile for a user, creating a baseline one (linked to
 * the account) on first use so every author has a public byline + portfolio.
 * Relies on RLS (user may insert their own contributor row).
 */
export async function ensureContributorForUser(
  userId: string,
  displayName: string
): Promise<ContributorRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const existing = await supabase.from("contributors").select("*").eq("user_id", userId).maybeSingle();
  if (existing.data) return existing.data as ContributorRow;
  const slug = `${slugify(displayName)}-${crypto.randomUUID().slice(0, 5)}`;
  const { data } = await supabase
    .from("contributors")
    .insert({ user_id: userId, display_name: displayName, slug, type: "student" })
    .select("*")
    .single();
  return (data as ContributorRow | null) ?? null;
}

export type ContributorStats = {
  articles: number;
  views: number;
  likes: number;
  topCategory: string | null;
};

export async function listContributors(opts: { featuredOnly?: boolean } = {}): Promise<ContributorRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let q = supabase.from("contributors").select("*");
  if (opts.featuredOnly) q = q.eq("featured", true);
  const { data } = await q.order("display_name", { ascending: true });
  return (data as ContributorRow[] | null) ?? [];
}

export async function getContributorBySlug(slug: string): Promise<ContributorRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("contributors").select("*").eq("slug", slug).maybeSingle();
  return (data as ContributorRow | null) ?? null;
}

export async function getContributorById(id: string): Promise<ContributorRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("contributors").select("*").eq("id", id).maybeSingle();
  return (data as ContributorRow | null) ?? null;
}

/** Resolve the public author profile for an article (explicit link or author). */
export async function getContributorForArticle(article: {
  contributor_id: string | null;
  author_id: string;
}): Promise<ContributorRow | null> {
  if (article.contributor_id) {
    const byId = await getContributorById(article.contributor_id);
    if (byId) return byId;
  }
  return getContributorForUser(article.author_id);
}

export async function getContributorForUser(userId: string): Promise<ContributorRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("contributors").select("*").eq("user_id", userId).maybeSingle();
  return (data as ContributorRow | null) ?? null;
}

/**
 * Published articles credited to a contributor — by explicit link
 * (`contributor_id`) or, for legacy rows, by the linked user (`author_id`).
 */
export async function getContributorArticles(contributor: ContributorRow): Promise<ArticleListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const ors = [`contributor_id.eq.${contributor.id}`];
  if (contributor.user_id) ors.push(`author_id.eq.${contributor.user_id}`);
  const { data } = await supabase
    .from("magazine_articles")
    .select("*")
    .eq("status", "published")
    .or(ors.join(","))
    .order("published_at", { ascending: false, nullsFirst: false });

  const rows = (data as MagazineArticleRow[] | null) ?? [];
  if (rows.length === 0) return [];

  // Hydrate category/edition labels (author is the contributor itself).
  const [{ data: cats }, { data: eds }] = await Promise.all([
    supabase.from("magazine_categories").select("id, name, color"),
    supabase.from("magazine_editions").select("id, title"),
  ]);
  const catMap = new Map(
    (((cats as { id: string; name: string; color: string | null }[] | null) ?? [])).map((c) => [c.id, c])
  );
  const edMap = new Map((((eds as { id: string; title: string }[] | null) ?? [])).map((e) => [e.id, e.title]));

  return rows.map((r) => ({
    ...r,
    authorName: contributor.display_name,
    authorAvatar: contributor.profile_photo,
    categoryName: r.category_id ? catMap.get(r.category_id)?.name ?? null : null,
    categoryColor: r.category_id ? catMap.get(r.category_id)?.color ?? null : null,
    editionTitle: r.edition_id ? edMap.get(r.edition_id) ?? null : null,
  }));
}

export function contributorStats(articles: ArticleListItem[]): ContributorStats {
  const byCat = new Map<string, number>();
  let views = 0;
  let likes = 0;
  for (const a of articles) {
    views += Number(a.views) || 0;
    likes += Number(a.likes) || 0;
    if (a.categoryName) byCat.set(a.categoryName, (byCat.get(a.categoryName) ?? 0) + 1);
  }
  const topCategory = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return { articles: articles.length, views, likes, topCategory };
}
