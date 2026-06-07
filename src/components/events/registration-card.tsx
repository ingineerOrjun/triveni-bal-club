import { CalendarDays, MapPin, Users, Clock } from "lucide-react";
import type { EventWithCount } from "@/lib/events/queries";
import type { EventRegistrationRow } from "@/types/database";
import { formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RegistrationBadge } from "@/components/shared/status-badge";
import { RegisterButton } from "@/components/events/register-button";
import { registerForEvent, cancelRegistration } from "@/lib/events/actions";

export interface RegistrationCardProps {
  event: EventWithCount;
  registration: EventRegistrationRow | null;
  /** Reference time (ISO) for deadline checks — pass request time. */
  now: string;
}

export function RegistrationCard({
  event,
  registration,
  now,
}: RegistrationCardProps) {
  const isRegistered = registration?.status === "registered";
  const nowMs = new Date(now).getTime();
  const deadlinePassed = event.registration_deadline
    ? new Date(event.registration_deadline).getTime() < nowMs
    : false;
  const isFull =
    event.capacity != null && event.registeredCount >= event.capacity;
  const eventPassed = new Date(event.starts_at).getTime() < nowMs;

  const blockReason = eventPassed
    ? "This event has already taken place."
    : deadlinePassed
      ? "Registration has closed."
      : isFull
        ? "This event is full."
        : undefined;

  return (
    <Card className="flex h-full flex-col gap-sp-2 p-sp-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-h3 font-bold text-ink">{event.title}</h3>
        {registration ? (
          <RegistrationBadge status={registration.status} />
        ) : null}
      </div>

      {event.description ? (
        <p className="line-clamp-2 text-body text-soft">{event.description}</p>
      ) : null}

      <ul className="flex flex-col gap-1 text-caption text-soft">
        <li className="flex items-center gap-2">
          <CalendarDays className="size-4" /> {formatDateTime(event.starts_at)}
        </li>
        {event.venue ? (
          <li className="flex items-center gap-2">
            <MapPin className="size-4" /> {event.venue}
          </li>
        ) : null}
        <li className="flex items-center gap-2">
          <Users className="size-4" />
          {event.capacity != null
            ? `${event.registeredCount} / ${event.capacity} registered`
            : `${event.registeredCount} registered`}
        </li>
        {event.registration_deadline ? (
          <li className="flex items-center gap-2">
            <Clock className="size-4" /> Register by{" "}
            {formatDateTime(event.registration_deadline)}
          </li>
        ) : null}
      </ul>

      <div className="mt-auto pt-sp-2">
        {isRegistered ? (
          <RegisterButton
            action={cancelRegistration.bind(null, event.id)}
            label="Cancel registration"
            variant="outline"
          />
        ) : (
          <RegisterButton
            action={registerForEvent.bind(null, event.id)}
            label="Register"
            variant="primary"
            disabled={Boolean(blockReason)}
            disabledReason={blockReason}
          />
        )}
      </div>

      {!event.capacity && !registration ? (
        <Badge variant="soft" className="w-fit">
          Open registration
        </Badge>
      ) : null}
    </Card>
  );
}
