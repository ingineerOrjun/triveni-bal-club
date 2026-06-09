"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireStaffUser, requireAdminUser } from "@/lib/auth/guards";
import { logAudit } from "@/lib/supabase/audit";
import { slugify } from "@/lib/utils";
import { type FormState } from "@/lib/forms";
import type { Block } from "@/lib/cms/blocks";
import type { CmsPageRow, CmsPageVersionRow } from "@/types/database";

/* -------------------------------- pages ---------------------------------- */
export async function createPage(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "You don't have permission to do that." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 2) return { fieldErrors: { title: "Title is too short." } };

  const supabase = await createClient();
  const slug = `${slugify(title)}-${crypto.randomUUID().slice(0, 5)}`;
  const { data, error } = await supabase
    .from("cms_pages")
    .insert({ slug, title, blocks: [], created_by: user.id, updated_by: user.id })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not create the page." };

  await logAudit(supabase, "cms.page_create", "cms_page", (data as { id: string }).id);
  revalidatePath("/admin/pages");
  redirect(`/admin/pages/${(data as { id: string }).id}`);
}

/** Save block content (draft edit). Does not change publish status. */
export async function savePageContent(
  id: string,
  payload: { title: string; blocks: Block[]; seo: Record<string, unknown> }
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireStaffUser();
  if (!user) return { ok: false, error: "Not allowed." };
  if (!isSupabaseConfigured()) return { ok: false, error: "Backend not configured." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("cms_pages")
    .update({
      title: payload.title,
      blocks: payload.blocks,
      seo: payload.seo,
      updated_by: user.id,
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not save." };

  await logAudit(supabase, "cms.page_save", "cms_page", id);
  revalidatePath(`/admin/pages/${id}`);
  return { ok: true };
}

async function snapshot(id: string, note: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_pages")
    .select("title, blocks, seo, version, created_by")
    .eq("id", id)
    .maybeSingle();
  const page = data as Pick<CmsPageRow, "title" | "blocks" | "seo" | "version" | "created_by"> | null;
  if (!page) return;
  await supabase.from("cms_page_versions").insert({
    page_id: id,
    version: page.version,
    title: page.title,
    blocks: page.blocks,
    seo: page.seo,
    note,
    created_by: page.created_by,
  });
  await supabase.from("cms_pages").update({ version: page.version + 1 }).eq("id", id);
}

export async function publishPage(id: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await snapshot(id, "Published");
  await supabase
    .from("cms_pages")
    .update({ status: "published", published_at: new Date().toISOString(), scheduled_at: null })
    .eq("id", id);
  await logAudit(supabase, "cms.page_publish", "cms_page", id);
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${id}`);
}

export async function schedulePage(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "Not allowed." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };
  const when = String(formData.get("scheduled_at") ?? "").trim();
  if (!when) return { fieldErrors: { scheduled_at: "Choose a date & time." } };

  const supabase = await createClient();
  await supabase.from("cms_pages").update({ status: "scheduled", scheduled_at: when }).eq("id", id);
  await logAudit(supabase, "cms.page_schedule", "cms_page", id, { when });
  revalidatePath(`/admin/pages/${id}`);
  return { message: "Scheduled." };
}

export async function archivePage(id: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("cms_pages").update({ status: "archived" }).eq("id", id);
  await logAudit(supabase, "cms.page_archive", "cms_page", id);
  revalidatePath("/admin/pages");
}

export async function rollbackToVersion(pageId: string, versionId: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_page_versions")
    .select("*")
    .eq("id", versionId)
    .maybeSingle();
  const v = data as CmsPageVersionRow | null;
  if (!v) return;
  await snapshot(pageId, `Rolled back to v${v.version}`);
  await supabase
    .from("cms_pages")
    .update({ title: v.title, blocks: v.blocks, seo: v.seo, updated_by: user.id })
    .eq("id", pageId);
  await logAudit(supabase, "cms.page_rollback", "cms_page", pageId, { version: v.version });
  revalidatePath(`/admin/pages/${pageId}`);
}

export async function duplicatePage(id: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  const { data } = await supabase.from("cms_pages").select("*").eq("id", id).maybeSingle();
  const page = data as CmsPageRow | null;
  if (!page) return;
  await supabase.from("cms_pages").insert({
    slug: `${page.slug}-copy-${crypto.randomUUID().slice(0, 4)}`,
    title: `${page.title} (copy)`,
    blocks: page.blocks,
    seo: page.seo,
    status: "draft",
    created_by: user.id,
    updated_by: user.id,
  });
  await logAudit(supabase, "cms.page_duplicate", "cms_page", id);
  revalidatePath("/admin/pages");
}

export async function deletePage(id: string) {
  const user = await requireAdminUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("cms_pages").delete().eq("id", id);
  await logAudit(supabase, "cms.page_delete", "cms_page", id);
  revalidatePath("/admin/pages");
}

/* -------------------------------- menus ---------------------------------- */
export async function createMenu(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "Not allowed." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };
  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim() || slugify(name);
  if (!name) return { fieldErrors: { name: "Name required." } };
  const supabase = await createClient();
  const { error } = await supabase.from("cms_menus").insert({ name, location });
  if (error) return { error: "Could not create menu (location may already exist)." };
  await logAudit(supabase, "cms.menu_create", "cms_menu", null, { location });
  revalidatePath("/admin/menus");
  return { message: "Menu created." };
}

export async function addMenuItem(
  menuId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "Not allowed." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };
  const label = String(formData.get("label") ?? "").trim();
  const href = String(formData.get("href") ?? "").trim();
  if (!label || !href) return { error: "Label and link are required." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("cms_menu_items")
    .select("*", { count: "exact", head: true })
    .eq("menu_id", menuId);
  await supabase.from("cms_menu_items").insert({
    menu_id: menuId,
    label,
    href,
    new_tab: formData.get("new_tab") === "on",
    sort_order: count ?? 0,
  });
  await logAudit(supabase, "cms.menu_item_add", "cms_menu", menuId);
  revalidatePath("/admin/menus");
  return { message: "Link added." };
}

export async function deleteMenuItem(id: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("cms_menu_items").delete().eq("id", id);
  revalidatePath("/admin/menus");
}

export async function moveMenuItem(id: string, dir: "up" | "down") {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_menu_items")
    .select("id, menu_id, sort_order")
    .eq("id", id)
    .maybeSingle();
  const item = data as { id: string; menu_id: string; sort_order: number } | null;
  if (!item) return;
  const { data: siblings } = await supabase
    .from("cms_menu_items")
    .select("id, sort_order")
    .eq("menu_id", item.menu_id)
    .order("sort_order", { ascending: true });
  const list = (siblings as { id: string; sort_order: number }[] | null) ?? [];
  const idx = list.findIndex((s) => s.id === id);
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= list.length) return;
  const a = list[idx];
  const b = list[swapIdx];
  await supabase.from("cms_menu_items").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("cms_menu_items").update({ sort_order: a.sort_order }).eq("id", b.id);
  revalidatePath("/admin/menus");
}
