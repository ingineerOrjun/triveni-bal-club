import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}

/** Friendly placeholder for empty lists / no-results states. */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-sp-2 rounded-lg border border-dashed border-line-strong bg-surface-2 px-sp-4 py-sp-6 text-center",
        className
      )}
    >
      <span className="inline-flex size-14 items-center justify-center rounded-pill bg-primary-soft text-primary-active">
        <Icon className="size-7" />
      </span>
      <h3 className="text-h3 font-bold text-ink">{title}</h3>
      {description ? (
        <p className="max-w-md text-body text-soft">{description}</p>
      ) : null}
      {action ? <div className="mt-sp-1">{action}</div> : null}
    </div>
  );
}
