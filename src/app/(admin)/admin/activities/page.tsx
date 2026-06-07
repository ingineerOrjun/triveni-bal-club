import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, Send, Archive, RotateCcw, Trash2 } from "lucide-react";
import { listActivities } from "@/lib/activities/queries";
import {
  setActivityStatus,
  deleteActivity,
} from "@/lib/activities/actions";
import { formatDate } from "@/lib/format";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Activity as ActivityIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Manage activities",
  robots: { index: false, follow: false },
};

export default async function AdminActivitiesPage() {
  const activities = await listActivities();

  return (
    <>
      <PortalPageHeader
        title="Activities"
        description="Create, publish, and manage club activities."
        action={
          <Button asChild variant="primary">
            <Link href="/admin/activities/new">
              <Plus className="size-4" /> New activity
            </Link>
          </Button>
        }
      />

      {activities.length === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title="No activities yet"
          description="Create your first activity to get started."
          action={
            <Button asChild variant="primary">
              <Link href="/admin/activities/new">New activity</Link>
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-semibold">{a.title}</TableCell>
                <TableCell>{a.category?.name ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={a.status} />
                </TableCell>
                <TableCell className="text-caption text-soft">
                  {formatDate(a.updated_at ?? a.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/activities/${a.id}/edit`}>
                        <Pencil className="size-4" /> Edit
                      </Link>
                    </Button>
                    {a.status !== "published" ? (
                      <ActionButton
                        action={setActivityStatus.bind(null, a.id, "published")}
                        variant="primary"
                      >
                        <Send className="size-4" /> Publish
                      </ActionButton>
                    ) : (
                      <ActionButton
                        action={setActivityStatus.bind(null, a.id, "archived")}
                        variant="outline"
                      >
                        <Archive className="size-4" /> Archive
                      </ActionButton>
                    )}
                    {a.status !== "draft" ? (
                      <ActionButton
                        action={setActivityStatus.bind(null, a.id, "draft")}
                        variant="ghost"
                      >
                        <RotateCcw className="size-4" /> Draft
                      </ActionButton>
                    ) : null}
                    <ActionButton
                      action={deleteActivity.bind(null, a.id)}
                      variant="ghost"
                      confirmMessage={`Delete "${a.title}"? This cannot be undone.`}
                    >
                      <Trash2 className="size-4 text-danger" />
                    </ActionButton>
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
