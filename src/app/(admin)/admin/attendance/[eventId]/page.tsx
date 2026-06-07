import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getEventById,
  listRegistrationsForEvent,
  getAttendanceMap,
} from "@/lib/events/queries";
import { markAttendance } from "@/lib/events/actions";
import { formatDateTime } from "@/lib/format";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import {
  AttendanceTable,
  type AttendanceRosterEntry,
} from "@/components/attendance/attendance-table";

export const metadata: Metadata = {
  title: "Mark attendance",
  robots: { index: false, follow: false },
};

export default async function EventAttendancePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getEventById(eventId);
  if (!event) notFound();

  const [registrations, attendanceMap] = await Promise.all([
    listRegistrationsForEvent(eventId),
    getAttendanceMap(eventId),
  ]);

  const roster: AttendanceRosterEntry[] = registrations
    .filter((r) => r.status === "registered")
    .map((r) => ({
      memberId: r.member_id,
      name: r.member?.full_name ?? "Unknown",
      email: r.member?.email ?? "",
      status: attendanceMap.get(r.member_id)?.status ?? null,
    }));

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/admin/attendance">
          <ArrowLeft className="size-4" /> All events
        </Link>
      </Button>

      <PortalPageHeader
        title={`Attendance · ${event.title}`}
        description={formatDateTime(event.starts_at)}
      />

      <AttendanceTable
        roster={roster}
        action={markAttendance.bind(null, eventId)}
      />
    </>
  );
}
