import Image from "next/image";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import type { MagazineIssue } from "@/content/types";
import { localize, type Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface MagazineCardProps {
  issue: MagazineIssue;
  locale?: Locale;
}

export function MagazineCard({ issue, locale = "en" }: MagazineCardProps) {
  const title = localize(issue.title, locale);
  const description = localize(issue.description, locale);

  return (
    <Card interactive className="group flex h-full flex-col overflow-hidden">
      <Link
        href={`/magazine#${issue.slug}`}
        className="flex h-full flex-col focus-visible:outline-none"
        aria-label={`${title} — ${issue.edition}`}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-background-subtle">
          <Image
            src={issue.cover.src}
            alt={issue.cover.alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-base ease-out group-hover:scale-105"
          />
          <Badge variant="accent" className="absolute left-3 top-3 shadow-sm">
            {issue.edition}
          </Badge>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-sp-3">
          <h3 className="inline-flex items-center gap-2 font-heading text-h3 font-bold text-ink">
            <BookOpen className="size-5 text-primary-active" /> {title}
          </h3>
          <p className="line-clamp-2 flex-1 text-body text-soft">{description}</p>
          <div className="mt-sp-1 flex items-center justify-between">
            <span className="text-caption text-soft">
              {issue.articles.length} articles · {formatDate(issue.publishedOn)}
            </span>
            <ArrowRight className="size-4 text-primary-active transition-transform duration-fast group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </Card>
  );
}
