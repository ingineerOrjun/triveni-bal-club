import type { Metadata } from "next";
import { CalendarClock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listEvents, getMemberRegistrationMap } from "@/lib/events/queries";
import type { EventRegistrationRow } from "@/types/database";
import { PortalPageHeader } from "@/components/portal/page-header";
import { RegistrationCard } from "@/components/events/registration-card";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Events",
  robots: { index: false, follow: false },
};

export default async function PortalEventsPage() {
  const now = new Date().toISOString();
  const nowMs = Date.now();

  const user = await getCurrentUser();
  const events = await listEvents();
  const regMap: Map<string, EventRegistrationRow> = user
    ? await getMemberRegistrationMap(user.id)
    : new Map();

  const published = events.filter((e) => e.status === "published");
  const upcoming = published.filter(
    (e) => new Date(e.starts_at).getTime() >= nowMs
  );
  const past = published.filter(
    (e) => new Date(e.starts_at).getTime() < nowMs
  );

  return (
    <>
      <PortalPageHeader
        title="Events"
        description="Register for upcoming events and manage your registrations."
      />

      <section className="mb-sp-5">
        <h2 className="mb-sp-3 text-h2 font-bold text-ink">Upcoming</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No upcoming events"
            description="New events are scheduled throughout the year — check back soon."
          />
        ) : (
          <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <RegistrationCard
                key={event.id}
                event={event}
                registration={regMap.get(event.id) ?? null}
                now={now}
              />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 ? (
        <section>
          <h2 className="mb-sp-3 text-h2 font-bold text-ink">Past events</h2>
          <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <RegistrationCard
                key={event.id}
                event={event}
                registration={regMap.get(event.id) ?? null}
                now={now}
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
