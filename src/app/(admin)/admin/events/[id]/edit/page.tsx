import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/events/queries";
import { updateEvent } from "@/lib/events/actions";
import { toDateTimeLocal } from "@/lib/format";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { EventForm } from "@/components/events/event-form";

export const metadata: Metadata = {
  title: "Edit event",
  robots: { index: false, follow: false },
};

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  return (
    <>
      <PortalPageHeader title="Edit event" description={event.title} />
      <Card className="p-sp-4">
        <EventForm
          action={updateEvent.bind(null, id)}
          submitLabel="Save changes"
          values={{
            title: event.title,
            title_ne: event.title_ne ?? "",
            description: event.description ?? "",
            venue: event.venue ?? "",
            starts_at: toDateTimeLocal(event.starts_at),
            ends_at: toDateTimeLocal(event.ends_at),
            capacity: event.capacity != null ? String(event.capacity) : "",
            registration_deadline: toDateTimeLocal(event.registration_deadline),
          }}
        />
      </Card>
    </>
  );
}
