import type { Metadata } from "next";
import Link from "next/link";
import { Tags, Lightbulb } from "lucide-react";
import {
  listModeration,
  listCategories,
  listTags,
  type SuggestionFilters,
} from "@/lib/suggestions/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { SuggestionTable } from "@/components/suggestions/suggestion-table";
import { SuggestionFilters as Filters } from "@/components/suggestions/suggestion-filters";
import { SuggestionSearch } from "@/components/suggestions/suggestion-search";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const metadata: Metadata = {
  title: "Manage suggestions",
  robots: { index: false, follow: false },
};

function pageHref(sp: Record<string, string | undefined>, page: number) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v) next.set(k, v);
  next.set("page", String(page));
  return `/admin/suggestions?${next.toString()}`;
}

export default async function AdminSuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters: SuggestionFilters = {
    categoryId: sp.category,
    status: sp.status,
    priority: sp.priority,
    tagId: sp.tag,
    sort: (sp.sort as SuggestionFilters["sort"]) ?? "newest",
    q: sp.q,
    page: sp.page ? Number(sp.page) : 1,
  };

  const [{ items, total, page, pageSize }, categories, tags] = await Promise.all([
    listModeration(filters),
    listCategories(),
    listTags(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PortalPageHeader
        title="Suggestions"
        description={`${total} suggestion${total === 1 ? "" : "s"} from members.`}
        action={
          <Button asChild variant="outline">
            <Link href="/admin/suggestions/categories">
              <Tags className="size-4" /> Categories
            </Link>
          </Button>
        }
      />

      <div className="mb-sp-4 flex flex-col gap-sp-3">
        <SuggestionSearch />
        <Filters categories={categories} tags={tags} showStatus showPriority />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No suggestions match"
          description="Try clearing filters, or wait for members to share ideas."
        />
      ) : (
        <>
          <SuggestionTable items={items} />
          {totalPages > 1 ? (
            <Pagination className="mt-sp-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={pageHref(sp, Math.max(1, page - 1))}
                    aria-disabled={page <= 1}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href={pageHref(sp, page)} isActive>
                    {page}
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href={pageHref(sp, Math.min(totalPages, page + 1))}
                    aria-disabled={page >= totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </>
      )}
    </>
  );
}
