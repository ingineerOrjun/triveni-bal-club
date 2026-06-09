import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  CmsPageRow,
  CmsPageVersionRow,
  CmsMenuRow,
  CmsMenuItemRow,
} from "@/types/database";
import type { Block } from "@/lib/cms/blocks";

export type CmsPage = Omit<CmsPageRow, "blocks"> & { blocks: Block[] };

function asBlocks(value: unknown): Block[] {
  return Array.isArray(value) ? (value as Block[]) : [];
}

export async function listPages(): Promise<CmsPageRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_pages")
    .select("*")
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return (data as CmsPageRow[] | null) ?? [];
}

export async function getPage(id: string): Promise<CmsPage | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("cms_pages").select("*").eq("id", id).maybeSingle();
  const page = data as CmsPageRow | null;
  return page ? { ...page, blocks: asBlocks(page.blocks) } : null;
}

export async function getPublishedPageBySlug(slug: string): Promise<CmsPage | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  const page = data as CmsPageRow | null;
  return page ? { ...page, blocks: asBlocks(page.blocks) } : null;
}

export async function listVersions(pageId: string): Promise<CmsPageVersionRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_page_versions")
    .select("*")
    .eq("page_id", pageId)
    .order("version", { ascending: false });
  return (data as CmsPageVersionRow[] | null) ?? [];
}

export async function listMenus(): Promise<CmsMenuRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("cms_menus").select("*").order("name");
  return (data as CmsMenuRow[] | null) ?? [];
}

export async function getMenuItems(menuId: string): Promise<CmsMenuItemRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_menu_items")
    .select("*")
    .eq("menu_id", menuId)
    .order("sort_order", { ascending: true });
  return (data as CmsMenuItemRow[] | null) ?? [];
}

export interface CmsAnalytics {
  total: number;
  drafts: number;
  scheduled: number;
  published: number;
  recentlyEdited: { id: string; title: string; updated_at: string | null; status: string }[];
}

export async function getCmsAnalytics(): Promise<CmsAnalytics> {
  if (!isSupabaseConfigured())
    return { total: 0, drafts: 0, scheduled: 0, published: 0, recentlyEdited: [] };
  const supabase = await createClient();
  const head = (b: () => PromiseLike<{ count: number | null }>) => b().then((r) => r.count ?? 0);
  const [total, drafts, scheduled, published, { data: recent }] = await Promise.all([
    head(() => supabase.from("cms_pages").select("*", { count: "exact", head: true })),
    head(() => supabase.from("cms_pages").select("*", { count: "exact", head: true }).eq("status", "draft")),
    head(() => supabase.from("cms_pages").select("*", { count: "exact", head: true }).eq("status", "scheduled")),
    head(() => supabase.from("cms_pages").select("*", { count: "exact", head: true }).eq("status", "published")),
    supabase
      .from("cms_pages")
      .select("id, title, updated_at, status")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(5),
  ]);
  return {
    total,
    drafts,
    scheduled,
    published,
    recentlyEdited:
      (recent as { id: string; title: string; updated_at: string | null; status: string }[] | null) ?? [],
  };
}
