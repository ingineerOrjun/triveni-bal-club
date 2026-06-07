import { CalendarClock, History } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { localize } from "@/lib/i18n";
import { SITE } from "@/content/site";
import { splitEvents, REFERENCE_NOW } from "@/content/events";
import { Badge } from "@/components/ui/badge";
import { HeroSection } from "@/components/sections/hero-section";
import { SectionHeader } from "@/components/sections/section-header";
import { EventCard } from "@/components/cards/event-card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  JsonLd,
  breadcrumbJsonLd,
  eventJsonLd,
} from "@/components/seo/json-ld";

export const metadata = createMetadata({
  title: "Events",
  description: `Upcoming and past events of the ${SITE.name} — meetings, elections, fairs, and celebrations.`,
  path: "/events",
});

export default function EventsPage() {
  const { upcoming, past } = splitEvents(REFERENCE_NOW);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Events", path: "/events" },
        ])}
      />
      {upcoming.map((e) => (
        <JsonLd
          key={e.slug}
          data={eventJsonLd({
            name: localize(e.title),
            description: localize(e.description),
            startDate: e.startsAt,
            endDate: e.endsAt,
            location: localize(e.location),
          })}
        />
      ))}

      <HeroSection
        eyebrow={<Badge variant="soft">What&apos;s happening</Badge>}
        title="Events"
        description="From the annual general meeting to club elections — here's what's coming up and what we've done."
      />

      {/* Upcoming */}
      <section className="container-page py-sp-5">
        <SectionHeader
          eyebrow="Don't miss out"
          title="Upcoming events"
          className="mb-sp-4"
        />
        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No upcoming events"
            description="Check back soon — new events are scheduled throughout the year."
          />
        ) : (
          <div className="grid gap-sp-3 lg:grid-cols-2">
            {upcoming.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      <section className="bg-background-subtle py-sp-5">
        <div className="container-page flex flex-col gap-sp-4">
          <SectionHeader eyebrow="Looking back" title="Past events" />
          {past.length === 0 ? (
            <EmptyState
              icon={History}
              title="No past events yet"
              description="Our event history will appear here over time."
            />
          ) : (
            <div className="grid gap-sp-3 lg:grid-cols-2">
              {past.map((event) => (
                <EventCard key={event.slug} event={event} past />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
