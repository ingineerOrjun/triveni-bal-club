import { notFound } from "next/navigation";
import { createMetadata } from "@/lib/seo";
import { getElectionBySlug, getResults } from "@/lib/elections/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroSection } from "@/components/sections/hero-section";
import { SectionHeader } from "@/components/sections/section-header";
import { ElectionStatusBadge } from "@/components/elections/election-badges";
import { ElectionTimeline } from "@/components/elections/election-timeline";
import { CandidateCard } from "@/components/elections/candidate-card";
import { ManifestoViewer } from "@/components/elections/manifesto-viewer";
import { ResultTable } from "@/components/elections/result-table";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getElectionBySlug(slug);
  if (!e) return createMetadata({ title: "Election not found", description: "" });
  return createMetadata({ title: e.title, description: e.description ?? "", path: `/elections/${e.slug}` });
}

export default async function PublicElectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const election = await getElectionBySlug(slug);
  if (!election || election.status === "draft") notFound();

  const showResults = election.status === "results_published" || election.status === "archived";
  const results = showResults ? await getResults(election.id) : [];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Elections", path: "/elections" }, { name: election.title, path: `/elections/${election.slug}` }])} />
      <HeroSection
        eyebrow={<ElectionStatusBadge status={election.status} />}
        title={election.title}
        description={election.description ?? undefined}
      />

      <section className="container-page py-sp-4">
        <ElectionTimeline status={election.status} />
      </section>

      {showResults ? (
        <section className="bg-background-subtle py-sp-5">
          <div className="container-page flex flex-col gap-sp-4">
            <SectionHeader eyebrow="Outcome" title="Results" />
            <div className="grid gap-sp-3 lg:grid-cols-2">
              {results.map((r) => (
                <ResultTable key={r.position.id} result={r} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="container-page py-sp-5">
        <SectionHeader eyebrow="Who's standing" title="Candidates" className="mb-sp-4" />
        <div className="flex flex-col gap-sp-5">
          {election.positions.map((position) => (
            <div key={position.id}>
              <h3 className="mb-sp-3 inline-flex items-center gap-2 text-h3 font-bold text-ink">
                {position.title}
                <Badge variant="soft">{position.seats} seat{position.seats > 1 ? "s" : ""}</Badge>
              </h3>
              {position.candidates.length === 0 ? (
                <p className="text-body text-soft">No approved candidates yet.</p>
              ) : (
                <div className="grid gap-sp-3 lg:grid-cols-2">
                  {position.candidates.map((c) => (
                    <Card key={c.id} className="flex flex-col gap-sp-2 p-sp-3">
                      <CandidateCard candidate={c} />
                      <ManifestoViewer candidate={c} />
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
