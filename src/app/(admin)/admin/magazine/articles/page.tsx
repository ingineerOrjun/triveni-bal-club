import type { Metadata } from "next";
import Link from "next/link";
import { PenSquare, Search } from "lucide-react";
import {
  listArticles,
  listCategories,
  listEditions,
  type ArticleFilters,
} from "@/lib/magazine/queries";
import type { ArticleStatus } from "@/types/database";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArticlesTable } from "@/components/magazine/articles-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Articles", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const STATUSES: ArticleStatus[] = [
  "draft", "review", "revision_required", "approved", "scheduled", "published", "archived",
];
const PAGE_SIZE = 20;

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; category?: string; edition?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const filters: ArticleFilters = {
    status: STATUSES.includes(sp.status as ArticleStatus) ? (sp.status as ArticleStatus) : undefined,
    categoryId: sp.category || undefined,
    editionId: sp.edition || undefined,
    search: sp.q || undefined,
    page,
    pageSize: PAGE_SIZE,
  };

  const [{ rows, total }, categories, editions] = await Promise.all([
    listArticles(filters),
    listCategories(),
    listEditions(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (sp.category) params.set("category", sp.category);
    if (sp.edition) params.set("edition", sp.edition);
    if (sp.q) params.set("q", sp.q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/magazine/articles?${qs}` : "/admin/magazine/articles";
  };

  return (
    <>
      <PortalPageHeader
        title="Articles"
        description={`${total} article${total === 1 ? "" : "s"} across all statuses.`}
        action={
          <Button asChild variant="primary">
            <Link href="/admin/magazine/articles/new"><PenSquare className="size-4" /> New article</Link>
          </Button>
        }
      />

      {/* Filters */}
      <form className="mb-sp-4 flex flex-wrap items-end gap-sp-2" action="/admin/magazine/articles">
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-caption font-semibold text-soft">Status</label>
          <select id="status" name="status" defaultValue={filters.status ?? ""} className="rounded-md border border-line bg-surface px-3 py-2 text-body">
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="text-caption font-semibold text-soft">Category</label>
          <select id="category" name="category" defaultValue={sp.category ?? ""} className="rounded-md border border-line bg-surface px-3 py-2 text-body">
            <option value="">All</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="q" className="text-caption font-semibold text-soft">Search</label>
          <Input id="q" name="q" defaultValue={sp.q ?? ""} placeholder="Title or content…" />
        </div>
        <Button type="submit" variant="outline"><Search className="size-4" /> Filter</Button>
      </form>

      <ArticlesTable rows={rows} categories={categories} editions={editions} />

      {totalPages > 1 ? (
        <Pagination className="mt-sp-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href={buildHref(Math.max(1, page - 1))} aria-disabled={page <= 1} className={page <= 1 ? "pointer-events-none opacity-50" : ""} />
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 text-caption text-soft">Page {page} of {totalPages}</span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href={buildHref(Math.min(totalPages, page + 1))} aria-disabled={page >= totalPages} className={page >= totalPages ? "pointer-events-none opacity-50" : ""} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </>
  );
}
