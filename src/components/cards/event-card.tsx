import Image from "next/image";
import { MapPin, Clock } from "lucide-react";
import type { ClubEvent } from "@/content/types";
import { localize, type Locale } from "@/lib/i18n";
import { dateParts, formatTime } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface EventCardProps {
  event: ClubEvent;
  locale?: Locale;
  past?: boolean;
}

export function EventCard({ event, locale = "en", past = false }: EventCardProps) {
  const title = localize(event.title, locale);
  const description = localize(event.description, locale);
  const location = localize(event.location, locale);
  const { day, month } = dateParts(event.startsAt);

  return (
    <Card className="flex h-full gap-sp-3 overflow-hidden p-sp-3">
      {/* Date chip + thumbnail */}
      <div className="flex flex-col items-center gap-sp-2">
        <div
          className="flex size-16 shrink-0 flex-col items-center justify-center rounded-md bg-primary text-on-primary"
          aria-hidden
        >
          <span className="font-display text-h3 font-extrabold leading-none">
            {day}
          </span>
          <span className="text-caption font-semibold">{month}</span>
        </div>
        <div className="relative size-16 overflow-hidden rounded-md border border-line">
          <Image
            src={event.image.src}
            alt={event.image.alt}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {past ? (
            <Badge variant="neutral">Past</Badge>
          ) : (
            <Badge variant="success">Upcoming</Badge>
          )}
          {event.registrationRequired ? (
            <Badge variant="warning">Registration</Badge>
          ) : null}
        </div>
        <h3 className="font-heading text-h3 font-bold text-ink">{title}</h3>
        <p className="line-clamp-2 text-body text-soft">{description}</p>
        <div className="mt-auto flex flex-wrap gap-x-sp-3 gap-y-1 pt-sp-1 text-caption text-soft">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" /> {formatTime(event.startsAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" /> {location}
          </span>
        </div>
      </div>
    </Card>
  );
}
