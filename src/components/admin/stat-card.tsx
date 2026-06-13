import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

/** Gradient palettes used to differentiate KPI cards at a glance. */
export type StatTone =
  | "indigo"
  | "emerald"
  | "gold"
  | "rose"
  | "sky"
  | "violet"
  | "slate";

const TONES: Record<StatTone, { from: string; to: string }> = {
  indigo: { from: "#6366f1", to: "#8b5cf6" },
  emerald: { from: "#10b981", to: "#06b6d4" },
  gold: { from: "#f59e0b", to: "#f97316" },
  rose: { from: "#f43f5e", to: "#fb7185" },
  sky: { from: "#0ea5e9", to: "#3b82f6" },
  violet: { from: "#8b5cf6", to: "#d946ef" },
  slate: { from: "#64748b", to: "#94a3b8" },
};

export interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  href?: string;
  /** Gradient identity for the icon chip + subtle wash. */
  tone?: StatTone;
  /** Back-compat: maps to a tone when `tone` isn't given. */
  accent?: "primary" | "accent";
}

export function StatCard({ icon: Icon, label, value, href, tone, accent }: StatCardProps) {
  const resolved: StatTone = tone ?? (accent === "accent" ? "gold" : "indigo");
  const { from, to } = TONES[resolved];

  const inner = (
    <Card interactive={Boolean(href)} className="relative h-full overflow-hidden">
      {/* subtle matching wash, top-right */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-pill opacity-[0.12] blur-2xl"
        style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      />
      <CardContent className="flex flex-col gap-sp-2 p-sp-3">
        <div className="flex items-start justify-between">
          <span
            className="inline-flex size-10 items-center justify-center rounded-button text-white shadow-sm"
            style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
          >
            <Icon className="size-5" />
          </span>
          {href ? <ArrowUpRight className="size-4 text-soft" /> : null}
        </div>
        <div className="min-w-0">
          <p className="font-display text-h2 font-extrabold leading-none text-ink">{value}</p>
          <p className="mt-1.5 text-caption font-medium leading-snug text-soft">{label}</p>
        </div>
      </CardContent>
    </Card>
  );

  return href ? (
    <Link href={href} className={cn("block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}>
      {inner}
    </Link>
  ) : (
    inner
  );
}
