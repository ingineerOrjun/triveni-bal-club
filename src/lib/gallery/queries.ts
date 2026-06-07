import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  GalleryAlbumRow,
  GalleryPhotoRow,
  MediaFileRow,
} from "@/types/database";

export type AlbumWithMeta = GalleryAlbumRow & {
  cover: MediaFileRow | null;
  photoCount: number;
};
export type AlbumPhoto = GalleryPhotoRow & { file: MediaFileRow | null };
export type AlbumDetail = GalleryAlbumRow & {
  cover: MediaFileRow | null;
  photos: AlbumPhoto[];
};

async function filesByIds(ids: string[]): Promise<Map<string, MediaFileRow>> {
  const map = new Map<string, MediaFileRow>();
  const clean = Array.from(new Set(ids.filter(Boolean)));
  if (clean.length === 0) return map;
  const supabase = await createClient();
  const { data } = await supabase.from("media_files").select("*").in("id", clean);
  for (const f of (data as MediaFileRow[] | null) ?? []) map.set(f.id, f);
  return map;
}

export async function listAlbums(publishedOnly = false): Promise<AlbumWithMeta[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let q = supabase
    .from("gallery_albums")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (publishedOnly) q = q.eq("status", "published");
  const { data } = await q;
  const albums = (data as GalleryAlbumRow[] | null) ?? [];
  if (albums.length === 0) return [];

  const covers = await filesByIds(
    albums.map((a) => a.cover_file_id).filter((x): x is string => Boolean(x))
  );

  const { data: photos } = await supabase
    .from("gallery_photos")
    .select("album_id")
    .in("album_id", albums.map((a) => a.id));
  const counts = new Map<string, number>();
  for (const p of (photos as { album_id: string }[] | null) ?? [])
    counts.set(p.album_id, (counts.get(p.album_id) ?? 0) + 1);

  return albums.map((a) => ({
    ...a,
    cover: a.cover_file_id ? covers.get(a.cover_file_id) ?? null : null,
    photoCount: counts.get(a.id) ?? 0,
  }));
}

export async function getAlbum(id: string): Promise<AlbumDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("gallery_albums").select("*").eq("id", id).maybeSingle();
  const album = data as GalleryAlbumRow | null;
  if (!album) return null;

  const { data: photoRows } = await supabase
    .from("gallery_photos")
    .select("*")
    .eq("album_id", id)
    .order("sort_order", { ascending: true });
  const photos = (photoRows as GalleryPhotoRow[] | null) ?? [];
  const files = await filesByIds([
    ...photos.map((p) => p.file_id),
    ...(album.cover_file_id ? [album.cover_file_id] : []),
  ]);

  return {
    ...album,
    cover: album.cover_file_id ? files.get(album.cover_file_id) ?? null : null,
    photos: photos.map((p) => ({ ...p, file: files.get(p.file_id) ?? null })),
  };
}

export async function getAlbumBySlug(slug: string): Promise<AlbumDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("gallery_albums").select("id").eq("slug", slug).maybeSingle();
  const row = data as { id: string } | null;
  return row ? getAlbum(row.id) : null;
}
