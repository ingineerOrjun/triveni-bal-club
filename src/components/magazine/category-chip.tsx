import Link from "next/link";
import { cn } from "@/lib/utils";

export interface CategoryChipProps {
  name: string;
  color?: string | null;
  href?: string;
  active?: boolean;
  className?: string;
}

/** Small category pill with an optional color dot. Links when `href` is set. */
export function CategoryChip({ name, color, href, active, className }: CategoryChipProps) {
  const inner = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-3 py-0.5 text-caption font-heading font-semibold transition-colors",
        active
          ? "border-transparent bg-primary text-on-primary"
          : "border-line bg-background-subtle text-soft hover:text-ink",
        className
      )}
    >
      <span
        aria-hidden
        className="size-2 rounded-pill"
        style={{ backgroundColor: color || "var(--primary)" }}
      />
      {name}
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} className="rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {inner}
    </Link>
  );
}
