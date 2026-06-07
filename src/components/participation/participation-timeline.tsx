import { CalendarDays, MapPin } from "lucide-react";
import type { ParticipationEntry } from "@/lib/events/queries";
import { formatDateTime } from "@/lib/format";
import {
  RegistrationBadge,
  AttendanceBadge,
} from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarClock } from "lucide-react";

/** Vertical timeline of a member's event registrations & attendance. */
export function ParticipationTimeline({
  entries,
}: {
  entries: ParticipationEntry[];
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No participation yet"
        description="Register for events and your history — and attendance — will appear here."
      />
    );
  }

  return (
    <ol className="relative ml-3 border-l-2 border-line">
      {entries.map(({ event, registration, attendance }) => (
        <li key={event.id} className="mb-sp-4 ml-sp-3 last:mb-0">
          <span
            aria-hidden
            className="absolute -left-[9px] flex size-4 items-center justify-center rounded-pill bg-primary ring-4 ring-background"
          />
          <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-sp-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-h3 font-bold text-ink">
                {event.title}
              </h3>
              {registration ? (
                <RegistrationBadge status={registration.status} />
              ) : null}
              {attendance ? <AttendanceBadge status={attendance.status} /> : null}
            </div>
            <p className="flex items-center gap-2 text-caption text-soft">
              <CalendarDays className="size-4" /> {formatDateTime(event.starts_at)}
            </p>
            {event.venue ? (
              <p className="flex items-center gap-2 text-caption text-soft">
                <MapPin className="size-4" /> {event.venue}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
