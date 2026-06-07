"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireStaffUser } from "@/lib/auth/guards";
import type { MediaFileRow } from "@/types/database";

export interface PickableFile {
  id: string;
  filename: string;
  mime_type: string;
  thumbnail_url: string | null;
  public_url: string | null;
  alt_text: string | null;
  width: number | null;
  height: number | null;
}

/** Search active library files for the Media Picker (staff only). */
export async function listPickableFiles(
  q: string,
  kind: "image" | "all" = "image"
): Promise<PickableFile[]> {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return [];

  const supabase = await createClient();
  let query = supabase
    .from("media_files")
    .select("id, filename, mime_type, thumbnail_url, public_url, alt_text, width, height")
    .eq("status", "active");
  if (kind === "image") query = query.ilike("mime_type", "image/%");
  if (q.trim())
    query = query.or(`filename.ilike.%${q}%,alt_text.ilike.%${q}%,caption.ilike.%${q}%`);

  const { data } = await query.order("created_at", { ascending: false }).limit(40);
  return ((data as Pick<
    MediaFileRow,
    "id" | "filename" | "mime_type" | "thumbnail_url" | "public_url" | "alt_text" | "width" | "height"
  >[] | null) ?? []) as PickableFile[];
}
