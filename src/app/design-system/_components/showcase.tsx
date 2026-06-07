import * as React from "react";
import { cn } from "@/lib/utils";

/** Page title + lead used at the top of every design-system page. */
export function DsPageHeader({
  title,
  lead,
}: {
  title: string;
  lead: string;
}) {
  return (
    <header className="mb-sp-5 border-b border-line pb-sp-3">
      <h1 className="text-h1 font-bold text-ink">{title}</h1>
      <p className="mt-sp-1 max-w-2xl text-lead text-soft">{lead}</p>
    </header>
  );
}

/** A labelled section block. */
export function DsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mb-sp-5", className)}>
      <h2 className="text-h3 font-bold text-ink">{title}</h2>
      {description ? (
        <p className="mt-1 mb-sp-3 max-w-2xl text-body text-soft">
          {description}
        </p>
      ) : (
        <div className="mb-sp-3" />
      )}
      {children}
    </section>
  );
}

/** A demo surface that frames live component examples. */
export function DsCanvas({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-sp-3 rounded-lg border border-line bg-surface p-sp-4 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

/** A single color swatch with metadata. Text auto-adapts for contrast. */
export function Swatch({
  name,
  value,
  varName,
  ink = "light",
}: {
  name: string;
  value: string;
  varName?: string;
  /** "light" => dark text on the swatch; "dark" => light text. */
  ink?: "light" | "dark";
}) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface shadow-sm">
      <div
        className="flex h-20 items-end p-2"
        style={{ backgroundColor: value }}
      >
        <span
          className={cn(
            "rounded-sm px-1.5 py-0.5 text-caption font-semibold",
            ink === "dark" ? "text-white/90" : "text-navy-900/90"
          )}
        >
          {value}
        </span>
      </div>
      <div className="p-2">
        <p className="text-caption font-semibold text-ink">{name}</p>
        {varName ? (
          <code className="text-[0.7rem] text-soft">{varName}</code>
        ) : null}
      </div>
    </div>
  );
}

/** A token spec table row. */
export function SpecRow({
  token,
  value,
  preview,
}: {
  token: string;
  value: string;
  preview?: React.ReactNode;
}) {
  return (
    <tr className="border-b border-line last:border-0">
      <td className="py-2 pr-4 align-middle">
        <code className="rounded-sm bg-background-subtle px-1.5 py-0.5 text-caption text-ink">
          {token}
        </code>
      </td>
      <td className="py-2 pr-4 align-middle text-caption text-soft">{value}</td>
      {preview !== undefined ? (
        <td className="py-2 align-middle">{preview}</td>
      ) : null}
    </tr>
  );
}
