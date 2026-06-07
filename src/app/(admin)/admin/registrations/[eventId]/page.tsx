import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserCheck } from "lucide-react";
import { getEventById, listRegistrationsForEvent } from "@/lib/events/queries";
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
import { RegistrationBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Event registrations",
  robots: { index: false, follow: false },
};

export default async function EventRegistrationsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getEventById(eventId);
  if (!event) notFound();

  const registrations = await listRegistrationsForEvent(eventId);
  const active = registrations.filter((r) => r.status === "registered");

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/admin/registrations">
          <ArrowLeft className="size-4" /> All events
        </Link>
      </Button>

      <PortalPageHeader
        title={event.title}
        description={`${formatDateTime(event.starts_at)} · ${active.length} registered${
          event.capacity != null ? ` / ${event.capacity}` : ""
        }`}
        action={
          <Button asChild variant="primary">
            <Link href={`/admin/attendance/${event.id}`}>
              <UserCheck className="size-4" /> Mark attendance
            </Link>
          </Button>
        }
      />

      {registrations.length === 0 ? (
        <EmptyState
          title="No registrations yet"
          description="When members register, they'll appear here."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-semibold">
                  {r.member?.full_name ?? "Unknown"}
                </TableCell>
                <TableCell className="text-soft">{r.member?.email ?? "—"}</TableCell>
                <TableCell>
                  <RegistrationBadge status={r.status} />
                </TableCell>
                <TableCell className="text-caption text-soft">
                  {formatDateTime(r.registered_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
