import type { Metadata } from "next";
import { Activity as ActivityIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listActivities, getJoinedActivityIds } from "@/lib/activities/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { ActivityItem } from "@/components/activities/activity-item";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Activities",
  robots: { index: false, follow: false },
};

export default async function PortalActivitiesPage() {
  const user = await getCurrentUser();
  const [activities, joined] = await Promise.all([
    listActivities(),
    user ? getJoinedActivityIds(user.id) : Promise.resolve(new Set<string>()),
  ]);
  const published = activities.filter((a) => a.status === "published");

  return (
    <>
      <PortalPageHeader
        title="Activities"
        description="Browse club activities and join the ones that interest you."
      />
      {published.length === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title="No activities yet"
          description="New activities open every term. Check back soon!"
        />
      ) : (
        <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
          {published.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              joined={joined.has(activity.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
