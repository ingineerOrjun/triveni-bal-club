import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CTASectionProps {
  title: string;
  description?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}

/** Dark, high-contrast call-to-action banner. */
export function CTASection({
  title,
  description,
  primary,
  secondary,
}: CTASectionProps) {
  return (
    <section className="container-page py-sp-5">
      <div className="flex flex-col items-center gap-sp-3 rounded-xl bg-ink px-sp-4 py-sp-5 text-center shadow-lg">
        <h2 className="max-w-2xl text-h2 font-bold text-ink-inverse">{title}</h2>
        {description ? (
          <p className="max-w-xl text-lead text-slate-300">{description}</p>
        ) : null}
        {(primary || secondary) && (
          <div className="mt-sp-1 flex flex-col gap-sp-2 sm:flex-row">
            {primary ? (
              <Button asChild size="lg" variant="accent">
                <Link href={primary.href}>
                  {primary.label} <ArrowRight className="size-5" />
                </Link>
              </Button>
            ) : null}
            {secondary ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-navy-600 bg-transparent text-ink-inverse hover:bg-navy-700"
              >
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
