import * as React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

/** Magazine masthead hero, optionally backed by the latest edition cover. */
export function MagazineHero({
  title,
  description,
  eyebrow,
  cover,
  children,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  cover?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-line bg-ink text-white">
      {cover ? (
        <>
          <Image src={cover} alt="" fill sizes="100vw" className="object-cover opacity-25" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/50" aria-hidden />
        </>
      ) : (
        // Subtle aurora glow so an empty masthead still feels designed, not blank.
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(48% 80% at 12% 0%, rgb(37 99 235 / 0.28) 0%, transparent 60%), radial-gradient(42% 70% at 92% 15%, rgb(16 185 129 / 0.20) 0%, transparent 55%), radial-gradient(50% 70% at 70% 110%, rgb(124 58 237 / 0.16) 0%, transparent 60%)",
          }}
        />
      )}

      <div className="container-page relative flex flex-col items-start gap-sp-2 py-sp-5">
        {eyebrow ? <Badge variant="accent">{eyebrow}</Badge> : null}
        <h1 className="max-w-3xl font-display text-h1 font-extrabold leading-[1.08] tracking-tight text-white">
          {title}
        </h1>
        {description ? (
          <p className="max-w-xl text-lead leading-snug text-slate-300">{description}</p>
        ) : null}
        {children ? <div className="mt-sp-2 w-full">{children}</div> : null}
      </div>
    </section>
  );
}
