import type { Metadata } from "next";
import { listCategories } from "@/lib/activities/queries";
import { createActivity } from "@/lib/activities/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { ActivityForm } from "@/components/activities/activity-form";

export const metadata: Metadata = {
  title: "New activity",
  robots: { index: false, follow: false },
};

export default async function NewActivityPage() {
  const categories = await listCategories();

  return (
    <>
      <PortalPageHeader
        title="New activity"
        description="Activities start as drafts — publish when you're ready."
      />
      <Card className="p-sp-4">
        <ActivityForm
          action={createActivity}
          categories={categories}
          submitLabel="Create activity"
        />
      </Card>
    </>
  );
}
