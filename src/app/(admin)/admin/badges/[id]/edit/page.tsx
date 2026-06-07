import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getBadgeById,
  listAchievementCategories,
} from "@/lib/recognition/queries";
import { updateBadge } from "@/lib/recognition/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { BadgeForm } from "@/components/recognition/badge-form";

export const metadata: Metadata = {
  title: "Edit badge",
  robots: { index: false, follow: false },
};

export default async function EditBadgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [badge, categories] = await Promise.all([
    getBadgeById(id),
    listAchievementCategories(),
  ]);
  if (!badge) notFound();

  return (
    <>
      <PortalPageHeader title="Edit badge" description={badge.name} />
      <Card className="p-sp-4">
        <BadgeForm
          action={updateBadge.bind(null, id)}
          categories={categories}
          submitLabel="Save changes"
          values={{
            name: badge.name,
            description: badge.description ?? "",
            icon: badge.icon ?? "Award",
            category_id: badge.category_id ?? "",
            criteria: badge.criteria ?? "",
            image_url: badge.image_url ?? "",
            is_active: badge.is_active,
          }}
        />
      </Card>
    </>
  );
}
