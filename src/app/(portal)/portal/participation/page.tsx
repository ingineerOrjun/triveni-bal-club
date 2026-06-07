import type { Metadata } from "next";
import { CalendarCheck, CalendarClock, UserCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listParticipation } from "@/lib/events/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { ParticipationTimeline } from "@/components/participation/participation-timeline";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Participation",
  robots: { index: false, follow: false },
};

export default async function ParticipationPage() {
  const user = await getCurrentUser();
  const entries = user ? await listParticipation(user.id) : [];

  const registered = entries.filter(
    (e) => e.registration?.status === "registered"
  ).length;
  const attended = entries.filter(
    (e) => e.attendance?.status === "present"
  ).length;

  const stats = [
    { icon: CalendarClock, label: "Total events", value: entries.length },
    { icon: CalendarCheck, label: "Registered", value: registered },
    { icon: UserCheck, label: "Attended", value: attended },
  ];

  return (
    <>
      <PortalPageHeader
        title="My participation"
        description="Your event registrations and attendance history."
      />

      <div className="mb-sp-5 grid grid-cols-3 gap-sp-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex flex-col gap-1 p-sp-3">
                <span className="inline-flex size-10 items-center justify-center rounded-md bg-primary-soft text-primary-active">
                  <Icon className="size-5" />
                </span>
                <span className="font-display text-h2 font-extrabold text-ink">
                  {s.value}
                </span>
                <span className="text-caption text-soft">{s.label}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ParticipationTimeline entries={entries} />
    </>
  );
}
