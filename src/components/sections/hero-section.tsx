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
  /** Extra content under the actions (e.g. a Nepali tagline). */
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Page hero. Two layouts:
 *  - with `image`: split (text + image) on desktop, stacked on mobile
 *  - without `image`: centered text with a soft brand wash
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
    <section className={cn("relative overflow-hidden", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,var(--emerald-100)_0%,transparent_70%)]"
      />
      <div
        className={cn(
          "container-page py-sp-6",
          hasImage
            ? "grid items-center gap-sp-5 lg:grid-cols-2"
            : "flex flex-col items-center gap-sp-4 text-center"
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-sp-3",
            hasImage ? "items-start text-left" : "items-center"
          )}
        >
          {eyebrow}
          <h1 className="max-w-4xl text-display font-extrabold text-ink">
            {title}
          </h1>
          {description ? (
            <p
              className={cn(
                "max-w-2xl text-lead text-soft",
                !hasImage && "mx-auto"
              )}
            >
              {description}
            </p>
          ) : null}
          {actions ? (
            <div className="flex flex-col gap-sp-2 sm:flex-row">{actions}</div>
          ) : null}
          {footer}
        </div>

        {image ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-line shadow-lg">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
