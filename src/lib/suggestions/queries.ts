import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  SuggestionRow,
  SuggestionCategoryRow,
  TagRow,
  ModeratorFeedbackRow,
  SuggestionStatusHistoryRow,
  UsersRow,
} from "@/types/database";

export type MemberRef = Pick<UsersRow, "id" | "full_name" | "email">;

export type SuggestionListItem = SuggestionRow & {
  category: SuggestionCategoryRow | null;
  tags: TagRow[];
  author: MemberRef | null;
  supported: boolean;
};

export type FeedbackView = ModeratorFeedbackRow & { moderator: MemberRef | null };
export type HistoryView = SuggestionStatusHistoryRow & {
  changedBy: MemberRef | null;
};

export type SuggestionDetail = SuggestionListItem & {
  feedback: FeedbackView[];
  history: HistoryView[];
  assignedTo: MemberRef | null;
};

export interface SuggestionFilters {
  categoryId?: string;
  status?: string;
  priority?: string;
  tagId?: string;
  sort?: "newest" | "supported" | "updated";
  q?: string;
  authorId?: string;
  page?: number;
  pageSize?: number;
}

const PAGE_SIZE = 12;

async function membersByIds(ids: (string | null)[]): Promise<Map<string, MemberRef>> {
  const map = new Map<string, MemberRef>();
  const clean = ids.filter((x): x is string => Boolean(x));
  if (clean.length === 0) return map;
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, full_name, email")
    .in("id", Array.from(new Set(clean)));
  for (const m of (data as MemberRef[] | null) ?? []) map.set(m.id, m);
  return map;
}

export async function listCategories(
  activeOnly = false
): Promise<SuggestionCategoryRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let q = supabase
    .from("suggestion_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (activeOnly) q = q.eq("is_active", true);
  const { data } = await q;
  return (data as SuggestionCategoryRow[] | null) ?? [];
}

export async function listTags(): Promise<TagRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });
  return (data as TagRow[] | null) ?? [];
}

export async function getSupportedSet(memberId: string): Promise<Set<string>> {
  if (!isSupabaseConfigured() || !memberId) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("suggestion_votes")
    .select("suggestion_id")
    .eq("member_id", memberId);
  return new Set(
    ((data as { suggestion_id: string }[] | null) ?? []).map((r) => r.suggestion_id)
  );
}

/** Attach category, tags, author, and supported flag (all batched). */
async function decorate(
  rows: SuggestionRow[],
  supported: Set<string>
): Promise<SuggestionListItem[]> {
  if (rows.length === 0) return [];
  const supabase = await createClient();

  const categories = await listCategories();
  const catById = new Map(categories.map((c) => [c.id, c]));
  const members = await membersByIds(rows.map((r) => r.author_id));

  const { data: tagLinks } = await supabase
    .from("suggestion_tags")
    .select("suggestion_id, tag_id")
    .in("suggestion_id", rows.map((r) => r.id));
  const links = (tagLinks as { suggestion_id: string; tag_id: string }[] | null) ?? [];
  const allTags = await listTags();
  const tagById = new Map(allTags.map((t) => [t.id, t]));
  const tagsBySuggestion = new Map<string, TagRow[]>();
  for (const link of links) {
    const tag = tagById.get(link.tag_id);
    if (!tag) continue;
    const arr = tagsBySuggestion.get(link.suggestion_id) ?? [];
    arr.push(tag);
    tagsBySuggestion.set(link.suggestion_id, arr);
  }

  return rows.map((r) => ({
    ...r,
    category: r.category_id ? catById.get(r.category_id) ?? null : null,
    tags: tagsBySuggestion.get(r.id) ?? [],
    author: members.get(r.author_id) ?? null,
    supported: supported.has(r.id),
  }));
}

// Minimal chainable shape used to apply filters without coupling to the exact
// supabase-js builder generics. The real builder type (Q) is preserved for the
// caller so later `.limit()` / `.range()` chaining stays fully typed.
interface Chainable {
  eq(column: string, value: string): Chainable;
  ilike(column: string, value: string): Chainable;
  order(column: string, options: { ascending: boolean }): Chainable;
}

function applyFilters<Q>(query: Q, filters: SuggestionFilters): Q {
  let q = query as unknown as Chainable;
  if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.priority) q = q.eq("priority", filters.priority);
  if (filters.authorId) q = q.eq("author_id", filters.authorId);
  if (filters.q) q = q.ilike("title", `%${filters.q}%`);
  const sort = filters.sort ?? "newest";
  if (sort === "supported") q = q.order("support_count", { ascending: false });
  else if (sort === "updated") q = q.order("updated_at", { ascending: false });
  else q = q.order("created_at", { ascending: false });
  return q as unknown as Q;
}

/** Member browse feed: members/public ideas (RLS hides drafts & anonymity). */
export async function listMemberFeed(
  filters: SuggestionFilters,
  memberId: string
): Promise<SuggestionListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  let rowIds: string[] | null = null;
  if (filters.tagId) {
    const { data } = await supabase
      .from("suggestion_tags")
      .select("suggestion_id")
      .eq("tag_id", filters.tagId);
    rowIds = ((data as { suggestion_id: string }[] | null) ?? []).map(
      (r) => r.suggestion_id
    );
    if (rowIds.length === 0) return [];
  }

  let base = supabase.from("suggestions").select("*").neq("status", "draft");
  if (rowIds) base = base.in("id", rowIds);
  const query = applyFilters(base, filters);
  const { data } = await query.limit(60);
  const rows = (data as SuggestionRow[] | null) ?? [];
  const supported = await getSupportedSet(memberId);
  return decorate(rows, supported);
}

export async function listMySuggestions(
  memberId: string
): Promise<SuggestionListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("suggestions")
    .select("*")
    .eq("author_id", memberId)
    .order("created_at", { ascending: false });
  const rows = (data as SuggestionRow[] | null) ?? [];
  return decorate(rows, new Set());
}

/** Public Student-Voice feed (approved public, RLS-enforced). */
export async function listPublicSuggestions(
  limit = 24
): Promise<SuggestionListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("suggestions")
    .select("*")
    .eq("visibility", "public")
    .in("status", ["accepted", "planned", "in_progress", "implemented"])
    .order("support_count", { ascending: false })
    .limit(limit);
  const rows = (data as SuggestionRow[] | null) ?? [];
  return decorate(rows, new Set());
}

/** Staff moderation list with filters + pagination. */
export async function listModeration(
  filters: SuggestionFilters
): Promise<{ items: SuggestionListItem[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? PAGE_SIZE;
  if (!isSupabaseConfigured()) return { items: [], total: 0, page, pageSize };
  const supabase = await createClient();

  let rowIds: string[] | null = null;
  if (filters.tagId) {
    const { data } = await supabase
      .from("suggestion_tags")
      .select("suggestion_id")
      .eq("tag_id", filters.tagId);
    rowIds = ((data as { suggestion_id: string }[] | null) ?? []).map(
      (r) => r.suggestion_id
    );
    if (rowIds.length === 0) return { items: [], total: 0, page, pageSize };
  }

  let base = supabase.from("suggestions").select("*", { count: "exact" });
  if (rowIds) base = base.in("id", rowIds);
  const query = applyFilters(base, filters).range(
    (page - 1) * pageSize,
    page * pageSize - 1
  );
  const { data, count } = await query;
  const rows = (data as SuggestionRow[] | null) ?? [];
  const items = await decorate(rows, new Set());
  return { items, total: count ?? 0, page, pageSize };
}

export async function getSuggestionDetail(
  id: string,
  viewerId: string
): Promise<SuggestionDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("suggestions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const row = data as SuggestionRow | null;
  if (!row) return null;

  const supported = await getSupportedSet(viewerId);
  const [base] = await decorate([row], supported);

  const [{ data: fb }, { data: hist }] = await Promise.all([
    supabase
      .from("moderator_feedback")
      .select("*")
      .eq("suggestion_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("suggestion_status_history")
      .select("*")
      .eq("suggestion_id", id)
      .order("created_at", { ascending: true }),
  ]);
  const feedbackRows = (fb as ModeratorFeedbackRow[] | null) ?? [];
  const historyRows = (hist as SuggestionStatusHistoryRow[] | null) ?? [];

  const refIds = [
    ...feedbackRows.map((f) => f.moderator_id),
    ...historyRows.map((h) => h.changed_by),
    row.assigned_to,
  ];
  const members = await membersByIds(refIds);

  return {
    ...base,
    feedback: feedbackRows.map((f) => ({
      ...f,
      moderator: f.moderator_id ? members.get(f.moderator_id) ?? null : null,
    })),
    history: historyRows.map((h) => ({
      ...h,
      changedBy: h.changed_by ? members.get(h.changed_by) ?? null : null,
    })),
    assignedTo: row.assigned_to ? members.get(row.assigned_to) ?? null : null,
  };
}

/** Lightweight list of other suggestions to merge into (staff). */
export async function listMergeCandidates(
  excludeId: string
): Promise<{ id: string; title: string }[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("suggestions")
    .select("id, title")
    .neq("id", excludeId)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as { id: string; title: string }[] | null) ?? [];
}

/** Active members for assignment pickers (staff). */
export async function listAssignableModerators(): Promise<MemberRef[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, full_name, email")
    .in("role", ["moderator", "admin"])
    .eq("is_active", true)
    .order("full_name", { ascending: true });
  return (data as MemberRef[] | null) ?? [];
}
