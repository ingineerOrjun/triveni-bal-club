import Link from "next/link";
import { Target, Eye, Compass, CheckCircle2 } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { localize } from "@/lib/i18n";
import { SITE } from "@/content/site";
import {
  MISSION,
  VISION,
  HISTORY,
  OBJECTIVES,
  CLUB_STATS,
} from "@/content/about";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/sections/hero-section";
import { SectionHeader } from "@/components/sections/section-header";
import { CTASection } from "@/components/sections/cta-section";
import {
  JsonLd,
  breadcrumbJsonLd,
} from "@/components/seo/json-ld";

export const metadata = createMetadata({
  title: "About",
  description: `Learn about the ${SITE.name} — its mission, vision, history, and objectives at ${SITE.school}.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />

      <HeroSection
        eyebrow={<Badge variant="soft">About the Club</Badge>}
        title="Our story"
        description={`Founded in ${SITE.founded}, the ${SITE.name} gives students a real voice and real responsibility at ${SITE.school}.`}
        image={{ src: "/gallery/triveni-05.jpeg", alt: "Club members gathered together" }}
      />

      {/* Mission & Vision */}
      <section className="container-page py-sp-5">
        <div className="grid gap-sp-3 md:grid-cols-2">
          <Card className="flex flex-col gap-sp-2 p-sp-4">
            <span className="inline-flex size-12 items-center justify-center rounded-md bg-primary-soft text-primary-active">
              <Target className="size-6" />
            </span>
            <h2 className="text-h2 font-bold text-ink">Mission</h2>
            <p className="text-lead text-soft">{localize(MISSION)}</p>
            <p lang="ne" className="font-nepali text-body text-soft">
              {localize(MISSION, "ne")}
            </p>
          </Card>
          <Card className="flex flex-col gap-sp-2 p-sp-4">
            <span className="inline-flex size-12 items-center justify-center rounded-md bg-accent-soft text-accent-active">
              <Eye className="size-6" />
            </span>
            <h2 className="text-h2 font-bold text-ink">Vision</h2>
            <p className="text-lead text-soft">{localize(VISION)}</p>
            <p lang="ne" className="font-nepali text-body text-soft">
              {localize(VISION, "ne")}
            </p>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-background-subtle py-sp-5">
        <div className="container-page grid grid-cols-2 gap-sp-3 lg:grid-cols-4">
          {CLUB_STATS.map((stat) => (
            <div key={stat.value} className="text-center">
              <p className="font-display text-display font-extrabold text-primary-active">
                {stat.value}
              </p>
              <p className="text-body text-soft">{localize(stat.label)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* History timeline */}
      <section className="container-page py-sp-5">
        <SectionHeader
          eyebrow="How we grew"
          title="Our history"
          className="mb-sp-4"
        />
        <ol className="relative ml-3 border-l-2 border-line">
          {HISTORY.map((event) => (
            <li key={event.year} className="mb-sp-4 ml-sp-3 last:mb-0">
              <span
                className="absolute -left-[9px] flex size-4 items-center justify-center rounded-pill bg-primary ring-4 ring-background"
                aria-hidden
              />
              <div className="flex flex-col gap-1">
                <Badge variant="soft" className="w-fit">
                  {event.year}
                </Badge>
                <h3 className="font-heading text-h3 font-bold text-ink">
                  {localize(event.title)}
                </h3>
                <p className="max-w-2xl text-body text-soft">
                  {localize(event.description)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Objectives */}
      <section className="bg-background-subtle py-sp-5">
        <div className="container-page flex flex-col gap-sp-4">
          <SectionHeader
            eyebrow="What we aim for"
            title="Our objectives"
          />
          <div className="grid gap-sp-3 sm:grid-cols-2">
            {OBJECTIVES.map((obj) => (
              <Card key={obj.title.en} className="flex items-start gap-sp-2 p-sp-3">
                <CheckCircle2 className="size-6 shrink-0 text-primary-active" />
                <div>
                  <h3 className="font-heading text-h3 font-bold text-ink">
                    {localize(obj.title)}
                  </h3>
                  <p className="text-body text-soft">{localize(obj.description)}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Advisor note + CTA */}
      <section className="container-page py-sp-5">
        <Card className="flex flex-col items-start gap-sp-2 p-sp-4">
          <span className="inline-flex size-12 items-center justify-center rounded-md bg-primary-soft text-primary-active">
            <Compass className="size-6" />
          </span>
          <h2 className="text-h2 font-bold text-ink">Guided, not governed</h2>
          <p className="max-w-2xl text-lead text-soft">
            Teachers advise and mentor, but students lead. Every committee is
            elected, every activity is student-run, and every member has a say.
          </p>
          <Button asChild variant="primary">
            <Link href="/committee">Meet the committee</Link>
          </Button>
        </Card>
      </section>

      <CTASection
        title="Want to get involved?"
        description="There's a place for every student in the Triveni Child Club."
        primary={{ label: "Contact us", href: "/contact" }}
        secondary={{ label: "See activities", href: "/activities" }}
      />
    </>
  );
}
