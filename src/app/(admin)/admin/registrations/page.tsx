import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, ArrowRight } from "lucide-react";
import { listEvents } from "@/lib/events/queries";
import { formatDateTime } from "@/lib/format";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Registrations",
  robots: { index: false, follow: false },
};

export default async function RegistrationsIndexPage() {
  const events = await listEvents();

  return (
    <>
      <PortalPageHeader
        title="Registrations"
        description="Choose an event to view its registered members."
      />
      {events.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No events yet"
          description="Create an event to start collecting registrations."
        />
      ) : (
        <div className="flex flex-col gap-sp-2">
          {events.map((e) => (
            <Link key={e.id} href={`/admin/registrations/${e.id}`} className="group">
              <Card interactive>
                <CardContent className="flex items-center justify-between gap-sp-3 p-sp-3">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-h3 font-bold text-ink">
                      {e.title}
                    </p>
                    <p className="text-caption text-soft">
                      {formatDateTime(e.starts_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-sp-3">
                    <StatusBadge status={e.status} />
                    <span className="font-heading font-bold text-ink">
                      {e.capacity != null
                        ? `${e.registeredCount}/${e.capacity}`
                        : e.registeredCount}
                    </span>
                    <ArrowRight className="size-5 text-primary-active transition-transform duration-fast group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
