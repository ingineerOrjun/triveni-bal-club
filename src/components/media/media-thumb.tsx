import { FileText, FileImage } from "lucide-react";
import type { MediaFileRow } from "@/types/database";
import { isImageMime } from "@/lib/media/storage";
import { cn } from "@/lib/utils";

/** Presentational thumbnail for a media file (image preview or type icon). */
export function MediaThumb({
  file,
  className,
}: {
  file: Pick<MediaFileRow, "mime_type" | "thumbnail_url" | "public_url" | "alt_text" | "filename">;
  className?: string;
}) {
  const src = file.thumbnail_url ?? file.public_url ?? null;
  if (isImageMime(file.mime_type) && src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={file.alt_text ?? file.filename}
        loading="lazy"
        className={cn("size-full object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex size-full items-center justify-center bg-background-subtle text-soft",
        className
      )}
      aria-label={file.filename}
    >
      {file.mime_type === "application/pdf" ? (
        <FileText className="size-8" />
      ) : (
        <FileImage className="size-8" />
      )}
    </div>
  );
}
