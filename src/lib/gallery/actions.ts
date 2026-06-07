"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireStaffUser, requireAdminUser } from "@/lib/auth/guards";
import { logAudit } from "@/lib/supabase/audit";
import { registerUsage, unregisterUsage } from "@/lib/media/actions";
import { slugify } from "@/lib/utils";
import { type FormState } from "@/lib/forms";
import type { ContentStatus } from "@/types/database";

export async function createAlbum(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "You don't have permission to do that." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 3) return { fieldErrors: { title: "Title is too short." } };

  const supabase = await createClient();
  const slug = `${slugify(title)}-${crypto.randomUUID().slice(0, 5)}`;
  const { data, error } = await supabase
    .from("gallery_albums")
    .insert({
      slug,
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      category: String(formData.get("category") ?? "").trim() || null,
      seo_description: String(formData.get("seo_description") ?? "").trim() || null,
      created_by: user.id,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not create the album." };

  const newId = (data as { id: string }).id;
  await logAudit(supabase, "gallery.album_create", "gallery_album", newId);
  revalidatePath("/admin/gallery");
  redirect(`/admin/gallery/${newId}`);
}

export async function updateAlbum(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "You don't have permission to do that." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("gallery_albums")
    .update({
      title: String(formData.get("title") ?? "").trim() || undefined,
      description: String(formData.get("description") ?? "").trim() || null,
      category: String(formData.get("category") ?? "").trim() || null,
      seo_description: String(formData.get("seo_description") ?? "").trim() || null,
      featured: formData.get("featured") === "on",
    })
    .eq("id", id);
  if (error) return { error: "Could not save changes." };

  await logAudit(supabase, "gallery.album_update", "gallery_album", id);
  revalidatePath(`/admin/gallery/${id}`);
  revalidatePath("/admin/gallery");
  return { message: "Saved." };
}

export async function setAlbumStatus(id: string, status: ContentStatus) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  const patch: { status: ContentStatus; published_at?: string } = { status };
  if (status === "published") patch.published_at = new Date().toISOString();
  await supabase.from("gallery_albums").update(patch).eq("id", id);
  await logAudit(supabase, `gallery.album_${status}`, "gallery_album", id);
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function deleteAlbum(id: string) {
  const user = await requireAdminUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  // Release media usages held by this album's photos.
  const { data: photos } = await supabase
    .from("gallery_photos")
    .select("file_id")
    .eq("album_id", id);
  for (const p of (photos as { file_id: string }[] | null) ?? []) {
    await unregisterUsage(p.file_id, { module: "gallery", entityType: "album", entityId: id, field: "photo" });
  }
  await supabase.from("gallery_albums").delete().eq("id", id);
  await logAudit(supabase, "gallery.album_delete", "gallery_album", id);
  revalidatePath("/admin/gallery");
}

export async function addPhotoToAlbum(albumId: string, fileId: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured() || !fileId) return;
  const supabase = await createClient();
  await supabase
    .from("gallery_photos")
    .upsert({ album_id: albumId, file_id: fileId }, { onConflict: "album_id,file_id", ignoreDuplicates: true });
  await registerUsage(fileId, {
    module: "gallery",
    entityType: "album",
    entityId: albumId,
    field: "photo",
    label: "Gallery album",
  });
  await logAudit(supabase, "gallery.photo_add", "gallery_album", albumId, { file_id: fileId });
  revalidatePath(`/admin/gallery/${albumId}`);
}

export async function removePhoto(photoId: string, albumId: string, fileId: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("gallery_photos").delete().eq("id", photoId);
  // Only release the usage if the file isn't elsewhere in the same album.
  const { count } = await supabase
    .from("gallery_photos")
    .select("*", { count: "exact", head: true })
    .eq("album_id", albumId)
    .eq("file_id", fileId);
  if ((count ?? 0) === 0) {
    await unregisterUsage(fileId, { module: "gallery", entityType: "album", entityId: albumId, field: "photo" });
  }
  await logAudit(supabase, "gallery.photo_remove", "gallery_album", albumId, { file_id: fileId });
  revalidatePath(`/admin/gallery/${albumId}`);
}

export async function setAlbumCover(albumId: string, fileId: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("gallery_albums").update({ cover_file_id: fileId }).eq("id", albumId);
  await registerUsage(fileId, {
    module: "gallery",
    entityType: "album",
    entityId: albumId,
    field: "cover",
    label: "Album cover",
  });
  revalidatePath(`/admin/gallery/${albumId}`);
  revalidatePath("/admin/gallery");
}
