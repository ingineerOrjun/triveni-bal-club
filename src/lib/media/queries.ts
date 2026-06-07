import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  MediaFolderRow,
  MediaFileRow,
  MediaTagRow,
  MediaUsageRow,
  MediaCollectionRow,
} from "@/types/database";

export type { MediaFileRow, MediaFolderRow };

export interface MediaFilters {
  folderId?: string | null;
  q?: string;
  kind?: string; // "image" | "pdf" | "all"
  status?: string; // active | archived
  visibility?: string;
  tagId?: string;
  page?: number;
  pageSize?: number;
}

const PAGE_SIZE = 24;

export async function listFolders(): Promise<MediaFolderRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("media_folders")
    .select("*")
    .eq("is_archived", false)
    .order("name", { ascending: true });
  return (data as MediaFolderRow[] | null) ?? [];
}

export async function listFiles(
  filters: MediaFilters
): Promise<{ items: MediaFileRow[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? PAGE_SIZE;
  if (!isSupabaseConfigured()) return { items: [], total: 0, page, pageSize };
  const supabase = await createClient();

  let fileIds: string[] | null = null;
  if (filters.tagId) {
    const { data } = await supabase
      .from("media_file_tags")
      .select("file_id")
      .eq("tag_id", filters.tagId);
    fileIds = ((data as { file_id: string }[] | null) ?? []).map((r) => r.file_id);
    if (fileIds.length === 0) return { items: [], total: 0, page, pageSize };
  }

  let q = supabase.from("media_files").select("*", { count: "exact" });
  q = q.eq("status", filters.status ?? "active");
  if (fileIds) q = q.in("id", fileIds);
  if (filters.folderId === "root") q = q.is("folder_id", null);
  else if (filters.folderId) q = q.eq("folder_id", filters.folderId);
  if (filters.visibility) q = q.eq("visibility", filters.visibility);
  if (filters.kind === "image") q = q.ilike("mime_type", "image/%");
  else if (filters.kind === "pdf") q = q.eq("mime_type", "application/pdf");
  if (filters.q)
    q = q.or(
      `filename.ilike.%${filters.q}%,alt_text.ilike.%${filters.q}%,caption.ilike.%${filters.q}%`
    );

  const { data, count } = await q
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  return {
    items: (data as MediaFileRow[] | null) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export interface MediaFileDetail extends MediaFileRow {
  usage: MediaUsageRow[];
  tags: MediaTagRow[];
}

export async function getFileDetail(id: string): Promise<MediaFileDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("media_files").select("*").eq("id", id).maybeSingle();
  const file = data as MediaFileRow | null;
  if (!file) return null;

  const [{ data: usage }, { data: tagLinks }] = await Promise.all([
    supabase.from("media_usage").select("*").eq("file_id", id),
    supabase.from("media_file_tags").select("tag_id").eq("file_id", id),
  ]);
  const tagIds = ((tagLinks as { tag_id: string }[] | null) ?? []).map((t) => t.tag_id);
  let tags: MediaTagRow[] = [];
  if (tagIds.length) {
    const { data: t } = await supabase.from("media_tags").select("*").in("id", tagIds);
    tags = (t as MediaTagRow[] | null) ?? [];
  }
  return { ...file, usage: (usage as MediaUsageRow[] | null) ?? [], tags };
}

export async function listTags(): Promise<MediaTagRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("media_tags").select("*").order("name");
  return (data as MediaTagRow[] | null) ?? [];
}

export async function listCollections(): Promise<MediaCollectionRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("media_collections")
    .select("*")
    .order("name");
  return (data as MediaCollectionRow[] | null) ?? [];
}

export interface MediaAnalytics {
  totalAssets: number;
  storageBytes: number;
  recentUploads: MediaFileRow[];
  largestFiles: MediaFileRow[];
  unusedCount: number;
}

export async function getMediaAnalytics(): Promise<MediaAnalytics> {
  if (!isSupabaseConfigured())
    return { totalAssets: 0, storageBytes: 0, recentUploads: [], largestFiles: [], unusedCount: 0 };
  const supabase = await createClient();

  const [{ count: totalAssets }, { data: sizes }, { data: recent }, { data: largest }, { data: usedRows }] =
    await Promise.all([
      supabase.from("media_files").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("media_files").select("size").eq("status", "active"),
      supabase.from("media_files").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(6),
      supabase.from("media_files").select("*").eq("status", "active").order("size", { ascending: false }).limit(6),
      supabase.from("media_usage").select("file_id"),
    ]);

  const storageBytes = ((sizes as { size: number }[] | null) ?? []).reduce(
    (n, r) => n + (r.size ?? 0),
    0
  );
  const usedIds = new Set(((usedRows as { file_id: string }[] | null) ?? []).map((r) => r.file_id));

  return {
    totalAssets: totalAssets ?? 0,
    storageBytes,
    recentUploads: (recent as MediaFileRow[] | null) ?? [],
    largestFiles: (largest as MediaFileRow[] | null) ?? [],
    unusedCount: Math.max(0, (totalAssets ?? 0) - usedIds.size),
  };
}
