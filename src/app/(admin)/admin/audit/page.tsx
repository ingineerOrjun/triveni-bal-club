import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listAuditLogs, AUDIT_ENTITY_TYPES, type AuditFilters } from "@/lib/admin/audit";
import { formatDateTime } from "@/lib/format";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ScrollText } from "lucide-react";

export const metadata: Metadata = {
  title: "Audit log",
  robots: { index: false, follow: false },
};

function pageHref(sp: Record<string, string | undefined>, page: number) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v) next.set(k, v);
  next.set("page", String(page));
  return `/admin/audit?${next.toString()}`;
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin");

  const sp = await searchParams;
  const filters: AuditFilters = {
    action: sp.action,
    entity: sp.entity,
    page: sp.page ? Number(sp.page) : 1,
  };
  const { items, total, page, pageSize } = await listAuditLogs(filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <PortalPageHeader
        title="Audit log"
        description={`${total} recorded action${total === 1 ? "" : "s"}.`}
      />

      <Card className="mb-sp-4">
        <CardContent className="p-sp-3">
          <form className="flex flex-wrap items-end gap-sp-2" method="get">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="action">Action</Label>
              <Input
                id="action"
                name="action"
                defaultValue={sp.action}
                placeholder="e.g. suggestion.status"
                className="w-56"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entity">Entity</Label>
              <select
                id="entity"
                name="entity"
                defaultValue={sp.entity ?? ""}
                className="h-11 w-44 rounded-md border border-line bg-surface px-3 text-body text-ink"
              >
                <option value="">All</option>
                {AUDIT_ENTITY_TYPES.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="primary">
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit entries"
          description="Privileged actions will be recorded here."
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap text-caption text-soft">
                    {formatDateTime(a.created_at)}
                  </TableCell>
                  <TableCell>{a.actorName ?? "—"}</TableCell>
                  <TableCell>
                    <code className="text-caption text-ink">{a.action}</code>
                  </TableCell>
                  <TableCell className="text-soft">{a.entity_type}</TableCell>
                  <TableCell className="max-w-xs truncate text-caption text-soft">
                    {Object.keys(a.metadata ?? {}).length > 0
                      ? JSON.stringify(a.metadata)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

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
      )}
    </>
  );
}
