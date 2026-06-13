import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Eye, ImageIcon } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { ArticleListItem } from "@/lib/magazine/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryChip } from "./category-chip";

/** Large hero treatment for the lead/featured story. */
export function FeaturedArticle({ article }: { article: ArticleListItem }) {
  const href = `/magazine/article/${article.slug}`;
  return (
    <Card className="grid overflow-hidden md:grid-cols-2">
      <Link
        href={href}
        className="relative block aspect-[16/10] overflow-hidden bg-background-subtle md:aspect-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={article.title}
      >
        {article.cover_image ? (
          <Image src={article.cover_image} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-soft"><ImageIcon className="size-10" /></span>
        )}
      </Link>
      <div className="flex flex-col justify-center gap-sp-3 p-sp-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">Featured</Badge>
          {article.categoryName ? <CategoryChip name={article.categoryName} color={article.categoryColor} /> : null}
        </div>
        <h2 className="font-display text-h1 font-extrabold leading-tight text-ink">
          <Link href={href} className="hover:text-primary-active focus-visible:outline-none focus-visible:underline">
            {article.title}
          </Link>
        </h2>
        {article.excerpt ? <p className="line-clamp-3 text-lead text-soft">{article.excerpt}</p> : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-soft">
          {article.authorName ? <span className="font-semibold text-ink">{article.authorName}</span> : null}
          {article.published_at ? <span>{formatDate(article.published_at)}</span> : null}
          <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {article.reading_time} min read</span>
          <span className="inline-flex items-center gap-1"><Eye className="size-3.5" /> {article.views}</span>
        </div>
        <Link
          href={href}
          className="inline-flex w-fit items-center gap-1 font-heading font-bold text-primary-active hover:gap-2 focus-visible:outline-none focus-visible:underline"
        >
          Read the story <ArrowRight className="size-4" />
        </Link>
      </div>
    </Card>
  );
}
