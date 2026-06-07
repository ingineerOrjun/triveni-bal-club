import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Lightbulb } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import {
  listMemberFeed,
  listCategories,
  listTags,
  type SuggestionFilters,
} from "@/lib/suggestions/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { SuggestionCard } from "@/components/suggestions/suggestion-card";
import { SuggestionFilters as Filters } from "@/components/suggestions/suggestion-filters";
import { SuggestionSearch } from "@/components/suggestions/suggestion-search";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Suggestions",
  robots: { index: false, follow: false },
};

export default async function PortalSuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();

  const filters: SuggestionFilters = {
    categoryId: sp.category,
    tagId: sp.tag,
    sort: (sp.sort as SuggestionFilters["sort"]) ?? "supported",
    q: sp.q,
  };

  const [items, categories, tags] = await Promise.all([
    listMemberFeed(filters, user?.id ?? ""),
    listCategories(true),
    listTags(),
  ]);

  return (
    <>
      <PortalPageHeader
        title="Suggestions"
        description="Browse ideas from across the club and support the ones you like."
        action={
          <Button asChild variant="primary">
            <Link href="/portal/suggestions/new">
              <Plus className="size-4" /> Share an idea
            </Link>
          </Button>
        }
      />

      <div className="mb-sp-4 flex flex-col gap-sp-3">
        <SuggestionSearch />
        <Filters categories={categories} tags={tags} showStatus={false} />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No ideas yet"
          description="Be the first to share an idea with the club!"
          action={
            <Button asChild variant="primary">
              <Link href="/portal/suggestions/new">Share an idea</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              href={`/portal/suggestions/${s.id}`}
              viewerId={user?.id}
              canVote
            />
          ))}
        </div>
      )}
    </>
  );
}
