import type { Metadata } from "next";
import { createEvent } from "@/lib/events/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { EventForm } from "@/components/events/event-form";

export const metadata: Metadata = {
  title: "New event",
  robots: { index: false, follow: false },
};

export default function NewEventPage() {
  return (
    <>
      <PortalPageHeader
        title="New event"
        description="Events start as drafts — publish to open registration."
      />
      <Card className="p-sp-4">
        <EventForm action={createEvent} submitLabel="Create event" />
      </Card>
    </>
  );
}
