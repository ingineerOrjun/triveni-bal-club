"use client";

import * as React from "react";
import type { GalleryItem, GalleryCategory } from "@/content/types";
import { GALLERY_CATEGORIES } from "@/content/gallery";
import { localize, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { ImageOff } from "lucide-react";
import { GalleryViewer } from "@/components/gallery/gallery-viewer";
import type { LightboxImage } from "@/components/gallery/lightbox";

export interface GalleryGridProps {
  items: GalleryItem[];
  locale?: Locale;
}

export function GalleryGrid({ items, locale = "en" }: GalleryGridProps) {
  const [active, setActive] = React.useState<GalleryCategory | "all">("all");

  const filtered = active === "all" ? items : items.filter((i) => i.category === active);
  const images: LightboxImage[] = filtered.map((i) => ({
    src: i.image.src,
    alt: i.image.alt,
    title: localize(i.caption, locale),
    date: String(i.year),
  }));

  return (
    <div className="flex flex-col gap-sp-4">
      {/* Category filter */}
      <div role="tablist" aria-label="Filter gallery by category" className="flex flex-wrap gap-2">
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

      {images.length === 0 ? (
        <EmptyState
          icon={ImageOff}
          title="No photos here yet"
          description="Try a different category — more photos are added after every event."
        />
      ) : (
        <GalleryViewer images={images} />
      )}
    </div>
  );
}
