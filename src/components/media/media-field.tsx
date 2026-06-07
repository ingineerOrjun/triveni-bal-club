"use client";

import * as React from "react";
import { ImagePlus, X } from "lucide-react";
import { MediaPicker } from "@/components/media/media-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * Reusable image field backed by the Media Library. Stores the chosen file's
 * public URL in a hidden input (`name`). Modules use this instead of a raw
 * upload field, so all assets flow through the single library.
 */
export function MediaField({
  name,
  label,
  defaultValue = "",
  help,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  help?: string;
}) {
  const [url, setUrl] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`${name}-btn`}>{label}</Label>
      <input type="hidden" name={name} value={url} />

      <div className="flex items-center gap-sp-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-md border border-line bg-background-subtle">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-soft">
              <ImagePlus className="size-6" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            id={`${name}-btn`}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <ImagePlus className="size-4" /> {url ? "Change image" : "Choose from library"}
          </Button>
          {url ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setUrl("")}>
              <X className="size-4" /> Remove
            </Button>
          ) : null}
        </div>
      </div>
      {help ? <p className="text-caption text-soft">{help}</p> : null}

      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        onSelect={(f) => setUrl(f.public_url ?? f.thumbnail_url ?? "")}
      />
    </div>
  );
}
