"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { recordUpload } from "@/lib/media/actions";
import {
  ALLOWED_MIME,
  MAX_UPLOAD_BYTES,
  humanSize,
  isImageMime,
} from "@/lib/media/storage";
import { cn } from "@/lib/utils";

type ItemState = "uploading" | "done" | "duplicate" | "error";
interface UploadItem {
  name: string;
  size: number;
  state: ItemState;
  message?: string;
}

async function sha256(file: File): Promise<string | null> {
  try {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

function imageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!isImageMime(file.type)) return resolve(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export function MediaUploader({
  bucket = "media-public",
  folderId = null,
  onUploaded,
}: {
  bucket?: string;
  folderId?: string | null;
  onUploaded?: (fileId: string) => void;
}) {
  const router = useRouter();
  const [dragging, setDragging] = React.useState(false);
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function uploadOne(file: File, index: number) {
    const update = (patch: Partial<UploadItem>) =>
      setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));

    if (!ALLOWED_MIME.includes(file.type)) {
      return update({ state: "error", message: "Type not allowed" });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return update({ state: "error", message: "Too large (max 15 MB)" });
    }

    const supabase = createClient();
    const [checksum, dims] = await Promise.all([sha256(file), imageDimensions(file)]);
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const objectPath = `${folderId ?? "uploads"}/${crypto.randomUUID()}-${safeName}`;

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(objectPath, file, { contentType: file.type, upsert: false });
    if (upErr) return update({ state: "error", message: upErr.message });

    const res = await recordUpload({
      bucket,
      objectPath,
      filename: safeName,
      originalFilename: file.name,
      mimeType: file.type,
      size: file.size,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      checksum,
      folderId,
    });
    if (!res.ok) return update({ state: "error", message: res.error });
    if (res.duplicate) return update({ state: "duplicate", message: "Already in library" });
    if (res.fileId) onUploaded?.(res.fileId);
    update({ state: "done" });
  }

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    const start = items.length;
    setItems((prev) => [
      ...prev,
      ...list.map((f) => ({ name: f.name, size: f.size, state: "uploading" as ItemState })),
    ]);
    await Promise.all(list.map((f, i) => uploadOne(f, start + i)));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-sp-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-sp-4 text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragging ? "border-primary bg-primary-soft" : "border-line-strong bg-surface-2 hover:border-primary"
        )}
        aria-label="Upload files — drag and drop or click to choose"
      >
        <UploadCloud className="size-8 text-primary-active" />
        <p className="font-heading font-semibold text-ink">
          Drag &amp; drop files, or click to browse
        </p>
        <p className="text-caption text-soft">
          Images &amp; PDF · up to {humanSize(MAX_UPLOAD_BYTES)}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_MIME.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {items.map((it, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 py-1.5 text-caption">
              <span className="min-w-0 flex-1 truncate text-ink">{it.name}</span>
              <span className="text-soft">{humanSize(it.size)}</span>
              {it.state === "uploading" ? (
                <Loader2 className="size-4 animate-spin text-soft" />
              ) : it.state === "done" ? (
                <CheckCircle2 className="size-4 text-emerald-700" />
              ) : it.state === "duplicate" ? (
                <span className="text-gold-700">{it.message}</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-danger">
                  <AlertCircle className="size-4" /> {it.message}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
