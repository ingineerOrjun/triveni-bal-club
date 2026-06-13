import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  ArticleStatus,
  ContentStatus,
  MagazineArticleRow,
  MagazineArticleBlockRow,
  MagazineArticleGalleryRow,
  MagazineCategoryRow,
  MagazineCommentRow,
  MagazineEditionRow,
  MagazineEditorReviewRow,
  MagazineArticleVersionRow,
  MagazineReaction,
} from "@/types/database";

export interface MemberRef {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export type ArticleListItem = MagazineArticleRow & {
  authorName: string | null;
  authorAvatar: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  editionTitle: string | null;
};

export type ArticleDetail = MagazineArticleRow & {
  blocks: MagazineArticleBlockRow[];
  gallery: MagazineArticleGalleryRow[];
  author: MemberRef | null;
  editor: MemberRef | null;
  category: MagazineCategoryRow | null;
  edition: MagazineEditionRow | null;
};

export type CommentView = MagazineCommentRow & { authorName: string | null; authorAvatar: string | null };
export type ReviewView = MagazineEditorReviewRow & { reviewerName: string | null };

type Rpc = (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;

async function membersByIds(ids: (string | null)[]): Promise<Map<string, MemberRef>> {
  const map = new Map<string, MemberRef>();
  const clean = Array.from(new Set(ids.filter((x): x is string => Boolean(x))));
  if (clean.length === 0) return map;
  const supabase = await createClient();
  const { data } = await supabase.from("users").select("id, full_name, avatar_url").in("id", clean);
  for (const u of (data as MemberRef[] | null) ?? []) map.set(u.id, u);
  return map;
}

/* ------------------------------ categories -------------------------------- */
export async function listCategories(): Promise<MagazineCategoryRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("magazine_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return (data as MagazineCategoryRow[] | null) ?? [];
}

/* ------------------------------- editions --------------------------------- */
export async function listEditions(opts: { publishedOnly?: boolean } = {}): Promise<MagazineEditionRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let q = supabase.from("magazine_editions").select("*");
  if (opts.publishedOnly) q = q.eq("status", "published" as ContentStatus);
  const { data } = await q
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return (data as MagazineEditionRow[] | null) ?? [];
}

export async function getLatestEdition(): Promise<MagazineEditionRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("magazine_editions")
    .select("*")
    .eq("status", "published" as ContentStatus)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return (data as MagazineEditionRow | null) ?? null;
}

async function decorate(rows: MagazineArticleRow[]): Promise<ArticleListItem[]> {
  if (rows.length === 0) return [];
  const supabase = await createClient();
  const [authors, { data: cats }, { data: eds }] = await Promise.all([
    membersByIds(rows.map((r) => r.author_id)),
    supabase.from("magazine_categories").select("id, name, color"),
    supabase.from("magazine_editions").select("id, title"),
  ]);
  const catMap = new Map<string, { name: string; color: string | null }>();
  for (const c of (cats as { id: string; name: string; color: string | null }[] | null) ?? [])
    catMap.set(c.id, { name: c.name, color: c.color });
  const edMap = new Map<string, string>();
  for (const e of (eds as { id: string; title: string }[] | null) ?? []) edMap.set(e.id, e.title);

  return rows.map((r) => ({
    ...r,
    authorName: authors.get(r.author_id)?.full_name ?? null,
    authorAvatar: authors.get(r.author_id)?.avatar_url ?? null,
    categoryName: r.category_id ? catMap.get(r.category_id)?.name ?? null : null,
    categoryColor: r.category_id ? catMap.get(r.category_id)?.color ?? null : null,
    editionTitle: r.edition_id ? edMap.get(r.edition_id) ?? null : null,
  }));
}

export interface ArticleFilters {
  status?: ArticleStatus;
  categoryId?: string;
  editionId?: string;
  featured?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** Admin/portal listing with filters + pagination. */
export async function listArticles(
  filters: ArticleFilters = {}
): Promise<{ rows: ArticleListItem[]; total: number }> {
  if (!isSupabaseConfigured()) return { rows: [], total: 0 };
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(60, Math.max(1, filters.pageSize ?? 20));
  const from = (page - 1) * pageSize;

  let q = supabase.from("magazine_articles").select("*", { count: "exact" });
  if (filters.status) q = q.eq("status", filters.status as ArticleStatus);
  if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
  if (filters.editionId) q = q.eq("edition_id", filters.editionId);
  if (typeof filters.featured === "boolean") q = q.eq("featured", filters.featured);
  if (filters.search) {
    const s = filters.search.replace(/[%,]/g, " ").trim();
    if (s) q = q.or(`title.ilike.%${s}%,excerpt.ilike.%${s}%,content.ilike.%${s}%`);
  }
  const { data, count } = await q
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const rows = await decorate((data as MagazineArticleRow[] | null) ?? []);
  return { rows, total: count ?? 0 };
}

export async function listPublishedArticles(opts: {
  limit?: number;
  categoryId?: string;
  editionId?: string;
} = {}): Promise<ArticleListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let q = supabase.from("magazine_articles").select("*").eq("status", "published" as ArticleStatus);
  if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
  if (opts.editionId) q = q.eq("edition_id", opts.editionId);
  const { data } = await q
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(opts.limit ?? 12);
  return decorate((data as MagazineArticleRow[] | null) ?? []);
}

export async function getFeaturedArticles(limit = 3): Promise<ArticleListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("magazine_articles")
    .select("*")
    .eq("status", "published" as ArticleStatus)
    .eq("featured", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  return decorate((data as MagazineArticleRow[] | null) ?? []);
}

export async function getPopularArticles(limit = 5): Promise<ArticleListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("magazine_articles")
    .select("*")
    .eq("status", "published" as ArticleStatus)
    .order("views", { ascending: false })
    .limit(limit);
  return decorate((data as MagazineArticleRow[] | null) ?? []);
}

async function hydrateDetail(article: MagazineArticleRow): Promise<ArticleDetail> {
  const supabase = await createClient();
  const [{ data: blocks }, { data: gallery }, members, { data: category }, { data: edition }] =
    await Promise.all([
      supabase.from("magazine_article_blocks").select("*").eq("article_id", article.id).order("sort_order", { ascending: true }),
      supabase.from("magazine_article_gallery").select("*").eq("article_id", article.id).order("sort_order", { ascending: true }),
      membersByIds([article.author_id, article.editor_id]),
      article.category_id
        ? supabase.from("magazine_categories").select("*").eq("id", article.category_id).maybeSingle()
        : Promise.resolve({ data: null }),
      article.edition_id
        ? supabase.from("magazine_editions").select("*").eq("id", article.edition_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
  return {
    ...article,
    blocks: (blocks as MagazineArticleBlockRow[] | null) ?? [],
    gallery: (gallery as MagazineArticleGalleryRow[] | null) ?? [],
    author: members.get(article.author_id) ?? null,
    editor: article.editor_id ? members.get(article.editor_id) ?? null : null,
    category: (category as MagazineCategoryRow | null) ?? null,
    edition: (edition as MagazineEditionRow | null) ?? null,
  };
}

export async function getArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("magazine_articles").select("*").eq("slug", slug).maybeSingle();
  const a = data as MagazineArticleRow | null;
  return a ? hydrateDetail(a) : null;
}

export async function getArticleById(id: string): Promise<ArticleDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("magazine_articles").select("*").eq("id", id).maybeSingle();
  const a = data as MagazineArticleRow | null;
  return a ? hydrateDetail(a) : null;
}

export async function getEditionBySlug(
  slug: string
): Promise<{ edition: MagazineEditionRow; articles: ArticleListItem[] } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("magazine_editions").select("*").eq("slug", slug).maybeSingle();
  const edition = data as MagazineEditionRow | null;
  if (!edition) return null;
  const articles = await listPublishedArticles({ editionId: edition.id, limit: 60 });
  return { edition, articles };
}

export async function getRelatedArticles(article: MagazineArticleRow, limit = 3): Promise<ArticleListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let q = supabase
    .from("magazine_articles")
    .select("*")
    .eq("status", "published" as ArticleStatus)
    .neq("id", article.id);
  if (article.category_id) q = q.eq("category_id", article.category_id);
  const { data } = await q.order("published_at", { ascending: false, nullsFirst: false }).limit(limit);
  let rows = (data as MagazineArticleRow[] | null) ?? [];
  if (rows.length === 0 && article.category_id) {
    const { data: more } = await supabase
      .from("magazine_articles")
      .select("*")
      .eq("status", "published" as ArticleStatus)
      .neq("id", article.id)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);
    rows = (more as MagazineArticleRow[] | null) ?? [];
  }
  return decorate(rows);
}

/** Previous / next published article by publish date (reading flow). */
export async function getAdjacentArticles(
  article: MagazineArticleRow
): Promise<{ prev: ArticleListItem | null; next: ArticleListItem | null }> {
  if (!isSupabaseConfigured() || !article.published_at) return { prev: null, next: null };
  const supabase = await createClient();
  const [{ data: prevRows }, { data: nextRows }] = await Promise.all([
    supabase
      .from("magazine_articles")
      .select("*")
      .eq("status", "published" as ArticleStatus)
      .lt("published_at", article.published_at)
      .order("published_at", { ascending: false })
      .limit(1),
    supabase
      .from("magazine_articles")
      .select("*")
      .eq("status", "published" as ArticleStatus)
      .gt("published_at", article.published_at)
      .order("published_at", { ascending: true })
      .limit(1),
  ]);
  const prevD = await decorate((prevRows as MagazineArticleRow[] | null) ?? []);
  const nextD = await decorate((nextRows as MagazineArticleRow[] | null) ?? []);
  return { prev: prevD[0] ?? null, next: nextD[0] ?? null };
}

/* -------------------------------- search ---------------------------------- */
export async function searchArticles(
  query: string,
  page = 1,
  pageSize = 12
): Promise<ArticleListItem[]> {
  if (!isSupabaseConfigured() || !query.trim()) return [];
  const supabase = await createClient();
  const rpc = supabase.rpc.bind(supabase) as Rpc;
  const { data } = await rpc("magazine_search", {
    p_query: query.trim(),
    p_limit: pageSize,
    p_offset: (Math.max(1, page) - 1) * pageSize,
  });
  const hits = (data as { id: string; rank: number }[] | null) ?? [];
  if (hits.length === 0) return [];
  const { data: rows } = await supabase
    .from("magazine_articles")
    .select("*")
    .in("id", hits.map((h) => h.id));
  const byId = new Map((((rows as MagazineArticleRow[] | null) ?? [])).map((r) => [r.id, r]));
  const ordered = hits.map((h) => byId.get(h.id)).filter((r): r is MagazineArticleRow => Boolean(r));
  return decorate(ordered);
}

/* ------------------------------ per-member -------------------------------- */
export async function listMyArticles(authorId: string): Promise<ArticleListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("magazine_articles")
    .select("*")
    .eq("author_id", authorId)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return decorate((data as MagazineArticleRow[] | null) ?? []);
}

export async function listMyBookmarks(userId: string): Promise<ArticleListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data: bm } = await supabase
    .from("magazine_bookmarks")
    .select("article_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const ids = (((bm as { article_id: string }[] | null) ?? [])).map((b) => b.article_id);
  if (ids.length === 0) return [];
  const { data } = await supabase.from("magazine_articles").select("*").in("id", ids);
  return decorate((data as MagazineArticleRow[] | null) ?? []);
}

export async function listMyLiked(userId: string): Promise<ArticleListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data: rx } = await supabase
    .from("magazine_reactions")
    .select("article_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const ids = (((rx as { article_id: string }[] | null) ?? [])).map((r) => r.article_id);
  if (ids.length === 0) return [];
  const { data } = await supabase.from("magazine_articles").select("*").in("id", ids);
  return decorate((data as MagazineArticleRow[] | null) ?? []);
}

export async function isBookmarked(articleId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("magazine_bookmarks")
    .select("id")
    .eq("article_id", articleId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function getMyReaction(articleId: string, userId: string): Promise<MagazineReaction | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("magazine_reactions")
    .select("reaction")
    .eq("article_id", articleId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data as { reaction: MagazineReaction } | null)?.reaction ?? null;
}

/* ------------------------------- comments --------------------------------- */
export async function listComments(
  articleId: string,
  opts: { approvedOnly?: boolean } = {}
): Promise<CommentView[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let q = supabase.from("magazine_comments").select("*").eq("article_id", articleId);
  if (opts.approvedOnly) q = q.eq("status", "approved");
  const { data } = await q.order("created_at", { ascending: false });
  const rows = (data as MagazineCommentRow[] | null) ?? [];
  const members = await membersByIds(rows.map((r) => r.user_id));
  return rows.map((r) => ({
    ...r,
    authorName: members.get(r.user_id)?.full_name ?? null,
    authorAvatar: members.get(r.user_id)?.avatar_url ?? null,
  }));
}

export async function listPendingComments(): Promise<(CommentView & { articleTitle: string | null })[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("magazine_comments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data as MagazineCommentRow[] | null) ?? [];
  const members = await membersByIds(rows.map((r) => r.user_id));
  const { data: arts } = await supabase
    .from("magazine_articles")
    .select("id, title")
    .in("id", Array.from(new Set(rows.map((r) => r.article_id))));
  const titleMap = new Map((((arts as { id: string; title: string }[] | null) ?? [])).map((a) => [a.id, a.title]));
  return rows.map((r) => ({
    ...r,
    authorName: members.get(r.user_id)?.full_name ?? null,
    authorAvatar: members.get(r.user_id)?.avatar_url ?? null,
    articleTitle: titleMap.get(r.article_id) ?? null,
  }));
}

/* ------------------------ reviews + versions ------------------------------ */
export async function listReviews(articleId: string): Promise<ReviewView[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("magazine_editor_reviews")
    .select("*")
    .eq("article_id", articleId)
    .order("created_at", { ascending: false });
  const rows = (data as MagazineEditorReviewRow[] | null) ?? [];
  const members = await membersByIds(rows.map((r) => r.reviewer_id));
  return rows.map((r) => ({ ...r, reviewerName: r.reviewer_id ? members.get(r.reviewer_id)?.full_name ?? null : null }));
}

export async function listVersions(articleId: string): Promise<MagazineArticleVersionRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("magazine_article_versions")
    .select("*")
    .eq("article_id", articleId)
    .order("version", { ascending: false });
  return (data as MagazineArticleVersionRow[] | null) ?? [];
}

/* ------------------------------ analytics --------------------------------- */
export interface MagazineDashboard {
  byStatus: Record<ArticleStatus, number>;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  authors: number;
  categories: number;
  editions: number;
}

const EMPTY_STATUS: Record<ArticleStatus, number> = {
  draft: 0,
  review: 0,
  revision_required: 0,
  approved: 0,
  scheduled: 0,
  published: 0,
  archived: 0,
};

export async function getDashboard(): Promise<MagazineDashboard> {
  const base: MagazineDashboard = {
    byStatus: { ...EMPTY_STATUS },
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    authors: 0,
    categories: 0,
    editions: 0,
  };
  if (!isSupabaseConfigured()) return base;
  const supabase = await createClient();
  const { data: arts } = await supabase
    .from("magazine_articles")
    .select("status, views, likes, author_id");
  const rows = (arts as { status: ArticleStatus; views: number; likes: number; author_id: string }[] | null) ?? [];
  const authors = new Set<string>();
  for (const r of rows) {
    base.byStatus[r.status] = (base.byStatus[r.status] ?? 0) + 1;
    base.totalViews += Number(r.views) || 0;
    base.totalLikes += Number(r.likes) || 0;
    authors.add(r.author_id);
  }
  base.authors = authors.size;

  const [{ count: comments }, { count: cats }, { count: eds }] = await Promise.all([
    supabase.from("magazine_comments").select("*", { count: "exact", head: true }),
    supabase.from("magazine_categories").select("*", { count: "exact", head: true }),
    supabase.from("magazine_editions").select("*", { count: "exact", head: true }),
  ]);
  base.totalComments = comments ?? 0;
  base.categories = cats ?? 0;
  base.editions = eds ?? 0;
  return base;
}

export interface NamedCount {
  id: string;
  name: string;
  value: number;
}

export interface MagazineAnalytics {
  topStories: ArticleListItem[];
  popularCategories: NamedCount[];
  popularAuthors: NamedCount[];
  popularEditions: NamedCount[];
  monthly: { month: string; count: number }[];
}

export async function getAnalytics(): Promise<MagazineAnalytics> {
  const empty: MagazineAnalytics = {
    topStories: [],
    popularCategories: [],
    popularAuthors: [],
    popularEditions: [],
    monthly: [],
  };
  if (!isSupabaseConfigured()) return empty;
  const supabase = await createClient();
  const { data } = await supabase
    .from("magazine_articles")
    .select("*")
    .eq("status", "published" as ArticleStatus);
  const rows = (data as MagazineArticleRow[] | null) ?? [];

  const topStories = await decorate(
    [...rows].sort((a, b) => Number(b.views) - Number(a.views)).slice(0, 8)
  );

  const catViews = new Map<string, number>();
  const authorViews = new Map<string, number>();
  const edViews = new Map<string, number>();
  const monthCount = new Map<string, number>();
  for (const r of rows) {
    if (r.category_id) catViews.set(r.category_id, (catViews.get(r.category_id) ?? 0) + Number(r.views));
    authorViews.set(r.author_id, (authorViews.get(r.author_id) ?? 0) + Number(r.views));
    if (r.edition_id) edViews.set(r.edition_id, (edViews.get(r.edition_id) ?? 0) + Number(r.views));
    const when = r.published_at ?? r.created_at;
    const month = when.slice(0, 7); // YYYY-MM
    monthCount.set(month, (monthCount.get(month) ?? 0) + 1);
  }

  const [cats, authors, eds] = await Promise.all([
    supabase.from("magazine_categories").select("id, name").in("id", [...catViews.keys()].length ? [...catViews.keys()] : ["00000000-0000-0000-0000-000000000000"]),
    membersByIds([...authorViews.keys()]),
    supabase.from("magazine_editions").select("id, title").in("id", [...edViews.keys()].length ? [...edViews.keys()] : ["00000000-0000-0000-0000-000000000000"]),
  ]);
  const catName = new Map((((cats.data as { id: string; name: string }[] | null) ?? [])).map((c) => [c.id, c.name]));
  const edName = new Map((((eds.data as { id: string; title: string }[] | null) ?? [])).map((e) => [e.id, e.title]));

  const toSorted = (m: Map<string, number>, label: (id: string) => string): NamedCount[] =>
    [...m.entries()]
      .map(([id, value]) => ({ id, name: label(id), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

  return {
    topStories,
    popularCategories: toSorted(catViews, (id) => catName.get(id) ?? "Uncategorized"),
    popularAuthors: toSorted(authorViews, (id) => authors.get(id)?.full_name ?? "Member"),
    popularEditions: toSorted(edViews, (id) => edName.get(id) ?? "Edition"),
    monthly: [...monthCount.entries()].map(([month, count]) => ({ month, count })).sort((a, b) => a.month.localeCompare(b.month)).slice(-12),
  };
}
