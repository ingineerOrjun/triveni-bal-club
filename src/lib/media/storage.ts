import { getSupabaseUrl } from "@/lib/supabase/env";

/** Canonical storage buckets (created in migration 0019). */
export const BUCKETS = {
  mediaPublic: "media-public",
  gallery: "gallery",
  avatars: "avatars",
  mediaPrivate: "media-private",
  certificates: "certificates",
  documents: "documents",
} as const;

export type BucketId = (typeof BUCKETS)[keyof typeof BUCKETS];

export const PUBLIC_BUCKETS: BucketId[] = [
  BUCKETS.mediaPublic,
  BUCKETS.gallery,
  BUCKETS.avatars,
];

export function isPublicBucket(bucket: string): boolean {
  return (PUBLIC_BUCKETS as string[]).includes(bucket);
}

/** CDN-friendly public URL for an object in a public bucket. */
export function buildPublicUrl(bucket: string, objectPath: string): string {
  const base = getSupabaseUrl().replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${bucket}/${objectPath}`;
}

/**
 * On-the-fly transformed (resized/optimized) thumbnail URL using Supabase's
 * image render endpoint — avoids generating & storing multiple variants.
 * Only valid for public buckets; private thumbnails require a signed URL.
 */
export function buildThumbUrl(
  bucket: string,
  objectPath: string,
  width = 400,
  height?: number
): string {
  const base = getSupabaseUrl().replace(/\/$/, "");
  const params = new URLSearchParams({ width: String(width), resize: "cover" });
  if (height) params.set("height", String(height));
  return `${base}/storage/v1/render/image/public/${bucket}/${objectPath}?${params.toString()}`;
}

export function extOf(filename: string): string {
  const m = filename.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "";
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

/** Allowed upload MIME types (defense — also enforced server-side). */
export const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "application/pdf",
];

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
