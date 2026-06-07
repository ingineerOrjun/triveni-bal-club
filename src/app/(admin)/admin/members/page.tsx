import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listMembers, type MemberFilters } from "@/lib/admin/members";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { MembersTable } from "@/components/admin/members-table";
import { SuggestionSearch } from "@/components/suggestions/suggestion-search";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const metadata: Metadata = {
  title: "Members",
  robots: { index: false, follow: false },
};

function pageHref(sp: Record<string, string | undefined>, page: number) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v) next.set(k, v);
  next.set("page", String(page));
  return `/admin/members?${next.toString()}`;
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin");

  const sp = await searchParams;
  const filters: MemberFilters = {
    q: sp.q,
    role: sp.role,
    active: sp.active,
    page: sp.page ? Number(sp.page) : 1,
  };
  const { items, total, page, pageSize } = await listMembers(filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PortalPageHeader
        title="Members"
        description={`${total} account${total === 1 ? "" : "s"}.`}
        action={
          <Button asChild variant="outline">
            <a href="/api/admin/members/export">
              <Download className="size-4" /> Export CSV
            </a>
          </Button>
        }
      />

      <div className="mb-sp-4 flex flex-col gap-sp-3 sm:flex-row sm:items-center">
        <div className="sm:max-w-sm sm:flex-1">
          <SuggestionSearch placeholder="Search name or email…" />
        </div>
        <nav className="flex flex-wrap gap-1" aria-label="Filter by role">
          {[
            { label: "All", role: undefined },
            { label: "Members", role: "member" },
            { label: "Moderators", role: "moderator" },
            { label: "Admins", role: "admin" },
          ].map((f) => {
            const active = (sp.role ?? undefined) === f.role;
            const params = new URLSearchParams();
            if (sp.q) params.set("q", sp.q);
            if (f.role) params.set("role", f.role);
            return (
              <Button
                key={f.label}
                asChild
                size="sm"
                variant={active ? "primary" : "ghost"}
              >
                <Link href={`/admin/members?${params.toString()}`}>{f.label}</Link>
              </Button>
            );
          })}
        </nav>
      </div>

      <MembersTable rows={items} />

      {totalPages > 1 ? (
        <Pagination className="mt-sp-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href={pageHref(sp, Math.max(1, page - 1))} />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href={pageHref(sp, page)} isActive>
                {page} / {totalPages}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href={pageHref(sp, Math.min(totalPages, page + 1))} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </>
  );
}
