"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Archive } from "lucide-react";
import type { MediaFileRow } from "@/types/database";
import type { FormState } from "@/lib/forms";
import { bulkArchiveFiles } from "@/lib/media/actions";
import { humanSize } from "@/lib/media/storage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MediaThumb } from "@/components/media/media-thumb";
import { EmptyState } from "@/components/shared/empty-state";
import { FileImage } from "lucide-react";

export function MediaGrid({ files }: { files: MediaFileRow[] }) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [state, formAction] = useActionState<FormState, FormData>(
    bulkArchiveFiles,
    {}
  );

  React.useEffect(() => {
    setSelected((prev) => {
      const ids = new Set(files.map((f) => f.id));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [files]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (files.length === 0) {
    return (
      <EmptyState
        icon={FileImage}
        title="No files here"
        description="Upload files above, or adjust your filters."
      />
    );
  }

  return (
    <div className="flex flex-col gap-sp-3">
      {selected.size > 0 ? (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-sp-2 rounded-md border border-line bg-surface p-sp-2 shadow-md">
          <span className="text-caption font-semibold text-ink">
            {selected.size} selected
          </span>
          <form action={formAction} className="flex items-center gap-2">
            {[...selected].map((id) => (
              <input key={id} type="hidden" name="ids" value={id} />
            ))}
            <Button type="submit" size="sm" variant="outline">
              <Archive className="size-4" /> Archive
            </Button>
          </form>
          {state.message ? (
            <span role="status" className="text-caption text-emerald-700">
              {state.message}
            </span>
          ) : null}
        </div>
      ) : null}

      <ul className="grid grid-cols-2 gap-sp-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {files.map((f) => {
          const checked = selected.has(f.id);
          return (
            <li
              key={f.id}
              className={cn(
                "group relative overflow-hidden rounded-lg border bg-surface shadow-sm",
                checked ? "border-primary ring-2 ring-primary" : "border-line"
              )}
            >
              <label className="absolute left-2 top-2 z-10 flex size-6 cursor-pointer items-center justify-center rounded bg-surface/90 shadow-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(f.id)}
                  aria-label={`Select ${f.filename}`}
                  className="size-4 accent-[var(--primary)]"
                />
              </label>
              <Link href={`/admin/media/${f.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="block aspect-square">
                  <MediaThumb file={f} />
                </span>
                <span className="block p-2">
                  <span className="block truncate text-caption font-semibold text-ink">
                    {f.filename}
                  </span>
                  <span className="block text-[0.7rem] text-soft">
                    {humanSize(f.size)}
                    {f.width && f.height ? ` · ${f.width}×${f.height}` : ""}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
