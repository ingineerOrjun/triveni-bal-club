import type { Metadata } from "next";
import {
  listMemberOptions,
  listAchievementCategories,
} from "@/lib/recognition/queries";
import { createAchievement } from "@/lib/recognition/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { AchievementForm } from "@/components/recognition/achievement-form";

export const metadata: Metadata = {
  title: "New achievement",
  robots: { index: false, follow: false },
};

export default async function NewAchievementPage() {
  const [members, categories] = await Promise.all([
    listMemberOptions(),
    listAchievementCategories(),
  ]);

  return (
    <>
      <PortalPageHeader
        title="New achievement"
        description="Admins award immediately; moderators submit a recommendation."
      />
      <Card className="p-sp-4">
        <AchievementForm
          action={createAchievement}
          members={members}
          categories={categories}
        />
      </Card>
    </>
  );
}
