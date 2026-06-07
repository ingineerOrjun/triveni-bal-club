import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, Trash2, Lightbulb } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listMySuggestions } from "@/lib/suggestions/queries";
import { deleteDraft } from "@/lib/suggestions/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SuggestionCard } from "@/components/suggestions/suggestion-card";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "My ideas",
  robots: { index: false, follow: false },
};

export default async function MySuggestionsPage() {
  const user = await getCurrentUser();
  const items = user ? await listMySuggestions(user.id) : [];

  return (
    <>
      <PortalPageHeader
        title="My ideas"
        description="Track your suggestions, edit drafts, and follow their progress."
        action={
          <Button asChild variant="primary">
            <Link href="/portal/suggestions/new">
              <Plus className="size-4" /> Share an idea
            </Link>
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="You haven't shared any ideas yet"
          description="Have a suggestion for the club? We'd love to hear it."
          action={
            <Button asChild variant="primary">
              <Link href="/portal/suggestions/new">Share an idea</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <div key={s.id} className="flex flex-col gap-2">
              <SuggestionCard
                suggestion={s}
                href={`/portal/suggestions/${s.id}`}
                viewerId={user?.id}
              />
              {s.status === "draft" ? (
                <Card className="flex items-center justify-end gap-1 p-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/portal/suggestions/${s.id}/edit`}>
                      <Pencil className="size-4" /> Edit
                    </Link>
                  </Button>
                  <ActionButton
                    action={deleteDraft.bind(null, s.id)}
                    variant="ghost"
                    confirmMessage={`Delete draft "${s.title}"?`}
                  >
                    <Trash2 className="size-4 text-danger" />
                  </ActionButton>
                </Card>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
