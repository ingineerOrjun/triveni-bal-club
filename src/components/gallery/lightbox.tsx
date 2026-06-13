"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LightboxImage {
  src: string;
  alt?: string;
  title?: string;
  description?: string;
  credit?: string;
  date?: string;
}

/**
 * Premium fullscreen lightbox (Midnight Prestige). Keyboard + swipe + drag
 * navigation, double-click / wheel zoom + pan, gradient caption, image counter,
 * glass controls, thumbnail filmstrip. Dependency-free; adjacent images
 * preloaded; body scroll locked; focus trapped; motion respects user prefs.
 */
export function Lightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  const [scale, setScale] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const touch = React.useRef<{ x: number; y: number } | null>(null);
  const drag = React.useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const open = index !== null;
  const count = images.length;

  React.useEffect(() => setMounted(true), []);

  const resetView = React.useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const go = React.useCallback(
    (dir: number) => {
      if (index === null || count === 0) return;
      resetView();
      onNavigate((index + dir + count) % count);
    },
    [index, count, onNavigate, resetView]
  );

  // Keyboard, scroll-lock, initial focus, focus trap.
  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const root = dialogRef.current;
    root?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key === "ArrowRight") return go(1);
      if (e.key === "ArrowLeft") return go(-1);
      if (e.key === "Tab" && root) {
        const f = root.querySelectorAll<HTMLElement>('button,[href],[tabindex]:not([tabindex="-1"])');
        if (f.length === 0) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, go]);

  // Preload adjacent images.
  React.useEffect(() => {
    if (index === null) return;
    [1, -1].forEach((d) => {
      const img = images[(index + d + count) % count];
      if (img) {
        const pre = new window.Image();
        pre.src = img.src;
      }
    });
  }, [index, images, count]);

  if (!mounted || index === null) return null;
  const current = images[index];
  if (!current) return null;
  const zoomed = scale > 1;
  const hasCaption = current.title || current.description || current.credit || current.date;
  const prevImg = count > 1 ? images[(index - 1 + count) % count] : null;
  const nextImg = count > 1 ? images[(index + 1) % count] : null;

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (zoomed) drag.current = { x: t.clientX, y: t.clientY, ox: offset.x, oy: offset.y };
    else touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (zoomed && drag.current) {
      setOffset({ x: drag.current.ox + (t.clientX - drag.current.x), y: drag.current.oy + (t.clientY - drag.current.y) });
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (zoomed) { drag.current = null; return; }
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  const onWheel = (e: React.WheelEvent) => {
    const next = Math.min(4, Math.max(1, scale - e.deltaY * 0.0025));
    setScale(next);
    if (next === 1) setOffset({ x: 0, y: 0 });
  };
  const onDouble = () => (zoomed ? resetView() : setScale(2));
  const onMouseDown = (e: React.MouseEvent) => {
    if (!zoomed) return;
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!zoomed || !drag.current) return;
    setOffset({ x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) });
  };
  const stopDrag = () => { drag.current = null; };

  const glassBtn =
    "inline-flex items-center justify-center rounded-pill border text-[#F4F4F6] backdrop-blur transition-transform duration-fast hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60";
  const glassStyle = { background: "rgba(255,255,255,0.08)", borderColor: "rgba(229,229,229,0.18)" } as React.CSSProperties;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${index + 1} of ${count}${current.title ? `: ${current.title}` : ""}`}
      tabIndex={-1}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col animate-fade-in"
      style={{ background: "rgba(11,19,43,0.92)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
    >
      {/* Top bar — counter + controls */}
      <div className="flex shrink-0 items-center justify-between gap-2 p-4">
        <span
          className="rounded-pill border px-3 py-1 text-caption font-semibold uppercase tracking-[0.18em] text-[#F4F4F6] backdrop-blur"
          style={glassStyle}
        >
          {index + 1} / {count}
        </span>
        <div className="flex items-center gap-2">
          {zoomed ? (
            <button onClick={(e) => { e.stopPropagation(); resetView(); }} aria-label="Reset zoom" className={cn(glassBtn, "size-11")} style={glassStyle}>
              <RotateCcw className="size-5" />
            </button>
          ) : null}
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close" className={cn(glassBtn, "size-11")} style={glassStyle}>
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Stage — image always centered in the available space */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
        {/* Side peek previews (large screens) — see prev/next at a glance */}
        {count > 1 && prevImg ? (
          <button
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            aria-hidden
            tabIndex={-1}
            className="absolute left-0 top-1/2 hidden h-[58vh] w-[15vw] -translate-y-1/2 overflow-hidden rounded-r-2xl opacity-25 blur-[1px] transition-opacity duration-base hover:opacity-50 lg:block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={prevImg.src} alt="" className="size-full object-cover" />
          </button>
        ) : null}
        {count > 1 && nextImg ? (
          <button
            onClick={(e) => { e.stopPropagation(); go(1); }}
            aria-hidden
            tabIndex={-1}
            className="absolute right-0 top-1/2 hidden h-[58vh] w-[15vw] -translate-y-1/2 overflow-hidden rounded-l-2xl opacity-25 blur-[1px] transition-opacity duration-base hover:opacity-50 lg:block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={nextImg.src} alt="" className="size-full object-cover" />
          </button>
        ) : null}

        {/* Prev / Next buttons */}
        {count > 1 ? (
          <>
            <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous image" className={cn(glassBtn, "absolute left-2 top-1/2 z-10 size-12 -translate-y-1/2 sm:left-4 sm:size-14")} style={glassStyle}>
              <ChevronLeft className="size-6" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next image" className={cn(glassBtn, "absolute right-2 top-1/2 z-10 size-12 -translate-y-1/2 sm:right-4 sm:size-14")} style={glassStyle}>
              <ChevronRight className="size-6" />
            </button>
          </>
        ) : null}

        {/* Image + caption */}
        <figure className="relative z-[1] flex max-h-full max-w-[90vw] items-center justify-center lg:max-w-[64vw]" onClick={(e) => e.stopPropagation()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={index}
            src={current.src}
            alt={current.alt ?? current.title ?? ""}
            draggable={false}
            onDoubleClick={onDouble}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className={cn("max-h-full max-w-full select-none rounded-lg object-contain shadow-2xl animate-scale-in", zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in")}
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transition: drag.current ? "none" : "transform 0.2s cubic-bezier(.22,.61,.36,1)" }}
          />
          {hasCaption ? (
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-lg bg-gradient-to-t from-black/85 via-black/40 to-transparent px-6 pb-6 pt-16 sm:px-8">
              {current.title ? <p className="text-[18px] font-semibold text-[#F4F4F6]">{current.title}</p> : null}
              {current.description ? <p className="mt-0.5 text-[14px] leading-snug text-[#C9CCD3]">{current.description}</p> : null}
              {current.credit || current.date ? (
                <p className="mt-1.5 text-caption text-[#C9CCD3]/80">{[current.credit, current.date].filter(Boolean).join(" · ")}</p>
              ) : null}
            </figcaption>
          ) : null}
        </figure>
      </div>
    </div>,
    document.body
  );
}
