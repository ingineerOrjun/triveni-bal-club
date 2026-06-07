import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getSuggestionDetail,
  listCategories,
  listTags,
} from "@/lib/suggestions/queries";
import { updateSuggestion } from "@/lib/suggestions/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { SuggestionForm } from "@/components/suggestions/suggestion-form";

export const metadata: Metadata = {
  title: "Edit idea",
  robots: { index: false, follow: false },
};

export default async function EditSuggestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const s = user ? await getSuggestionDetail(id, user.id) : null;
  if (!s) notFound();

  // Only the author may edit, and only while it is still a draft.
  if (s.author_id !== user?.id || s.status !== "draft") {
    redirect(`/portal/suggestions/${id}`);
  }

  const [categories, tags] = await Promise.all([
    listCategories(true),
    listTags(),
  ]);

  return (
    <>
      <PortalPageHeader title="Edit idea" description="Drafts can be edited until you submit them." />
      <Card className="p-sp-4">
        <SuggestionForm
          action={updateSuggestion.bind(null, id)}
          categories={categories}
          tags={tags}
          values={{
            title: s.title,
            description: s.description,
            category_id: s.category_id ?? "",
            visibility: s.visibility,
            is_anonymous: s.is_anonymous,
            tagIds: s.tags.map((t) => t.id),
          }}
        />
      </Card>
    </>
  );
}
