import type { Metadata } from "next";
import { listAchievementCategories } from "@/lib/recognition/queries";
import { createBadge } from "@/lib/recognition/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { BadgeForm } from "@/components/recognition/badge-form";

export const metadata: Metadata = {
  title: "New badge",
  robots: { index: false, follow: false },
};

export default async function NewBadgePage() {
  const categories = await listAchievementCategories();
  return (
    <>
      <PortalPageHeader
        title="New badge"
        description="Define a badge members can earn or be awarded."
      />
      <Card className="p-sp-4">
        <BadgeForm action={createBadge} categories={categories} submitLabel="Create badge" />
      </Card>
    </>
  );
}
