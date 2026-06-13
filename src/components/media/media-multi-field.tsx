"use client";

import * as React from "react";
import { ImagePlus, X, ArrowLeft, ArrowRight } from "lucide-react";
import { MediaPicker } from "@/components/media/media-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * Multi-image field backed by the Media Library. Holds an ordered list of
 * public URLs and serializes it as JSON in a hidden input (`name`). Pick several
 * images, reorder them, or remove — all without leaving the form. Modules use
 * this for galleries so every asset still flows through the single library.
 */
export function MediaMultiField({
  name,
  label,
  defaultValue = [],
  help,
  max = 30,
}: {
  name: string;
  label: string;
  defaultValue?: string[];
  help?: string;
  max?: number;
}) {
  const [urls, setUrls] = React.useState<string[]>(defaultValue);
  const [open, setOpen] = React.useState(false);

  const add = (url: string) =>
    setUrls((prev) => (url && !prev.includes(url) && prev.length < max ? [...prev, url] : prev));
  const remove = (i: number) => setUrls((prev) => prev.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) =>
    setUrls((prev) => {
      const next = i + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[next]] = [copy[next], copy[i]];
      return copy;
    });

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`${name}-btn`}>{label}</Label>
      <input type="hidden" name={name} value={JSON.stringify(urls)} />

      {urls.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {urls.map((url, i) => (
            <li key={`${url}-${i}`} className="group relative aspect-square overflow-hidden rounded-md border border-line bg-background-subtle">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="size-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-ink/70 p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <button type="button" aria-label="Move left" disabled={i === 0} onClick={() => move(i, -1)} className="inline-flex size-6 items-center justify-center rounded text-ink-inverse disabled:opacity-40">
                  <ArrowLeft className="size-3.5" />
                </button>
                <button type="button" aria-label="Remove image" onClick={() => remove(i)} className="inline-flex size-6 items-center justify-center rounded text-ink-inverse">
                  <X className="size-3.5" />
                </button>
                <button type="button" aria-label="Move right" disabled={i === urls.length - 1} onClick={() => move(i, 1)} className="inline-flex size-6 items-center justify-center rounded text-ink-inverse disabled:opacity-40">
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <Button
        id={`${name}-btn`}
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => setOpen(true)}
        disabled={urls.length >= max}
      >
        <ImagePlus className="size-4" /> Add photos{urls.length > 0 ? ` (${urls.length})` : ""}
      </Button>
      {help ? <p className="text-caption text-soft">{help}</p> : null}

      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        onSelect={(f) => add(f.public_url ?? f.thumbnail_url ?? "")}
      />
    </div>
  );
}
