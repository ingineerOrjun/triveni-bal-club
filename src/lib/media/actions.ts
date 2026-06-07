"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireStaffUser, requireAdminUser } from "@/lib/auth/guards";
import { logAudit } from "@/lib/supabase/audit";
import { slugify } from "@/lib/utils";
import { type FormState } from "@/lib/forms";
import {
  ALLOWED_MIME,
  MAX_UPLOAD_BYTES,
  buildPublicUrl,
  buildThumbUrl,
  isPublicBucket,
  isImageMime,
  extOf,
} from "./storage";

/* ------------------------------- folders --------------------------------- */
export async function createFolder(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireAdminUser();
  if (!user) return { error: "Admins only." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const name = String(formData.get("name") ?? "").trim();
  const parentId = String(formData.get("parent_id") ?? "") || null;
  if (name.length < 2) return { fieldErrors: { name: "Name is too short." } };

  const supabase = await createClient();
  let path = "/";
  if (parentId) {
    const { data: parent } = await supabase
      .from("media_folders")
      .select("path, name")
      .eq("id", parentId)
      .maybeSingle();
    const p = parent as { path: string; name: string } | null;
    if (p) path = `${p.path === "/" ? "" : p.path}/${slugify(p.name)}`;
  }

  const { error } = await supabase.from("media_folders").insert({
    name,
    slug: slugify(name),
    parent_id: parentId,
    path,
    created_by: user.id,
  });
  if (error) return { error: "Could not create the folder." };

  await logAudit(supabase, "media.folder_create", "media_folder", null, { name });
  revalidatePath("/admin/media");
  return { message: "Folder created." };
}

/* ------------------------------- uploads --------------------------------- */
export interface RecordUploadInput {
  bucket: string;
  objectPath: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  checksum?: string | null;
  folderId?: string | null;
  visibility?: "public" | "private";
}

/**
 * Record a file in the library AFTER it has been uploaded to Storage by the
 * browser client (RLS-bound). Performs server-side validation + checksum
 * de-duplication; cleans up the just-uploaded object if it's a duplicate.
 */
export async function recordUpload(
  input: RecordUploadInput
): Promise<{ ok: boolean; fileId?: string; duplicate?: boolean; error?: string }> {
  const user = await requireStaffUser();
  if (!user) return { ok: false, error: "You don't have permission to upload." };
  if (!isSupabaseConfigured()) return { ok: false, error: "Backend not configured." };

  if (!ALLOWED_MIME.includes(input.mimeType)) {
    return { ok: false, error: "That file type is not allowed." };
  }
  if (input.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "That file is too large (max 15 MB)." };
  }

  const supabase = await createClient();

  // Duplicate detection by checksum.
  if (input.checksum) {
    const { data: existing } = await supabase
      .from("media_files")
      .select("id")
      .eq("checksum", input.checksum)
      .maybeSingle();
    if (existing) {
      await supabase.storage.from(input.bucket).remove([input.objectPath]);
      return { ok: true, fileId: (existing as { id: string }).id, duplicate: true };
    }
  }

  const isPublic = isPublicBucket(input.bucket) && (input.visibility ?? "public") === "public";
  const publicUrl = isPublic ? buildPublicUrl(input.bucket, input.objectPath) : null;
  const thumbnailUrl =
    isPublic && isImageMime(input.mimeType)
      ? buildThumbUrl(input.bucket, input.objectPath, 400)
      : null;

  const { data, error } = await supabase
    .from("media_files")
    .insert({
      filename: input.filename,
      original_filename: input.originalFilename,
      slug: slugify(input.originalFilename.replace(/\.[^.]+$/, "")),
      extension: extOf(input.originalFilename),
      mime_type: input.mimeType,
      width: input.width ?? null,
      height: input.height ?? null,
      size: input.size,
      folder_id: input.folderId ?? null,
      bucket: input.bucket,
      object_path: input.objectPath,
      public_url: publicUrl,
      thumbnail_url: thumbnailUrl,
      checksum: input.checksum ?? null,
      visibility: isPublicBucket(input.bucket) ? (input.visibility ?? "public") : "private",
      uploaded_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Could not save the file record." };

  await logAudit(supabase, "media.upload", "media_file", (data as { id: string }).id, {
    bucket: input.bucket,
    size: input.size,
  });
  revalidatePath("/admin/media");
  return { ok: true, fileId: (data as { id: string }).id };
}

/* ----------------------------- file metadata ----------------------------- */
export async function updateFileMeta(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "You don't have permission to do that." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("media_files")
    .update({
      filename: String(formData.get("filename") ?? "").trim() || undefined,
      alt_text: String(formData.get("alt_text") ?? "").trim() || null,
      caption: String(formData.get("caption") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      folder_id: String(formData.get("folder_id") ?? "") || null,
    })
    .eq("id", id);
  if (error) return { error: "Could not save changes." };

  await logAudit(supabase, "media.metadata", "media_file", id);
  revalidatePath("/admin/media");
  revalidatePath(`/admin/media/${id}`);
  return { message: "Saved." };
}

export async function archiveFile(id: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("media_files").update({ status: "archived" }).eq("id", id);
  await logAudit(supabase, "media.archive", "media_file", id);
  revalidatePath("/admin/media");
}

export async function restoreFile(id: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("media_files").update({ status: "active" }).eq("id", id);
  await logAudit(supabase, "media.restore", "media_file", id);
  revalidatePath("/admin/media");
}

export async function deleteFile(id: string) {
  const user = await requireAdminUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();

  const { data } = await supabase
    .from("media_files")
    .select("bucket, object_path")
    .eq("id", id)
    .maybeSingle();
  const file = data as { bucket: string; object_path: string } | null;

  // The delete trigger blocks files that are still in use.
  const { error } = await supabase.from("media_files").delete().eq("id", id);
  if (error) return; // in-use or other constraint — keep the row

  if (file) await supabase.storage.from(file.bucket).remove([file.object_path]);
  await logAudit(supabase, "media.delete", "media_file", id);
  revalidatePath("/admin/media");
}

/* ----------------------------- bulk actions ------------------------------ */
export async function bulkArchiveFiles(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "You don't have permission to do that." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  if (ids.length === 0) return { error: "Select at least one file." };
  const supabase = await createClient();
  await supabase.from("media_files").update({ status: "archived" }).in("id", ids);
  await logAudit(supabase, "media.bulk_archive", "media_file", null, { count: ids.length });
  revalidatePath("/admin/media");
  return { message: `Archived ${ids.length} file(s).` };
}

/* -------------------------------- tags ----------------------------------- */
export async function addTagToFile(fileId: string, name: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  const supabase = await createClient();
  const slug = slugify(trimmed);
  await supabase.from("media_tags").upsert({ slug, name: trimmed }, { onConflict: "slug", ignoreDuplicates: true });
  const { data: tag } = await supabase.from("media_tags").select("id").eq("slug", slug).maybeSingle();
  if (tag) {
    await supabase
      .from("media_file_tags")
      .upsert({ file_id: fileId, tag_id: (tag as { id: string }).id }, { onConflict: "file_id,tag_id", ignoreDuplicates: true });
    await logAudit(supabase, "media.tag", "media_file", fileId, { tag: slug });
    revalidatePath(`/admin/media/${fileId}`);
  }
}

/* ------------------------------ favorites -------------------------------- */
export async function toggleFavorite(fileId: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("media_favorites")
    .select("file_id")
    .eq("file_id", fileId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    await supabase.from("media_favorites").delete().eq("file_id", fileId).eq("user_id", user.id);
  } else {
    await supabase.from("media_favorites").insert({ file_id: fileId, user_id: user.id });
  }
  revalidatePath("/admin/media");
}

/* ------------------------------- usage ----------------------------------- */
/** Register that a file is used by some entity (call from consuming modules). */
export async function registerUsage(
  fileId: string,
  usage: { module: string; entityType: string; entityId?: string | null; field?: string; label?: string }
) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured() || !fileId) return;
  const supabase = await createClient();
  await supabase.from("media_usage").upsert(
    {
      file_id: fileId,
      module: usage.module,
      entity_type: usage.entityType,
      entity_id: usage.entityId ?? null,
      field: usage.field ?? null,
      label: usage.label ?? null,
    },
    { onConflict: "file_id,module,entity_type,entity_id,field", ignoreDuplicates: true }
  );
}

export async function unregisterUsage(
  fileId: string,
  usage: { module: string; entityType: string; entityId?: string | null; field?: string }
) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured() || !fileId) return;
  const supabase = await createClient();
  let q = supabase
    .from("media_usage")
    .delete()
    .eq("file_id", fileId)
    .eq("module", usage.module)
    .eq("entity_type", usage.entityType);
  q = usage.entityId ? q.eq("entity_id", usage.entityId) : q.is("entity_id", null);
  if (usage.field) q = q.eq("field", usage.field);
  await q;
}
