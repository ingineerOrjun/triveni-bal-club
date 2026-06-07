import type { Metadata } from "next";
import Link from "next/link";
import { HardDrive, Image as ImageIcon, FileWarning, Clock } from "lucide-react";
import {
  listFiles,
  listFolders,
  getMediaAnalytics,
  type MediaFilters,
} from "@/lib/media/queries";
import { humanSize } from "@/lib/media/storage";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MediaUploader } from "@/components/media/media-uploader";
import { MediaGrid } from "@/components/media/media-grid";
import { SuggestionSearch } from "@/components/suggestions/suggestion-search";
import { StatCard } from "@/components/admin/stat-card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const metadata: Metadata = {
  title: "Media library",
  robots: { index: false, follow: false },
};

function hrefWith(sp: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) next.set(k, v);
  return `/admin/media?${next.toString()}`;
}

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters: MediaFilters = {
    folderId: sp.folder ?? null,
    q: sp.q,
    kind: sp.kind ?? "all",
    status: sp.status ?? "active",
    page: sp.page ? Number(sp.page) : 1,
  };

  const [{ items, total, page, pageSize }, folders, analytics] = await Promise.all([
    listFiles(filters),
    listFolders(),
    getMediaAnalytics(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PortalPageHeader
        title="Media library"
        description="The single source of truth for all uploaded assets."
      />

      <div className="mb-sp-4 grid grid-cols-2 gap-sp-3 lg:grid-cols-4">
        <StatCard icon={ImageIcon} label="Total assets" value={analytics.totalAssets} />
        <StatCard icon={HardDrive} label="Storage used" value={humanSize(analytics.storageBytes)} accent="accent" />
        <StatCard icon={FileWarning} label="Unused" value={analytics.unusedCount} />
        <StatCard icon={Clock} label="Recent uploads" value={analytics.recentUploads.length} />
      </div>

      <Card className="mb-sp-4">
        <CardContent className="p-sp-3">
          <MediaUploader folderId={filters.folderId ?? null} />
        </CardContent>
      </Card>

      <div className="mb-sp-4 flex flex-col gap-sp-3">
        <div className="sm:max-w-sm">
          <SuggestionSearch placeholder="Search files…" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: "All", kind: undefined },
            { label: "Images", kind: "image" },
            { label: "PDFs", kind: "pdf" },
          ].map((k) => (
            <Button
              key={k.label}
              asChild
              size="sm"
              variant={(sp.kind ?? undefined) === k.kind ? "primary" : "ghost"}
            >
              <Link href={hrefWith(sp, { kind: k.kind, page: undefined })}>{k.label}</Link>
            </Button>
          ))}
          <span aria-hidden className="mx-1 h-5 w-px bg-line" />
          <Button asChild size="sm" variant={(sp.folder ?? undefined) === undefined ? "primary" : "ghost"}>
            <Link href={hrefWith(sp, { folder: undefined, page: undefined })}>All folders</Link>
          </Button>
          <Button asChild size="sm" variant={sp.folder === "root" ? "primary" : "ghost"}>
            <Link href={hrefWith(sp, { folder: "root", page: undefined })}>Unfiled</Link>
          </Button>
          {folders.map((f) => (
            <Button key={f.id} asChild size="sm" variant={sp.folder === f.id ? "primary" : "ghost"}>
              <Link href={hrefWith(sp, { folder: f.id, page: undefined })}>{f.name}</Link>
            </Button>
          ))}
        </div>
      </div>

      <MediaGrid files={items} />

      {totalPages > 1 ? (
        <Pagination className="mt-sp-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href={hrefWith(sp, { page: String(Math.max(1, page - 1)) })} />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href={hrefWith(sp, { page: String(page) })} isActive>
                {page} / {totalPages}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href={hrefWith(sp, { page: String(Math.min(totalPages, page + 1)) })} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </>
  );
}
