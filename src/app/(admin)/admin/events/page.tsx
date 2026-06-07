import type { Metadata } from "next";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Send,
  Archive,
  RotateCcw,
  Trash2,
  CalendarRange,
} from "lucide-react";
import { listEvents } from "@/lib/events/queries";
import { setEventStatus, deleteEvent } from "@/lib/events/actions";
import { formatDateTime } from "@/lib/format";
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

export const metadata: Metadata = {
  title: "Manage events",
  robots: { index: false, follow: false },
};

export default async function AdminEventsPage() {
  const events = await listEvents();

  return (
    <>
      <PortalPageHeader
        title="Events"
        description="Create, publish, and manage events."
        action={
          <Button asChild variant="primary">
            <Link href="/admin/events/new">
              <Plus className="size-4" /> New event
            </Link>
          </Button>
        }
      />

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="No events yet"
          description="Create your first event to open registrations."
          action={
            <Button asChild variant="primary">
              <Link href="/admin/events/new">New event</Link>
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-semibold">{e.title}</TableCell>
                <TableCell className="text-caption text-soft">
                  {formatDateTime(e.starts_at)}
                </TableCell>
                <TableCell>
                  {e.capacity != null
                    ? `${e.registeredCount} / ${e.capacity}`
                    : e.registeredCount}
                </TableCell>
                <TableCell>
                  <StatusBadge status={e.status} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/events/${e.id}/edit`}>
                        <Pencil className="size-4" /> Edit
                      </Link>
                    </Button>
                    {e.status !== "published" ? (
                      <ActionButton
                        action={setEventStatus.bind(null, e.id, "published")}
                        variant="primary"
                      >
                        <Send className="size-4" /> Publish
                      </ActionButton>
                    ) : (
                      <ActionButton
                        action={setEventStatus.bind(null, e.id, "archived")}
                        variant="outline"
                      >
                        <Archive className="size-4" /> Archive
                      </ActionButton>
                    )}
                    {e.status !== "draft" ? (
                      <ActionButton
                        action={setEventStatus.bind(null, e.id, "draft")}
                        variant="ghost"
                      >
                        <RotateCcw className="size-4" /> Draft
                      </ActionButton>
                    ) : null}
                    <ActionButton
                      action={deleteEvent.bind(null, e.id)}
                      variant="ghost"
                      confirmMessage={`Delete "${e.title}"? This cannot be undone.`}
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
