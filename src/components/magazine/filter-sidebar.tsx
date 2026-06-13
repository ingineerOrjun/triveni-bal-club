import Link from "next/link";
import type { MagazineCategoryRow } from "@/types/database";
import { CategoryChip } from "./category-chip";

/** Category filter rail for the magazine index. */
export function FilterSidebar({
  categories,
  activeSlug,
}: {
  categories: MagazineCategoryRow[];
  activeSlug?: string;
}) {
  if (categories.length === 0) return null;
  return (
    <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
      <Link href="/magazine" className="rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <CategoryChip name="All stories" color="var(--accent)" active={!activeSlug} />
      </Link>
      {categories.map((c) => (
        <CategoryChip
          key={c.id}
          name={c.name}
          color={c.color}
          href={`/magazine?category=${c.slug}`}
          active={activeSlug === c.slug}
        />
      ))}
    </nav>
  );
}
