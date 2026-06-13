import * as React from "react";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

export interface PageHeaderStat {
  label: string;
  value: React.ReactNode;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Breadcrumb trail; the last item renders as the current page. */
  breadcrumbs?: Crumb[];
  /** Optional back link (rendered above the title). */
  backHref?: string;
  backLabel?: string;
  /** Right-aligned actions (buttons). */
  actions?: React.ReactNode;
  /** Inline badge/status beside the title. */
  badge?: React.ReactNode;
  /** Optional stat strip rendered under the header. */
  stats?: PageHeaderStat[];
  className?: string;
}

/**
 * The single page header used across public / portal / admin (Phase 14, PART 2).
 * Composes breadcrumb + back + title + subtitle + badge + actions + stat strip,
 * all on the 8px spacing system. Supersedes ad-hoc per-page headers.
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  backHref,
  backLabel = "Back",
  actions,
  badge,
  stats,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-sp-4 flex flex-col gap-sp-2", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-caption text-soft">
            {breadcrumbs.map((c, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <li key={`${c.label}-${i}`} className="flex items-center gap-1">
                  {c.href && !last ? (
                    <Link href={c.href} className="rounded-sm hover:text-ink focus-visible:outline-none focus-visible:underline">
                      {c.label}
                    </Link>
                  ) : (
                    <span className={cn(last && "font-semibold text-ink")} aria-current={last ? "page" : undefined}>
                      {c.label}
                    </span>
                  )}
                  {!last ? <ChevronRight className="size-3.5 text-line-strong" aria-hidden /> : null}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1 text-caption font-semibold text-soft hover:text-ink focus-visible:outline-none focus-visible:underline"
        >
          <ArrowLeft className="size-4" /> {backLabel}
        </Link>
      ) : null}

      <div className="flex flex-col gap-sp-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-h1 font-bold text-ink">{title}</h1>
            {badge}
          </div>
          {subtitle ? <p className="text-lead text-soft">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {stats && stats.length > 0 ? (
        <dl className="mt-sp-2 grid grid-cols-2 gap-sp-2 sm:flex sm:flex-wrap sm:gap-sp-4">
          {stats.map((s, i) => (
            <div key={`${s.label}-${i}`} className="flex flex-col">
              <dt className="os-eyebrow text-soft">{s.label}</dt>
              <dd className="font-display text-h3 font-extrabold text-ink">{s.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
