import { cn } from "@/lib/utils";

/** Shimmering placeholder block (pairs with the `.skeleton` utility). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

/** A page-level skeleton: header bar + stat cards + content card. */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-sp-4" role="status" aria-label="Loading page">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-sp-3 lg:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-72" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** A grid of card placeholders. */
export function CardGridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: 2 | 3 | 4 }) {
  const cols = columns === 2 ? "sm:grid-cols-2" : columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={`grid gap-sp-3 ${cols}`} role="status" aria-label="Loading items">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-sp-3">
          <Skeleton className="aspect-[16/9] w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** A table placeholder (header row + body rows). */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line" role="status" aria-label="Loading table">
      <div className="flex gap-sp-3 border-b border-line bg-background-subtle px-sp-3 py-sp-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-sp-3 border-b border-line px-sp-3 py-sp-3 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** A form placeholder (labelled fields + submit). */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="flex max-w-xl flex-col gap-sp-3" role="status" aria-label="Loading form">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-32" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** A reading/content skeleton for public pages. */
export function ContentSkeleton() {
  return (
    <div className="container-page flex flex-col gap-sp-4 py-sp-5" role="status" aria-label="Loading content">
      <Skeleton className="h-10 w-3/4 max-w-xl" />
      <Skeleton className="h-5 w-1/2 max-w-md" />
      <Skeleton className="aspect-[16/9] w-full max-w-3xl" />
      <div className="flex max-w-3xl flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
