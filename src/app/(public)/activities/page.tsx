import { createMetadata } from "@/lib/seo";
import { SITE } from "@/content/site";
import { ACTIVITIES } from "@/content/activities";
import { Badge } from "@/components/ui/badge";
import { HeroSection } from "@/components/sections/hero-section";
import { ActivitiesExplorer } from "@/components/sections/activities-explorer";
import { CTASection } from "@/components/sections/cta-section";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = createMetadata({
  title: "Activities",
  description: `Explore the activities run by the ${SITE.name} — leadership, environment, arts, sports, literary, service, and science.`,
  path: "/activities",
});

export default function ActivitiesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Activities", path: "/activities" },
        ])}
      />

      <HeroSection
        eyebrow={<Badge variant="soft">Get involved</Badge>}
        title="Activities"
        description="There's something for everyone — find an activity that sparks your interest and dive in."
      />

      <section className="container-page py-sp-5">
        <ActivitiesExplorer activities={ACTIVITIES} />
      </section>

      <CTASection
        title="Have an idea for a new activity?"
        description="Members can propose and lead their own activities. Tell us what you'd love to start."
        primary={{ label: "Get in touch", href: "/contact" }}
      />
    </>
  );
}
