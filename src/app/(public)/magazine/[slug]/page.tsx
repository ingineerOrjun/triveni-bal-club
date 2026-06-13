import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, FileText, Users, Download } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { SITE } from "@/content/site";
import { getEditionBySlug } from "@/lib/magazine/queries";
import { isPdfAvailable } from "@/lib/magazine/pdf";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { MagazineHero } from "@/components/magazine/magazine-hero";
import { MagazineGrid } from "@/components/magazine/magazine-grid";
import { FeaturedArticle } from "@/components/magazine/featured-article";
import { CategoryChip } from "@/components/magazine/category-chip";
import { SectionHeader } from "@/components/sections/section-header";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { editionLabel } from "@/components/magazine/edition-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getEditionBySlug(slug);
  if (!data) return createMetadata({ title: "Edition not found", description: "" });
  const { edition } = data;
  return createMetadata({
    title: edition.seo_title || edition.title,
    description: edition.seo_description || edition.description || `An edition of the ${SITE.name} magazine.`,
    path: `/magazine/${edition.slug}`,
    image: edition.cover_image || undefined,
  });
}

export default async function EditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getEditionBySlug(slug);
  if (!data || data.edition.status !== "published") notFound();
  const { edition, articles } = data;

  const featured = articles.find((a) => a.featured) ?? articles[0] ?? null;
  const rest = featured ? articles.filter((a) => a.id !== featured.id) : articles;
  const authors = new Set(articles.map((a) => a.authorName).filter(Boolean));
  const categories = Array.from(
    new Map(articles.filter((a) => a.categoryName).map((a) => [a.categoryName, a.categoryColor])).entries()
  );
  const label = editionLabel(edition);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Magazine", path: "/magazine" },
          { name: edition.title, path: `/magazine/${edition.slug}` },
        ])}
      />

      <MagazineHero
        eyebrow={label || "Edition"}
        title={edition.title}
        description={edition.description ?? undefined}
        cover={edition.cover_image}
      >
        {isPdfAvailable() ? (
          <Button variant="accent"><Download className="size-4" /> Download PDF</Button>
        ) : (
          <Button variant="outline" disabled title="PDF export is not configured yet">
            <Download className="size-4" /> Download PDF (coming soon)
          </Button>
        )}
      </MagazineHero>

      <section className="container-page py-sp-5">
        <div className="mb-sp-4 grid grid-cols-2 gap-sp-3 sm:grid-cols-3">
          <StatCard icon={FileText} label="Articles" value={articles.length} />
          <StatCard icon={Users} label="Contributors" value={authors.size} accent="accent" />
          <StatCard icon={BookOpen} label="Categories" value={categories.length} />
        </div>

        {categories.length > 0 ? (
          <div className="mb-sp-4 flex flex-wrap gap-2">
            {categories.map(([name, color]) => (
              <CategoryChip key={name} name={name as string} color={color as string | null} />
            ))}
          </div>
        ) : null}

        {featured ? (
          <div className="mb-sp-5">
            <SectionHeader eyebrow="Lead story" title="In this edition" className="mb-sp-3" />
            <FeaturedArticle article={featured} />
          </div>
        ) : null}

        <SectionHeader eyebrow="Contents" title="All articles" className="mb-sp-3" />
        <MagazineGrid
          articles={rest}
          emptyTitle="No articles yet"
          emptyDescription="This edition doesn't have any published articles yet."
        />

        {/* Table of contents */}
        {articles.length > 0 ? (
          <nav aria-label="Table of contents" className="mt-sp-5 rounded-lg border border-line bg-surface p-sp-3">
            <h2 className="mb-sp-2 font-heading text-h3 font-bold text-ink">Table of contents</h2>
            <ol className="flex flex-col divide-y divide-line">
              {articles.map((a, i) => (
                <li key={a.id} className="flex items-center gap-3 py-2">
                  <span className="font-display text-lead font-bold text-soft">{String(i + 1).padStart(2, "0")}</span>
                  <Link href={`/magazine/article/${a.slug}`} className="flex-1 font-heading font-semibold text-ink hover:text-primary-active">
                    {a.title}
                  </Link>
                  {a.authorName ? <span className="text-caption text-soft">{a.authorName}</span> : null}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
      </section>
    </>
  );
}
