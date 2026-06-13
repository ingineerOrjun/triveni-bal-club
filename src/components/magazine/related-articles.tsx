import type { ArticleListItem } from "@/lib/magazine/queries";
import { SectionHeader } from "@/components/sections/section-header";
import { ArticleCard } from "./article-card";

/** "Keep reading" block of related stories. Renders nothing when empty. */
export function RelatedArticles({ articles }: { articles: ArticleListItem[] }) {
  if (articles.length === 0) return null;
  return (
    <section className="container-page py-sp-5">
      <SectionHeader eyebrow="Keep reading" title="Related stories" className="mb-sp-4" />
      <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </section>
  );
}
