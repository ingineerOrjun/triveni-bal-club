import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface HeroSectionProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Primary/secondary actions. */
  actions?: React.ReactNode;
  /** Optional foreground image (right side on desktop). */
  image?: { src: string; alt: string };
  /** Extra content under the actions (e.g. a Nepali tagline or stats strip). */
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Premium page hero (Phase 11). An animated aurora wash + floating orbs +
 * masked grid sit behind the content. Two layouts:
 *  - with `image`: split (text + framed photo) on desktop, stacked on mobile
 *  - without `image`: centered text
 * Decorative layers are `aria-hidden` and motion-safe (orbs disabled under
 * reduced-motion via the `.animate-float*` rules).
 */
export function HeroSection({
  eyebrow,
  title,
  description,
  actions,
  image,
  footer,
  className,
}: HeroSectionProps) {
  const hasImage = Boolean(image);

  return (
    <section className={cn("relative isolate overflow-hidden", className)}>
      {/* Decorative background stack */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-aurora" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-10 -z-10 size-72 rounded-pill bg-gradient-emerald-cyan opacity-20 blur-3xl animate-float"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-24 -z-10 size-80 rounded-pill bg-gradient-brand opacity-20 blur-3xl animate-float-slow"
      />

      <div
        className={cn(
          "container-page py-sp-5",
          hasImage
            ? "grid items-center gap-sp-5 lg:grid-cols-2"
            : "mx-auto flex max-w-3xl flex-col items-center gap-sp-3 text-center"
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-sp-3 animate-slide-up",
            hasImage ? "items-start text-left" : "items-center"
          )}
        >
          {eyebrow}
          <h1 className="max-w-4xl font-display text-display font-extrabold tracking-tight text-ink">
            {title}
          </h1>
          {description ? (
            <p className={cn("max-w-2xl text-lead text-soft", !hasImage && "mx-auto")}>
              {description}
            </p>
          ) : null}
          {actions ? (
            <div className="flex flex-col gap-sp-2 sm:flex-row">{actions}</div>
          ) : null}
          {footer}
        </div>

        {image ? (
          <div className="relative animate-scale-in">
            {/* Soft glow behind the frame */}
            <div
              aria-hidden
              className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-brand opacity-15 blur-2xl"
            />
            <div className="hover-zoom relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line shadow-xl ring-1 ring-white/10">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
