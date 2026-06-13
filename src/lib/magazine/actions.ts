"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth/session";
import { requireStaffUser } from "@/lib/auth/guards";
import { logAudit } from "@/lib/supabase/audit";
import { slugify } from "@/lib/utils";
import { type FormState, zodFieldErrors } from "@/lib/forms";
import { ensureContributorForUser } from "@/lib/contributors/queries";
import {
  articleMetaSchema,
  editionInputSchema,
  categoryInputSchema,
  commentInputSchema,
  blocksPayloadSchema,
} from "./schema";
import {
  blocksToPlainText,
  estimateReadingTime,
  deriveExcerpt,
  isBlockType,
  type ArticleBlock,
} from "./blocks";
import type {
  ArticleStatus,
  ContentStatus,
  MagazineArticleUpdate,
  MagazineArticleBlockInsert,
  MagazineCommentStatus,
  MagazineReaction,
  ReviewDecision,
} from "@/types/database";

const PUBLIC = "/magazine";

/**
 * Editorial notification hook. Best-effort: records the event to the audit
 * trail (the integration point for email/push later — see docs roadmap).
 */
async function notify(client: unknown, event: string, articleId: string, meta: Record<string, unknown> = {}) {
  await logAudit(client, `magazine.notify.${event}`, "magazine_article", articleId, meta);
}

function uniqueSlug(title: string): string {
  return `${slugify(title)}-${crypto.randomUUID().slice(0, 5)}`;
}

/* ============================ author: create ============================== */
export async function createArticle(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 3) return { fieldErrors: { title: "Give your article a title (3+ characters)." } };
  const scope = formData.get("scope") === "admin" ? "admin" : "portal";

  const supabase = await createClient();
  // Ensure the author has a public contributor profile and credit the article to it.
  const contributor = await ensureContributorForUser(user.id, user.fullName);
  const { data, error } = await supabase
    .from("magazine_articles")
    .insert({
      title,
      slug: uniqueSlug(title),
      author_id: user.id,
      contributor_id: contributor?.id ?? null,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not create the article." };

  const id = (data as { id: string }).id;
  await logAudit(supabase, "magazine.article.create", "magazine_article", id);
  if (scope === "admin") redirect(`/admin/magazine/articles/${id}`);
  redirect(`/portal/magazine/${id}/edit`);
}

/* ===================== persist blocks + version snapshot ================== */
function parseBlocks(raw: FormDataEntryValue | null): ArticleBlock[] {
  if (typeof raw !== "string" || !raw) return [];
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return [];
  }
  const parsed = blocksPayloadSchema.safeParse(json);
  if (!parsed.success) return [];
  return parsed.data
    .filter((b) => isBlockType(b.type))
    .map((b) => ({ id: b.id, type: b.type as ArticleBlock["type"], hidden: b.hidden, data: b.data }));
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

async function persistBlocks(supabase: SupabaseServer, articleId: string, blocks: ArticleBlock[]) {
  await supabase.from("magazine_article_blocks").delete().eq("article_id", articleId);
  if (blocks.length === 0) return;
  const payload: MagazineArticleBlockInsert[] = blocks.map((b, i) => ({
    article_id: articleId,
    sort_order: i,
    block_type: b.type,
    hidden: b.hidden,
    data: b.data,
  }));
  await supabase.from("magazine_article_blocks").insert(payload);
}

async function snapshotVersion(
  supabase: SupabaseServer,
  articleId: string,
  createdBy: string,
  snapshot: Record<string, unknown>
) {
  const { data } = await supabase
    .from("magazine_article_versions")
    .select("version")
    .eq("article_id", articleId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const next = ((data as { version: number } | null)?.version ?? 0) + 1;
  await supabase
    .from("magazine_article_versions")
    .insert({ article_id: articleId, version: next, snapshot, created_by: createdBy });
}

/* ============================ author/staff: save ========================== */
export async function saveArticle(articleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = articleMetaSchema.safeParse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt") ?? "",
    category_id: formData.get("category_id") ?? "",
    edition_id: formData.get("edition_id") ?? "",
    cover_image: formData.get("cover_image") ?? "",
    seo_title: formData.get("seo_title") ?? "",
    seo_description: formData.get("seo_description") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const blocks = parseBlocks(formData.get("blocks"));
  const plain = blocksToPlainText(blocks);
  const meta = parsed.data;
  const supabase = await createClient();

  const patch: MagazineArticleUpdate = {
    title: meta.title,
    excerpt: meta.excerpt || deriveExcerpt(plain) || null,
    category_id: meta.category_id || null,
    edition_id: meta.edition_id || null,
    cover_image: meta.cover_image || null,
    seo_title: meta.seo_title || null,
    seo_description: meta.seo_description || null,
    content: plain || null,
    reading_time: estimateReadingTime(plain),
  };
  const { error } = await supabase.from("magazine_articles").update(patch).eq("id", articleId);
  if (error) return { error: "Could not save your changes." };

  await persistBlocks(supabase, articleId, blocks);
  await snapshotVersion(supabase, articleId, user.id, {
    title: meta.title,
    excerpt: patch.excerpt ?? null,
    cover_image: patch.cover_image ?? null,
    blocks,
    savedAt: new Date().toISOString(),
  });
  await logAudit(supabase, "magazine.article.save", "magazine_article", articleId);

  // Optional: submit for review in the same action.
  if (formData.get("intent") === "submit") {
    const { data: cur } = await supabase
      .from("magazine_articles")
      .select("status, author_id")
      .eq("id", articleId)
      .maybeSingle();
    const row = cur as { status: ArticleStatus; author_id: string } | null;
    if (row && row.author_id === user.id && (row.status === "draft" || row.status === "revision_required")) {
      await supabase.from("magazine_articles").update({ status: "review" }).eq("id", articleId);
      await notify(supabase, "submitted", articleId, { title: meta.title });
      await logAudit(supabase, "magazine.article.submit", "magazine_article", articleId);
      revalidatePath("/portal/magazine");
      revalidatePath("/admin/magazine/review");
      redirect("/portal/magazine?submitted=1");
    }
  }

  revalidatePath(`/portal/magazine/${articleId}/edit`);
  revalidatePath(`/admin/magazine/articles/${articleId}`);
  return { message: "Saved." };
}

/* ============================ editorial workflow ========================== */
export async function submitForReview(articleId: string) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase
    .from("magazine_articles")
    .update({ status: "review" })
    .eq("id", articleId)
    .eq("author_id", user.id);
  await notify(supabase, "submitted", articleId);
  await logAudit(supabase, "magazine.article.submit", "magazine_article", articleId);
  revalidatePath("/portal/magazine");
  revalidatePath("/admin/magazine/review");
}

export async function reviewArticle(articleId: string, decision: ReviewDecision, remarks?: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();

  // Build the status transition. Approval is terminal: it makes the article
  // public immediately (Draft → Review → Approved → Published, no manual step),
  // unless a future publish time is set, in which case it is scheduled and the
  // cron route flips it live at that time.
  const patch: MagazineArticleUpdate = { editor_id: user.id };
  if (decision === "approve") {
    const { data } = await supabase
      .from("magazine_articles")
      .select("scheduled_at, published_at")
      .eq("id", articleId)
      .maybeSingle();
    const row = data as { scheduled_at: string | null; published_at: string | null } | null;
    const future = row?.scheduled_at ? new Date(row.scheduled_at).getTime() > Date.now() : false;
    if (future) {
      patch.status = "scheduled";
    } else {
      patch.status = "published";
      patch.published_at = row?.published_at ?? new Date().toISOString();
      patch.scheduled_at = null;
    }
  } else if (decision === "revise") {
    patch.status = "revision_required";
  } else {
    patch.status = "draft";
  }

  await supabase.from("magazine_articles").update(patch).eq("id", articleId);
  await supabase
    .from("magazine_editor_reviews")
    .insert({ article_id: articleId, reviewer_id: user.id, decision, remarks: remarks ?? null });
  await notify(supabase, `review.${decision}`, articleId, { remarks: remarks ?? "" });
  await logAudit(supabase, `magazine.article.review_${decision}`, "magazine_article", articleId);
  revalidatePath("/admin/magazine/review");
  revalidatePath("/admin/magazine");
  revalidatePath(`/admin/magazine/articles/${articleId}`);
  revalidatePath("/portal/magazine");
  revalidatePath(PUBLIC);
  revalidatePath("/");
}

/** Editor review submitted from a form (with remarks). */
export async function reviewArticleForm(articleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const decision = String(formData.get("decision") ?? "") as ReviewDecision;
  if (!["approve", "revise", "reject"].includes(decision)) return { error: "Choose a decision." };
  const remarks = String(formData.get("remarks") ?? "").trim();
  await reviewArticle(articleId, decision, remarks || undefined);
  return { message: "Review recorded." };
}

export async function scheduleArticle(articleId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "Not allowed." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };
  const when = String(formData.get("scheduled_at") ?? "").trim();
  if (!when) return { fieldErrors: { scheduled_at: "Pick a date and time." } };
  const iso = new Date(when).toISOString();
  const supabase = await createClient();
  await supabase
    .from("magazine_articles")
    .update({ status: "scheduled", scheduled_at: iso, editor_id: user.id })
    .eq("id", articleId);
  await notify(supabase, "scheduled", articleId, { scheduled_at: iso });
  await logAudit(supabase, "magazine.article.schedule", "magazine_article", articleId);
  revalidatePath(`/admin/magazine/articles/${articleId}`);
  return { message: "Scheduled." };
}

export async function publishArticle(articleId: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from("magazine_articles")
    .select("published_at")
    .eq("id", articleId)
    .maybeSingle();
  const existing = (data as { published_at: string | null } | null)?.published_at;
  const patch: MagazineArticleUpdate = {
    status: "published",
    editor_id: user.id,
    published_at: existing ?? new Date().toISOString(),
    scheduled_at: null,
  };
  await supabase.from("magazine_articles").update(patch).eq("id", articleId);
  await notify(supabase, "published", articleId);
  await logAudit(supabase, "magazine.article.publish", "magazine_article", articleId);
  revalidatePath(PUBLIC);
  revalidatePath("/");
  revalidatePath(`/admin/magazine/articles/${articleId}`);
  revalidatePath("/admin/magazine");
}

export async function archiveArticle(articleId: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("magazine_articles").update({ status: "archived" }).eq("id", articleId);
  await logAudit(supabase, "magazine.article.archive", "magazine_article", articleId);
  revalidatePath(PUBLIC);
  revalidatePath("/");
  revalidatePath("/admin/magazine");
  revalidatePath(`/admin/magazine/articles/${articleId}`);
}

export async function setFeatured(articleId: string, featured: boolean) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("magazine_articles").update({ featured }).eq("id", articleId);
  await logAudit(supabase, featured ? "magazine.article.feature" : "magazine.article.unfeature", "magazine_article", articleId);
  revalidatePath(PUBLIC);
  revalidatePath("/");
  revalidatePath("/admin/magazine/articles");
}

export async function deleteArticle(articleId: string, scope: "portal" | "admin" = "admin") {
  const user = await getCurrentUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  // Authorization is enforced by RLS: an admin may delete any article; a member
  // may only delete their own draft. The delete is a no-op if not permitted.
  await supabase.from("magazine_articles").delete().eq("id", articleId);
  await logAudit(supabase, "magazine.article.delete", "magazine_article", articleId);
  const dest = scope === "portal" ? "/portal/magazine" : "/admin/magazine/articles";
  revalidatePath(dest);
  revalidatePath(PUBLIC);
  revalidatePath("/");
  redirect(dest);
}

/* ================================ versions ================================ */
export async function restoreVersion(articleId: string, versionId: string) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from("magazine_article_versions")
    .select("snapshot")
    .eq("id", versionId)
    .eq("article_id", articleId)
    .maybeSingle();
  const snap = (data as { snapshot: Record<string, unknown> } | null)?.snapshot;
  if (!snap) return;

  const rawBlocks = Array.isArray(snap.blocks) ? (snap.blocks as unknown[]) : [];
  const blocks: ArticleBlock[] = rawBlocks
    .map((b) => b as Record<string, unknown>)
    .filter((b) => typeof b.type === "string" && isBlockType(b.type as string))
    .map((b) => ({
      id: String(b.id ?? crypto.randomUUID()),
      type: b.type as ArticleBlock["type"],
      hidden: Boolean(b.hidden),
      data: (b.data as Record<string, unknown>) ?? {},
    }));
  const plain = blocksToPlainText(blocks);
  const patch: MagazineArticleUpdate = {
    title: typeof snap.title === "string" ? snap.title : undefined,
    excerpt: typeof snap.excerpt === "string" ? snap.excerpt : null,
    cover_image: typeof snap.cover_image === "string" ? snap.cover_image : null,
    content: plain || null,
    reading_time: estimateReadingTime(plain),
  };
  await supabase.from("magazine_articles").update(patch).eq("id", articleId);
  await persistBlocks(supabase, articleId, blocks);
  await snapshotVersion(supabase, articleId, user.id, {
    title: patch.title ?? null,
    excerpt: patch.excerpt ?? null,
    cover_image: patch.cover_image ?? null,
    blocks,
    restoredFrom: versionId,
    savedAt: new Date().toISOString(),
  });
  await logAudit(supabase, "magazine.article.restore_version", "magazine_article", articleId, { versionId });
  revalidatePath(`/admin/magazine/articles/${articleId}`);
  revalidatePath(`/portal/magazine/${articleId}/edit`);
}

/* ============================== bulk actions ============================== */
export async function bulkSetStatus(ids: string[], status: ArticleStatus) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured() || ids.length === 0) return;
  const supabase = await createClient();
  const patch: MagazineArticleUpdate = { status };
  if (status === "published") patch.published_at = new Date().toISOString();
  await supabase.from("magazine_articles").update(patch).in("id", ids);
  await logAudit(supabase, `magazine.bulk.${status}`, "magazine_article", null, { count: ids.length });
  revalidatePath("/admin/magazine/articles");
  revalidatePath(PUBLIC);
  revalidatePath("/");
}

export async function bulkSetFeatured(ids: string[], featured: boolean) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured() || ids.length === 0) return;
  const supabase = await createClient();
  await supabase.from("magazine_articles").update({ featured }).in("id", ids);
  await logAudit(supabase, featured ? "magazine.bulk.feature" : "magazine.bulk.unfeature", "magazine_article", null, { count: ids.length });
  revalidatePath("/admin/magazine/articles");
  revalidatePath(PUBLIC);
}

export async function bulkDelete(ids: string[]) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured() || ids.length === 0) return;
  const supabase = await createClient();
  await supabase.from("magazine_articles").delete().in("id", ids);
  await logAudit(supabase, "magazine.bulk.delete", "magazine_article", null, { count: ids.length });
  revalidatePath("/admin/magazine/articles");
}

export async function bulkMove(ids: string[], field: "edition_id" | "category_id", value: string | null) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured() || ids.length === 0) return;
  const supabase = await createClient();
  const patch: MagazineArticleUpdate = field === "edition_id" ? { edition_id: value } : { category_id: value };
  await supabase.from("magazine_articles").update(patch).in("id", ids);
  await logAudit(supabase, `magazine.bulk.move_${field}`, "magazine_article", null, { count: ids.length, value });
  revalidatePath("/admin/magazine/articles");
}

/* ============================== editions ================================== */
export async function createEdition(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "Not allowed." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };
  const parsed = editionInputSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    cover_image: formData.get("cover_image") ?? "",
    volume: formData.get("volume") ?? undefined,
    issue_number: formData.get("issue_number") ?? undefined,
    seo_title: formData.get("seo_title") ?? "",
    seo_description: formData.get("seo_description") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("magazine_editions").insert({
    title: d.title,
    slug: uniqueSlug(d.title),
    description: d.description || null,
    cover_image: d.cover_image || null,
    volume: d.volume ?? null,
    issue_number: d.issue_number ?? null,
    seo_title: d.seo_title || null,
    seo_description: d.seo_description || null,
    created_by: user.id,
  });
  if (error) return { error: "Could not create the edition." };
  await logAudit(supabase, "magazine.edition.create", "magazine_edition", null, { title: d.title });
  revalidatePath("/admin/magazine/editions");
  return { message: "Edition created." };
}

export async function setEditionStatus(id: string, status: ContentStatus) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  const patch = status === "published"
    ? { status, published_at: new Date().toISOString() }
    : { status };
  await supabase.from("magazine_editions").update(patch).eq("id", id);
  await logAudit(supabase, `magazine.edition.${status}`, "magazine_edition", id);
  revalidatePath("/admin/magazine/editions");
  revalidatePath(PUBLIC);
}

export async function deleteEdition(id: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("magazine_editions").delete().eq("id", id);
  await logAudit(supabase, "magazine.edition.delete", "magazine_edition", id);
  revalidatePath("/admin/magazine/editions");
}

/* ============================== categories ================================ */
export async function createCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "Not allowed." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };
  const parsed = categoryInputSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") ?? "",
    icon: formData.get("icon") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("magazine_categories").insert({
    name: d.name,
    slug: slugify(d.name),
    color: d.color || null,
    icon: d.icon || null,
  });
  if (error) return { error: "Could not create the category (the name may already exist)." };
  await logAudit(supabase, "magazine.category.create", "magazine_category", null, { name: d.name });
  revalidatePath("/admin/magazine/categories");
  return { message: "Category created." };
}

export async function deleteCategory(id: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("magazine_categories").delete().eq("id", id);
  await logAudit(supabase, "magazine.category.delete", "magazine_category", id);
  revalidatePath("/admin/magazine/categories");
}

/* =============================== comments ================================= */
export async function addComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to comment." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };
  const parsed = commentInputSchema.safeParse({
    article_id: formData.get("article_id"),
    content: formData.get("content"),
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const supabase = await createClient();
  // Rate-limit: at most 3 comments per member per minute.
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from("magazine_comments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= 3) return { error: "You're commenting too quickly — please wait a moment." };

  const { error } = await supabase.from("magazine_comments").insert({
    article_id: parsed.data.article_id,
    user_id: user.id,
    content: parsed.data.content,
    status: "pending",
  });
  if (error) return { error: "Could not post your comment." };
  await logAudit(supabase, "magazine.comment.create", "magazine_comment", parsed.data.article_id);
  return { message: "Thanks! Your comment will appear once approved." };
}

export async function moderateComment(id: string, status: MagazineCommentStatus) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("magazine_comments").update({ status }).eq("id", id);
  await logAudit(supabase, `magazine.comment.${status}`, "magazine_comment", id);
  revalidatePath("/admin/magazine/comments");
}

export async function deleteComment(id: string) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("magazine_comments").delete().eq("id", id);
  await logAudit(supabase, "magazine.comment.delete", "magazine_comment", id);
  revalidatePath("/admin/magazine/comments");
}

/* ====================== bookmarks + reactions ============================= */
export async function toggleBookmark(articleId: string, slug: string) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from("magazine_bookmarks")
    .select("id")
    .eq("article_id", articleId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (data) {
    await supabase.from("magazine_bookmarks").delete().eq("id", (data as { id: string }).id);
  } else {
    await supabase.from("magazine_bookmarks").insert({ article_id: articleId, user_id: user.id });
  }
  revalidatePath(`/magazine/article/${slug}`);
  revalidatePath("/portal/magazine");
}

export async function setReaction(articleId: string, slug: string, reaction: MagazineReaction) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from("magazine_reactions")
    .select("id, reaction")
    .eq("article_id", articleId)
    .eq("user_id", user.id)
    .maybeSingle();
  const existing = data as { id: string; reaction: MagazineReaction } | null;
  if (existing && existing.reaction === reaction) {
    await supabase.from("magazine_reactions").delete().eq("id", existing.id);
  } else if (existing) {
    await supabase.from("magazine_reactions").update({ reaction }).eq("id", existing.id);
  } else {
    await supabase.from("magazine_reactions").insert({ article_id: articleId, user_id: user.id, reaction });
  }
  revalidatePath(`/magazine/article/${slug}`);
}

/* ============================== view counter ============================== */
export async function recordView(articleId: string) {
  if (!isSupabaseConfigured()) return;
  const supabase = await createClient();
  const rpc = supabase.rpc.bind(supabase) as (
    fn: string,
    args: Record<string, unknown>
  ) => PromiseLike<{ error: unknown }>;
  try {
    await rpc("magazine_increment_view", { p_article: articleId });
  } catch {
    // best-effort
  }
}
