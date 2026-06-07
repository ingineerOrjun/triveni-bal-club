import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { listMemberAchievements } from "@/lib/recognition/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { AchievementTimeline } from "@/components/recognition/achievement-timeline";

export const metadata: Metadata = {
  title: "My achievements",
  robots: { index: false, follow: false },
};

export default async function PortalAchievementsPage() {
  const user = await getCurrentUser();
  const achievements = user ? await listMemberAchievements(user.id) : [];

  return (
    <>
      <PortalPageHeader
        title="My achievements"
        description="Recognition you've earned across club activities and events."
      />
      <AchievementTimeline achievements={achievements} showMeta />
    </>
  );
}
