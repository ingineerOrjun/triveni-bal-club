import Image from "next/image";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  FileText,
  Eye,
  Heart,
  FolderOpen,
} from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { SITE } from "@/content/site";
import {
  getContributorBySlug,
  getContributorArticles,
  contributorStats,
} from "@/lib/contributors/queries";
import type { ContributorType } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { SectionHeader } from "@/components/sections/section-header";
import { MagazineGrid } from "@/components/magazine/magazine-grid";
import { StatCard } from "@/components/admin/stat-card";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<ContributorType, string> = {
  student: "Student",
  teacher: "Teacher",
  staff: "Staff",
  alumni: "Alumnus",
  guest: "Guest author",
  club_member: "Club member",
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getContributorBySlug(slug);
  if (!c) return createMetadata({ title: "Author not found", description: "" });
  return createMetadata({
    title: c.display_name,
    description: c.headline || c.bio || `Articles by ${c.display_name} on the ${SITE.name} magazine.`,
    path: `/authors/${c.slug}`,
    image: c.profile_photo || undefined,
    type: "article",
  });
}

export default async function AuthorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const contributor = await getContributorBySlug(slug);
  if (!contributor) notFound();

  const articles = await getContributorArticles(contributor);
  const stats = contributorStats(articles);
  const featured = articles.filter((a) => a.featured);
  const latest = featured.length > 0 ? articles.filter((a) => !a.featured) : articles;

  const social = contributor.social_links as Record<string, string>;
  const meta = [
    contributor.designation,
    contributor.department,
    contributor.class_level ? `Class ${contributor.class_level}${contributor.section ? `-${contributor.section}` : ""}` : null,
    contributor.organization,
    contributor.graduation_year ? `Class of ${contributor.graduation_year}` : null,
  ].filter(Boolean);

  const personLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: contributor.display_name,
    ...(contributor.headline ? { jobTitle: contributor.headline } : {}),
    ...(contributor.bio ? { description: contributor.bio } : {}),
    ...(contributor.profile_photo ? { image: contributor.profile_photo } : {}),
    url: `${SITE.url}/authors/${contributor.slug}`,
    ...(contributor.website || Object.values(social).length
      ? { sameAs: [contributor.website, ...Object.values(social)].filter(Boolean) }
      : {}),
  };

  return (
    <>
      <JsonLd data={personLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Magazine", path: "/magazine" },
          { name: contributor.display_name, path: `/authors/${contributor.slug}` },
        ])}
      />

      {/* Hero banner */}
      <header className="relative isolate overflow-hidden border-b border-line bg-ink text-white">
        {contributor.cover_photo ? (
          <>
            <Image src={contributor.cover_photo} alt="" fill sizes="100vw" className="object-cover opacity-30" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/50" aria-hidden />
          </>
        ) : (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              backgroundImage:
                "radial-gradient(45% 80% at 15% 0%, rgb(37 99 235 / 0.28) 0%, transparent 60%), radial-gradient(42% 70% at 90% 20%, rgb(16 185 129 / 0.2) 0%, transparent 55%)",
            }}
          />
        )}
        <div className="container-page relative flex flex-col items-center gap-sp-2 py-sp-5 text-center">
          <span className="relative inline-flex size-24 items-center justify-center overflow-hidden rounded-pill border-2 border-white/20 bg-surface/10 font-display text-h2 font-extrabold text-white shadow-lg">
            {contributor.profile_photo ? (
              <Image src={contributor.profile_photo} alt="" fill sizes="96px" className="object-cover" />
            ) : (
              initials(contributor.display_name)
            )}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="accent">{TYPE_LABEL[contributor.type]}</Badge>
            {contributor.verified ? (
              <span className="inline-flex items-center gap-1 text-caption font-semibold text-emerald-300">
                <BadgeCheck className="size-4" /> Verified
              </span>
            ) : null}
          </div>
          <h1 className="font-display text-h1 font-extrabold tracking-tight text-white">{contributor.display_name}</h1>
          {contributor.headline ? <p className="text-lead text-slate-300">{contributor.headline}</p> : null}
          {meta.length > 0 ? (
            <p className="text-caption text-slate-400">{meta.join(" · ")}</p>
          ) : null}

          {/* Social */}
          <div className="mt-sp-1 flex items-center gap-2">
            {contributor.website ? (
              <a href={contributor.website} target="_blank" rel="noopener noreferrer" aria-label="Website" className="inline-flex size-9 items-center justify-center rounded-button bg-white/10 text-white hover:bg-white/20">
                <Globe className="size-4" />
              </a>
            ) : null}
            {social.instagram ? (
              <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="inline-flex size-9 items-center justify-center rounded-button bg-white/10 text-white hover:bg-white/20">
                <Instagram className="size-4" />
              </a>
            ) : null}
            {social.facebook ? (
              <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="inline-flex size-9 items-center justify-center rounded-button bg-white/10 text-white hover:bg-white/20">
                <Facebook className="size-4" />
              </a>
            ) : null}
            {social.linkedin ? (
              <a href={social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="inline-flex size-9 items-center justify-center rounded-button bg-white/10 text-white hover:bg-white/20">
                <Linkedin className="size-4" />
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <div className="container-page flex flex-col gap-sp-5 py-sp-5">
        {/* Bio */}
        {contributor.bio ? (
          <p className="mx-auto max-w-2xl text-center text-lead leading-relaxed text-soft">{contributor.bio}</p>
        ) : null}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-sp-3 sm:grid-cols-4">
          <StatCard icon={FileText} label="Published articles" value={stats.articles} tone="indigo" />
          <StatCard icon={Eye} label="Total views" value={stats.views} tone="sky" />
          <StatCard icon={Heart} label="Total reactions" value={stats.likes} tone="rose" />
          <StatCard icon={FolderOpen} label="Top category" value={stats.topCategory ?? "—"} tone="violet" />
        </div>

        {/* Featured */}
        {featured.length > 0 ? (
          <section>
            <SectionHeader eyebrow="Editor's picks" title="Featured work" className="mb-sp-4" />
            <MagazineGrid articles={featured} />
          </section>
        ) : null}

        {/* Latest / all */}
        <section>
          <SectionHeader
            eyebrow="Portfolio"
            title={featured.length > 0 ? "More articles" : "Published articles"}
            className="mb-sp-4"
          />
          <MagazineGrid
            articles={latest}
            emptyTitle="No published articles yet"
            emptyDescription={`${contributor.display_name} hasn't published anything yet — check back soon.`}
          />
        </section>
      </div>
    </>
  );
}
