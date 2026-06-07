import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listCategories, getActivityById } from "@/lib/activities/queries";
import { updateActivity } from "@/lib/activities/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { ActivityForm } from "@/components/activities/activity-form";

export const metadata: Metadata = {
  title: "Edit activity",
  robots: { index: false, follow: false },
};

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [activity, categories] = await Promise.all([
    getActivityById(id),
    listCategories(),
  ]);
  if (!activity) notFound();

  return (
    <>
      <PortalPageHeader
        title="Edit activity"
        description={activity.title}
      />
      <Card className="p-sp-4">
        <ActivityForm
          action={updateActivity.bind(null, id)}
          categories={categories}
          submitLabel="Save changes"
          values={{
            title: activity.title,
            title_ne: activity.title_ne ?? "",
            description: activity.description ?? "",
            category_id: activity.category_id ?? "",
            cover_url: activity.cover_url ?? "",
            starts_on: activity.starts_on ?? "",
            ends_on: activity.ends_on ?? "",
          }}
        />
      </Card>
    </>
  );
}
