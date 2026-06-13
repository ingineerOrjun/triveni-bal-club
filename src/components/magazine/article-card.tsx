import Link from "next/link";
import Image from "next/image";
import { Clock, Eye, Heart, ImageIcon } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { ArticleListItem } from "@/lib/magazine/queries";
import { Card } from "@/components/ui/card";
import { CategoryChip } from "./category-chip";

/** Standard story card used in grids and lists. */
export function ArticleCard({ article }: { article: ArticleListItem }) {
  const href = `/magazine/article/${article.slug}`;
  return (
    <Card className="group flex flex-col overflow-hidden">
      <Link
        href={href}
        className="relative block aspect-[16/9] overflow-hidden bg-background-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={article.title}
      >
        {article.cover_image ? (
          <Image
            src={article.cover_image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-base group-hover:scale-105"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-soft">
            <ImageIcon className="size-8" />
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-sp-2 p-sp-3">
        {article.categoryName ? (
          <CategoryChip name={article.categoryName} color={article.categoryColor} className="w-fit" />
        ) : null}
        <h3 className="font-heading text-h3 font-bold leading-tight text-ink">
          <Link href={href} className="hover:text-primary-active focus-visible:outline-none focus-visible:underline">
            {article.title}
          </Link>
        </h3>
        {article.excerpt ? (
          <p className="line-clamp-3 flex-1 text-body text-soft">{article.excerpt}</p>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-soft">
          {article.authorName ? <span className="font-semibold text-ink">{article.authorName}</span> : null}
          {article.published_at ? <span>{formatDate(article.published_at)}</span> : null}
          <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {article.reading_time} min</span>
          <span className="inline-flex items-center gap-1"><Eye className="size-3.5" /> {article.views}</span>
          {article.likes > 0 ? (
            <span className="inline-flex items-center gap-1"><Heart className="size-3.5" /> {article.likes}</span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
