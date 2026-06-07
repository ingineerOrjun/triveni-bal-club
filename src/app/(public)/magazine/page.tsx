import type * as React from "react";
import Image from "next/image";
import { BookOpen, Feather, FileText, Palette, Newspaper } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { localize } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { SITE } from "@/content/site";
import { MAGAZINE, getFeaturedArticles } from "@/content/magazine";
import type { MagazineArticle } from "@/content/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { HeroSection } from "@/components/sections/hero-section";
import { SectionHeader } from "@/components/sections/section-header";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = createMetadata({
  title: "Magazine",
  description: `Triveni Voices — the student magazine of the ${SITE.name}. Read stories, poems, essays, and reports by club members.`,
  path: "/magazine",
});

const CATEGORY_ICON: Record<
  MagazineArticle["category"],
  React.ComponentType<{ className?: string }>
> = {
  story: BookOpen,
  poem: Feather,
  essay: FileText,
  art: Palette,
  report: Newspaper,
};

export default function MagazinePage() {
  const featured = getFeaturedArticles(3);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Magazine", path: "/magazine" },
        ])}
      />

      <HeroSection
        eyebrow={<Badge variant="soft">Triveni Voices</Badge>}
        title="Student magazine"
        description="Stories, poems, essays, art, and reports — written and created entirely by our members."
      />

      {/* Featured articles */}
      <section className="container-page py-sp-5">
        <SectionHeader
          eyebrow="Editor's picks"
          title="Featured articles"
          className="mb-sp-4"
        />
        <div className="grid gap-sp-3 md:grid-cols-3">
          {featured.map((article) => {
            const Icon = CATEGORY_ICON[article.category];
            return (
              <Card key={article.slug} className="flex flex-col gap-sp-2 p-sp-3">
                <span className="inline-flex size-11 items-center justify-center rounded-md bg-accent-soft text-accent-active">
                  <Icon className="size-5" />
                </span>
                <Badge variant="soft" className="w-fit capitalize">
                  {article.category}
                </Badge>
                <h3 className="font-heading text-h3 font-bold text-ink">
                  {localize(article.title)}
                </h3>
                <p className="flex-1 text-body text-soft">
                  {localize(article.excerpt)}
                </p>
                <p className="text-caption font-semibold text-primary-active">
                  {article.author}
                  {article.authorClass ? ` · ${article.authorClass}` : ""}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Issues */}
      <section className="bg-background-subtle py-sp-5">
        <div className="container-page flex flex-col gap-sp-5">
          <SectionHeader eyebrow="The archive" title="All issues" />
          {MAGAZINE.map((issue) => (
            <div
              key={issue.slug}
              id={issue.slug}
              className="scroll-mt-[calc(var(--header-height)+1rem)]"
            >
              <Card className="grid gap-sp-4 p-sp-3 md:grid-cols-[200px_1fr] md:p-sp-4">
                <div className="relative mx-auto aspect-[3/4] w-full max-w-[200px] overflow-hidden rounded-lg border border-line shadow-sm">
                  <Image
                    src={issue.cover.src}
                    alt={issue.cover.alt}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col gap-sp-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="accent">{issue.edition}</Badge>
                    <span className="text-caption text-soft">
                      {formatDate(issue.publishedOn)}
                    </span>
                  </div>
                  <h3 className="font-heading text-h2 font-bold text-ink">
                    {localize(issue.title)}
                  </h3>
                  <p className="text-body text-soft">
                    {localize(issue.description)}
                  </p>
                  <ul className="mt-sp-1 flex flex-col divide-y divide-line rounded-md border border-line bg-surface">
                    {issue.articles.map((article) => {
                      const Icon = CATEGORY_ICON[article.category];
                      return (
                        <li
                          key={article.slug}
                          className="flex items-center gap-sp-2 p-sp-2"
                        >
                          <Icon className="size-4 shrink-0 text-primary-active" />
                          <span className="flex-1 text-body text-ink">
                            {localize(article.title)}
                          </span>
                          <span className="text-caption text-soft">
                            {article.author}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
