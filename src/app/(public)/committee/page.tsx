import { createMetadata } from "@/lib/seo";
import { SITE } from "@/content/site";
import { COMMITTEE_TERM, getCommitteeByKind } from "@/content/committee";
import { Badge } from "@/components/ui/badge";
import { HeroSection } from "@/components/sections/hero-section";
import { SectionHeader } from "@/components/sections/section-header";
import { CommitteeCard } from "@/components/cards/committee-card";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = createMetadata({
  title: "Committee",
  description: `Meet the ${SITE.name} committee for ${COMMITTEE_TERM} — leadership team, members, and teacher advisor.`,
  path: "/committee",
});

export default function CommitteePage() {
  const leadership = getCommitteeByKind("leadership");
  const members = getCommitteeByKind("member");
  const advisors = getCommitteeByKind("advisor");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Committee", path: "/committee" },
        ])}
      />

      <HeroSection
        eyebrow={<Badge variant="soft">{COMMITTEE_TERM}</Badge>}
        title="The committee"
        description="Elected by students, for students. Meet the team leading the club this term."
      />

      <section className="container-page py-sp-5">
        <SectionHeader
          eyebrow="Leadership team"
          title="Office bearers"
          className="mb-sp-4"
        />
        <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-4">
          {leadership.map((m) => (
            <CommitteeCard key={m.id} member={m} featured />
          ))}
        </div>
      </section>

      <section className="bg-background-subtle py-sp-5">
        <div className="container-page flex flex-col gap-sp-4">
          <SectionHeader
            eyebrow="Coordinators"
            title="Committee members"
          />
          <div className="grid gap-sp-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {members.map((m) => (
              <CommitteeCard key={m.id} member={m} />
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-sp-5">
        <SectionHeader
          eyebrow="Guidance"
          title="Teacher advisor"
          className="mb-sp-4"
        />
        <div className="grid gap-sp-3 sm:max-w-md">
          {advisors.map((m) => (
            <CommitteeCard key={m.id} member={m} featured />
          ))}
        </div>
      </section>
    </>
  );
}
