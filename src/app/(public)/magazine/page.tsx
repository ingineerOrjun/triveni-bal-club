import Link from "next/link";
import { TrendingUp, Eye, Rss } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { SITE } from "@/content/site";
import {
  listCategories,
  getLatestEdition,
  getFeaturedArticles,
  getPopularArticles,
  listPublishedArticles,
  listEditions,
  searchArticles,
} from "@/lib/magazine/queries";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { MagazineHero } from "@/components/magazine/magazine-hero";
import { MagazineSearch } from "@/components/magazine/magazine-search";
import { FilterSidebar } from "@/components/magazine/filter-sidebar";
import { MagazineGrid } from "@/components/magazine/magazine-grid";
import { FeaturedArticle } from "@/components/magazine/featured-article";
import { EditionCard } from "@/components/magazine/edition-card";
import { SectionHeader } from "@/components/sections/section-header";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Magazine",
  description: `Triveni Voices — the student magazine of the ${SITE.name}. Stories, reports, and features by club members.`,
  path: "/magazine",
});

export default async function MagazinePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const categories = await listCategories();
  const activeCategory = category ? categories.find((c) => c.slug === category) ?? null : null;

  const search = q?.trim() ?? "";
  const isSearch = search.length > 0;

  const [latestEdition, featured, popular, latest, editions, results] = await Promise.all([
    getLatestEdition(),
    isSearch || activeCategory ? Promise.resolve([]) : getFeaturedArticles(1),
    getPopularArticles(5),
    isSearch
      ? Promise.resolve([])
      : listPublishedArticles({ limit: 12, categoryId: activeCategory?.id }),
    isSearch || activeCategory ? Promise.resolve([]) : listEditions({ publishedOnly: true }),
    isSearch ? searchArticles(search) : Promise.resolve([]),
  ]);

  const lead = featured[0] ?? null;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Magazine", path: "/magazine" }])} />

      <MagazineHero
        eyebrow="Triveni Voices"
        title="Student magazine"
        description="Stories, reports, poems, and features — written and created entirely by our members."
        cover={latestEdition?.cover_image}
      >
        <MagazineSearch defaultValue={search} />
      </MagazineHero>

      <section className="container-page py-sp-5">
        <div className="mb-sp-4 flex flex-wrap items-center justify-between gap-sp-3">
          <FilterSidebar categories={categories} activeSlug={activeCategory?.slug} />
          <Link href="/magazine/rss" className="inline-flex items-center gap-1 text-caption font-semibold text-soft hover:text-ink">
            <Rss className="size-4" /> RSS feed
          </Link>
        </div>

        {isSearch ? (
          <>
            <SectionHeader eyebrow="Search" title={`Results for “${search}”`} className="mb-sp-4" />
            <MagazineGrid
              articles={results}
              emptyTitle="No matching stories"
              emptyDescription="Try a different search term."
            />
          </>
        ) : (
          <div className="grid gap-sp-5 lg:grid-cols-[1fr_300px]">
            <div className="flex flex-col gap-sp-5">
              {lead ? (
                <div>
                  <SectionHeader eyebrow="Editor's pick" title="Featured story" className="mb-sp-3" />
                  <FeaturedArticle article={lead} />
                </div>
              ) : null}

              <div>
                <SectionHeader
                  eyebrow={activeCategory ? activeCategory.name : "Fresh off the press"}
                  title={activeCategory ? `${activeCategory.name} stories` : "Latest stories"}
                  className="mb-sp-3"
                />
                <MagazineGrid
                  articles={latest}
                  emptyTitle="No stories yet"
                  emptyDescription="Published articles will appear here."
                />
              </div>
            </div>

            {/* Sidebar */}
            <aside className="flex flex-col gap-sp-4">
              <div className="rounded-lg border border-line bg-surface p-sp-3">
                <h2 className="mb-sp-2 flex items-center gap-2 font-heading text-h3 font-bold text-ink">
                  <TrendingUp className="size-5 text-accent-active" /> Most read
                </h2>
                {popular.length === 0 ? (
                  <p className="text-body text-soft">No stories yet.</p>
                ) : (
                  <ol className="flex flex-col divide-y divide-line">
                    {popular.map((a, i) => (
                      <li key={a.id} className="flex items-start gap-3 py-2">
                        <span className="font-display text-lead font-extrabold text-soft">{i + 1}</span>
                        <div className="min-w-0">
                          <Link href={`/magazine/article/${a.slug}`} className="font-heading font-semibold text-ink hover:text-primary-active">
                            {a.title}
                          </Link>
                          <p className="inline-flex items-center gap-1 text-caption text-soft">
                            <Eye className="size-3.5" /> {a.views} views
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </aside>
          </div>
        )}
      </section>

      {/* Editions archive */}
      {!isSearch && !activeCategory && editions.length > 0 ? (
        <section className="bg-background-subtle py-sp-5">
          <div className="container-page">
            <SectionHeader eyebrow="The archive" title="Browse editions" className="mb-sp-4" />
            <div className="grid grid-cols-2 gap-sp-3 sm:grid-cols-3 lg:grid-cols-5">
              {editions.map((e) => (
                <EditionCard key={e.id} edition={e} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
