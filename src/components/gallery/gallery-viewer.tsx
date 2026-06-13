"use client";

import * as React from "react";
import Image from "next/image";
import { Eye } from "lucide-react";
import { Lightbox, type LightboxImage } from "./lightbox";

/**
 * Premium gallery grid + fullscreen lightbox. Pass an ordered image list; the
 * grid is responsive (2→4 cols) with rounded tiles, hover zoom and a "View"
 * overlay, and clicking opens the immersive viewer.
 */
export function GalleryViewer({
  images,
  columns = 4,
}: {
  images: LightboxImage[];
  columns?: 3 | 4;
}) {
  const [index, setIndex] = React.useState<number | null>(null);
  const cols = columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-3 lg:grid-cols-4";

  return (
    <>
      <ul className={`grid grid-cols-2 gap-sp-2 ${cols}`}>
        {images.map((img, i) => (
          <li key={`${img.src}-${i}`}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={img.title ? `View: ${img.title}` : `View image ${i + 1}`}
              className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-xl border border-line bg-background-subtle shadow-sm transition-shadow duration-snappy hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Image
                src={img.src}
                alt={img.alt ?? img.title ?? ""}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                loading={i < 4 ? "eager" : "lazy"}
                className="object-cover transition-transform duration-base ease-out group-hover:scale-105"
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-t from-navy-900/70 via-navy-900/10 to-transparent opacity-0 transition-opacity duration-snappy group-hover:opacity-100">
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-white/20 bg-white/15 px-3 py-1.5 text-caption font-semibold text-white backdrop-blur">
                  <Eye className="size-4" /> View
                </span>
              </span>
              {img.title ? (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1 bg-gradient-to-t from-navy-900/85 to-transparent p-3 text-left text-caption font-semibold text-white opacity-0 transition-all duration-snappy group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="line-clamp-2">{img.title}</span>
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <Lightbox images={images} index={index} onClose={() => setIndex(null)} onNavigate={setIndex} />
    </>
  );
}
