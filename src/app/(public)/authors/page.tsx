import Link from "next/link";
import Image from "next/image";
import { Users, BadgeCheck } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { SITE } from "@/content/site";
import { listContributors } from "@/lib/contributors/queries";
import type { ContributorType } from "@/types/database";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { MagazineHero } from "@/components/magazine/magazine-hero";
import { SectionHeader } from "@/components/sections/section-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Authors & contributors",
  description: `The students, teachers, alumni, and guests who write for the ${SITE.name} magazine.`,
  path: "/authors",
});

const TYPE_LABEL: Record<ContributorType, string> = {
  student: "Student",
  teacher: "Teacher",
  staff: "Staff",
  alumni: "Alumnus",
  guest: "Guest",
  club_member: "Club member",
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export default async function AuthorsDirectoryPage() {
  const contributors = await listContributors();
  const featured = contributors.filter((c) => c.featured);
  const rest = featured.length > 0 ? contributors.filter((c) => !c.featured) : contributors;

  function Grid({ items }: { items: typeof contributors }) {
    return (
      <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <Card key={c.id} interactive gradientBorder className="p-sp-3">
            <Link href={`/authors/${c.slug}`} className="flex items-center gap-3 focus-visible:outline-none">
              <span className="relative inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-pill bg-primary-soft font-heading font-bold text-primary-active">
                {c.profile_photo ? (
                  <Image src={c.profile_photo} alt="" fill sizes="56px" className="object-cover" />
                ) : (
                  initials(c.display_name)
                )}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1 font-heading text-h3 font-bold text-ink">
                  {c.display_name}
                  {c.verified ? <BadgeCheck className="size-4 text-primary-active" aria-label="Verified" /> : null}
                </p>
                <p className="flex flex-wrap items-center gap-1.5 text-caption text-soft">
                  <Badge variant="soft">{TYPE_LABEL[c.type]}</Badge>
                  {c.headline ? <span className="line-clamp-1">{c.headline}</span> : null}
                </p>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Authors", path: "/authors" }])} />
      <MagazineHero
        eyebrow="Triveni Voices"
        title="Authors & contributors"
        description="Meet the students, teachers, alumni, and guests behind our stories."
      />

      <div className="container-page flex flex-col gap-sp-5 py-sp-5">
        {contributors.length === 0 ? (
          <EmptyState icon={Users} title="No author profiles yet" description="Once members publish articles, their profiles will appear here." />
        ) : (
          <>
            {featured.length > 0 ? (
              <section>
                <SectionHeader eyebrow="Spotlight" title="Featured contributors" className="mb-sp-4" />
                <Grid items={featured} />
              </section>
            ) : null}
            <section>
              <SectionHeader eyebrow="The community" title="All contributors" className="mb-sp-4" />
              <Grid items={rest} />
            </section>
          </>
        )}
      </div>
    </>
  );
}
