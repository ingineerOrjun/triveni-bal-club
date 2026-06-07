"use client";

import * as React from "react";
import Image from "next/image";
import type { GalleryItem, GalleryCategory } from "@/content/types";
import { GALLERY_CATEGORIES } from "@/content/gallery";
import { localize, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ImageOff } from "lucide-react";

export interface GalleryGridProps {
  items: GalleryItem[];
  locale?: Locale;
}

export function GalleryGrid({ items, locale = "en" }: GalleryGridProps) {
  const [active, setActive] = React.useState<GalleryCategory | "all">("all");
  const [selected, setSelected] = React.useState<GalleryItem | null>(null);

  const filtered =
    active === "all" ? items : items.filter((i) => i.category === active);

  return (
    <div className="flex flex-col gap-sp-4">
      {/* Category filter */}
      <div
        role="tablist"
        aria-label="Filter gallery by category"
        className="flex flex-wrap gap-2"
      >
        {GALLERY_CATEGORIES.map((cat) => {
          const isActive = active === cat.value;
          return (
            <button
              key={cat.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(cat.value)}
              className={cn(
                "rounded-pill border px-4 py-1.5 font-heading text-caption font-semibold transition-colors duration-fast",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "border-transparent bg-primary text-on-primary"
                  : "border-line bg-surface text-soft hover:border-line-strong hover:text-ink"
              )}
            >
              {localize(cat.label, locale)}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ImageOff}
          title="No photos here yet"
          description="Try a different category — more photos are added after every event."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-sp-2 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setSelected(item)}
                className="group relative block aspect-square w-full overflow-hidden rounded-md border border-line bg-background-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`View: ${localize(item.caption, locale)}`}
              >
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-base ease-out group-hover:scale-105"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-navy-900/80 to-transparent p-2 text-left text-caption font-semibold text-white opacity-0 transition-all duration-fast group-hover:translate-y-0 group-hover:opacity-100">
                  {localize(item.caption, locale)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Lightbox */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-w-3xl p-sp-2">
          {selected ? (
            <>
              <DialogTitle className="sr-only">
                {localize(selected.caption, locale)}
              </DialogTitle>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md">
                <Image
                  src={selected.image.src}
                  alt={selected.image.alt}
                  fill
                  sizes="(min-width: 768px) 768px, 100vw"
                  className="object-contain"
                />
              </div>
              <p className="px-1 pt-2 text-center text-body text-soft">
                {localize(selected.caption, locale)} · {selected.year}
              </p>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
