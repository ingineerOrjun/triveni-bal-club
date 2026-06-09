import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, Send, Archive, Copy, Trash2, FileStack, Clock, FileText } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listPages, getCmsAnalytics } from "@/lib/cms/queries";
import { publishPage, archivePage, duplicatePage, deletePage } from "@/lib/cms/actions";
import { formatDateTime } from "@/lib/format";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { ActionButton } from "@/components/shared/action-button";
import { CreatePageForm } from "@/components/cms/create-page-form";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Pages",
  robots: { index: false, follow: false },
};

export default async function AdminPagesPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin" && user?.role !== "moderator") redirect("/admin");
  const isAdmin = user?.role === "admin";

  const [pages, analytics] = await Promise.all([listPages(), getCmsAnalytics()]);

  return (
    <>
      <PortalPageHeader
        title="Pages"
        description="Build and manage website pages visually — no code required."
      />

      <div className="mb-sp-4 grid grid-cols-2 gap-sp-3 lg:grid-cols-4">
        <StatCard icon={FileStack} label="Total pages" value={analytics.total} />
        <StatCard icon={Send} label="Published" value={analytics.published} accent="accent" />
        <StatCard icon={FileText} label="Drafts" value={analytics.drafts} />
        <StatCard icon={Clock} label="Scheduled" value={analytics.scheduled} />
      </div>

      <Card className="mb-sp-4">
        <CardContent className="p-sp-3">
          <CreatePageForm />
        </CardContent>
      </Card>

      {pages.length === 0 ? (
        <EmptyState icon={FileStack} title="No pages yet" description="Create your first page above." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-semibold">
                  <Link href={`/admin/pages/${p.id}`} className="hover:text-primary-active">{p.title}</Link>
                </TableCell>
                <TableCell className="font-mono text-caption text-soft">/{p.slug}</TableCell>
                <TableCell>
                  <Badge variant={p.status === "published" ? "success" : p.status === "scheduled" ? "warning" : p.status === "archived" ? "neutral" : "soft"} className="capitalize">
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-caption text-soft">
                  {formatDateTime(p.updated_at ?? p.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/pages/${p.id}`}><Pencil className="size-4" /> Edit</Link>
                    </Button>
                    {p.status !== "published" ? (
                      <ActionButton action={publishPage.bind(null, p.id)} variant="primary"><Send className="size-4" /> Publish</ActionButton>
                    ) : (
                      <ActionButton action={archivePage.bind(null, p.id)} variant="outline"><Archive className="size-4" /> Archive</ActionButton>
                    )}
                    <ActionButton action={duplicatePage.bind(null, p.id)} variant="ghost"><Copy className="size-4" /></ActionButton>
                    {isAdmin ? (
                      <ActionButton action={deletePage.bind(null, p.id)} variant="ghost" confirmMessage={`Delete "${p.title}"?`}>
                        <Trash2 className="size-4 text-danger" />
                      </ActionButton>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
