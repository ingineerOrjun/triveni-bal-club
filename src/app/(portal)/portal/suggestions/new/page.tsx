import type { Metadata } from "next";
import { listCategories, listTags } from "@/lib/suggestions/queries";
import { submitSuggestion } from "@/lib/suggestions/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { SuggestionForm } from "@/components/suggestions/suggestion-form";

export const metadata: Metadata = {
  title: "Share an idea",
  robots: { index: false, follow: false },
};

export default async function NewSuggestionPage() {
  const [categories, tags] = await Promise.all([
    listCategories(true),
    listTags(),
  ]);

  return (
    <>
      <PortalPageHeader
        title="Share an idea"
        description="Suggest an activity, report a problem, or propose an improvement."
      />
      <Card className="p-sp-4">
        <SuggestionForm
          action={submitSuggestion}
          categories={categories}
          tags={tags}
        />
      </Card>
    </>
  );
}
