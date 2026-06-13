import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  /** Optional secondary action / helpful links rendered beside `action`. */
  secondaryAction?: React.ReactNode;
  className?: string;
}

/**
 * Friendly, premium placeholder for empty lists / no-results states.
 * A layered "illustration" (concentric rings + soft gradient halo + icon) gives
 * every module a consistent, polished empty experience — never plain text.
 */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-sp-2 overflow-hidden rounded-xl border border-dashed border-line-strong bg-surface-2 px-sp-4 py-sp-6 text-center",
        className
      )}
    >
      {/* Decorative illustration */}
      <div aria-hidden className="relative mb-sp-1 grid place-items-center">
        <span className="absolute size-28 rounded-pill bg-gradient-emerald-cyan opacity-10 blur-2xl" />
        <span className="absolute size-24 rounded-pill border border-line" />
        <span className="absolute size-16 rounded-pill border border-line-strong" />
        <span className="relative inline-flex size-14 items-center justify-center rounded-pill bg-primary-soft text-primary-active shadow-sm">
          <Icon className="size-7" />
        </span>
      </div>
      <h3 className="text-h3 font-bold text-ink">{title}</h3>
      {description ? (
        <p className="max-w-md text-body text-soft">{description}</p>
      ) : null}
      {action || secondaryAction ? (
        <div className="mt-sp-1 flex flex-wrap items-center justify-center gap-sp-2">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
