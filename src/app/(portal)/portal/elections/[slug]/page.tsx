import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getElectionBySlug, hasVoted, getReceipt, getResults } from "@/lib/elections/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ElectionStatusBadge } from "@/components/elections/election-badges";
import { ElectionTimeline } from "@/components/elections/election-timeline";
import { VotingBooth } from "@/components/elections/voting-booth";
import { VoteReceipt } from "@/components/elections/vote-receipt";
import { CandidateCard } from "@/components/elections/candidate-card";
import { ManifestoViewer } from "@/components/elections/manifesto-viewer";
import { ResultTable } from "@/components/elections/result-table";

export const metadata: Metadata = { title: "Election", robots: { index: false, follow: false } };

export default async function PortalElectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const election = await getElectionBySlug(slug);
  if (!election) notFound();

  const voted = user ? await hasVoted(election.id) : false;
  const receipt = voted && user ? await getReceipt(election.id, user.id) : null;
  const showResults = election.status === "results_published" || election.status === "archived";
  const results = showResults ? await getResults(election.id) : [];

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/portal/elections"><ArrowLeft className="size-4" /> All elections</Link>
      </Button>

      <PortalPageHeader title={election.title} action={<ElectionStatusBadge status={election.status} />} />
      <div className="mb-sp-4"><ElectionTimeline status={election.status} /></div>

      {/* Voting / receipt */}
      {election.status === "voting" ? (
        voted && receipt ? (
          <div className="mb-sp-5"><VoteReceipt code={receipt} /></div>
        ) : (
          <div className="mb-sp-5">
            <h2 className="mb-sp-3 text-h2 font-bold text-ink">Cast your vote</h2>
            <VotingBooth electionId={election.id} positions={election.positions} />
          </div>
        )
      ) : null}

      {/* Results */}
      {showResults ? (
        <div className="mb-sp-5">
          <h2 className="mb-sp-3 text-h2 font-bold text-ink">Results</h2>
          <div className="grid gap-sp-3 lg:grid-cols-2">
            {results.map((r) => <ResultTable key={r.position.id} result={r} />)}
          </div>
        </div>
      ) : null}

      {/* Candidates */}
      <h2 className="mb-sp-3 text-h2 font-bold text-ink">Candidates</h2>
      <div className="flex flex-col gap-sp-4">
        {election.positions.map((p) => (
          <div key={p.id}>
            <h3 className="mb-sp-2 text-h3 font-bold text-ink">{p.title}</h3>
            {p.candidates.length === 0 ? (
              <p className="text-body text-soft">No approved candidates.</p>
            ) : (
              <div className="grid gap-sp-3 lg:grid-cols-2">
                {p.candidates.map((c) => (
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
    </>
  );
}
