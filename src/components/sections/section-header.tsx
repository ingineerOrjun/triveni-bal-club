import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  /** Optional action (e.g. a "View all" button) shown opposite the title. */
  action?: React.ReactNode;
  as?: "h1" | "h2";
  className?: string;
}

/** Consistent section heading: eyebrow + title + description (+ optional action). */
export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  as: Heading = "h2",
  className,
}: SectionHeaderProps) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "flex flex-col gap-sp-3 sm:flex-row sm:items-end sm:justify-between",
        centered && "sm:flex-col sm:items-center",
        className
      )}
    >
      <div
        className={cn(
          "flex max-w-2xl flex-col gap-2",
          centered && "items-center text-center"
        )}
      >
        {eyebrow ? (
          <span className="inline-flex items-center gap-2 font-heading text-caption font-bold uppercase tracking-wide text-primary-active">
            <span aria-hidden className="h-px w-6 bg-accent" />
            {eyebrow}
          </span>
        ) : null}
        <Heading
          className={cn(Heading === "h1" ? "text-h1" : "text-h2", "font-bold text-ink")}
        >
          {title}
        </Heading>
        {description ? (
          <p className="text-lead text-soft">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
