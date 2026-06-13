import type { ArticleListItem } from "@/lib/magazine/queries";
import { ArticleCard } from "./article-card";
import { EmptyMagazine } from "./empty-magazine";

/** Responsive grid of article cards with a built-in empty state. */
export function MagazineGrid({
  articles,
  columns = 3,
  emptyTitle,
  emptyDescription,
}: {
  articles: ArticleListItem[];
  columns?: 2 | 3;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (articles.length === 0) {
    return <EmptyMagazine title={emptyTitle} description={emptyDescription} />;
  }
  const cols = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={`grid gap-sp-3 ${cols}`}>
      {articles.map((a) => (
        <ArticleCard key={a.id} article={a} />
      ))}
    </div>
  );
}
