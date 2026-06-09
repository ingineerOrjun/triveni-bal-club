import { Vote } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { SITE } from "@/content/site";
import { listElections } from "@/lib/elections/queries";
import { Badge } from "@/components/ui/badge";
import { HeroSection } from "@/components/sections/hero-section";
import { ElectionCard } from "@/components/elections/election-card";
import { EmptyState } from "@/components/shared/empty-state";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = createMetadata({
  title: "Elections",
  description: `Club elections at the ${SITE.name} — candidates, manifestos, and results.`,
  path: "/elections",
});

export const dynamic = "force-dynamic";

export default async function ElectionsPage() {
  const elections = (await listElections()).filter((e) => e.status !== "draft");

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Elections", path: "/elections" }])} />
      <HeroSection
        eyebrow={<Badge variant="soft">Democratic governance</Badge>}
        title="Club elections"
        description="Free, fair, and secret elections — meet the candidates, read their manifestos, and see the results."
      />
      <section className="container-page py-sp-5">
        {elections.length === 0 ? (
          <EmptyState icon={Vote} title="No elections yet" description="Upcoming elections will appear here." />
        ) : (
          <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
            {elections.map((e) => (
              <ElectionCard key={e.id} election={e} href={`/elections/${e.slug}`} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
