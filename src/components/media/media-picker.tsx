"use client";

import * as React from "react";
import { Search, Loader2 } from "lucide-react";
import { listPickableFiles, type PickableFile } from "@/lib/media/picker";
import { MediaUploader } from "@/components/media/media-uploader";
import { MediaThumb } from "@/components/media/media-thumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Reusable Media Picker modal. Every module uses this instead of its own upload
 * field. Browse + search the library, or upload new files inline, then select.
 */
export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  kind = "image",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: PickableFile) => void;
  kind?: "image" | "all";
}) {
  const [q, setQ] = React.useState("");
  const [files, setFiles] = React.useState<PickableFile[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(
    async (query: string) => {
      setLoading(true);
      try {
        setFiles(await listPickableFiles(query, kind));
      } finally {
        setLoading(false);
      }
    },
    [kind]
  );

  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => load(q), 200);
    return () => clearTimeout(t);
  }, [open, q, load]);

  function choose(file: PickableFile) {
    onSelect(file);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose from Media Library</DialogTitle>
        </DialogHeader>

        <MediaUploader onUploaded={() => load(q)} />

        <div className="flex items-center gap-2 border-b border-line pb-sp-2">
          <Search className="size-4 text-soft" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the library…"
            aria-label="Search media"
            className="h-9 border-0 shadow-none focus-visible:ring-0"
          />
          {loading ? <Loader2 className="size-4 animate-spin text-soft" /> : null}
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {files.length === 0 && !loading ? (
            <p className="py-sp-4 text-center text-body text-soft">
              No files found. Upload one above to get started.
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-sp-2 sm:grid-cols-4">
              {files.map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => choose(f)}
                    className={cn(
                      "group block w-full overflow-hidden rounded-md border border-line bg-background-subtle",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                    aria-label={`Select ${f.filename}`}
                  >
                    <span className="block aspect-square">
                      <MediaThumb
                        file={f}
                        className="transition-transform duration-fast group-hover:scale-105"
                      />
                    </span>
                    <span className="block truncate p-1 text-caption text-soft">
                      {f.filename}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
