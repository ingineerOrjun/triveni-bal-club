import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Megaphone,
  Vote,
  Square,
  Trophy,
  Users2,
  Archive,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { getElectionById, getResults, getTurnout } from "@/lib/elections/queries";
import {
  setElectionStatus,
  deletePosition,
  reviewNomination,
  publishResults,
  generateCommittee,
} from "@/lib/elections/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ElectionStatusBadge, NominationStatusBadge } from "@/components/elections/election-badges";
import { ElectionTimeline } from "@/components/elections/election-timeline";
import { ResultTable } from "@/components/elections/result-table";
import { AddPositionForm } from "@/components/elections/admin-forms";
import { ActionButton } from "@/components/shared/action-button";
import { StatCard } from "@/components/admin/stat-card";

export const metadata: Metadata = { title: "Manage election", robots: { index: false, follow: false } };

export default async function ManageElectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const election = await getElectionById(id, false);
  if (!election) notFound();

  const showResults = election.status === "closed" || election.status === "results_published" || election.status === "archived";
  const showTurnout = election.status === "voting" || showResults;
  const [results, turnout] = await Promise.all([
    showResults ? getResults(id) : Promise.resolve([]),
    showTurnout ? getTurnout(id) : Promise.resolve({ eligible: 0, voted: 0 }),
  ]);
  const pct = turnout.eligible > 0 ? Math.round((turnout.voted / turnout.eligible) * 100) : 0;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/admin/elections"><ArrowLeft className="size-4" /> All elections</Link>
      </Button>

      <PortalPageHeader title={election.title} action={<ElectionStatusBadge status={election.status} />} />
      <div className="mb-sp-4"><ElectionTimeline status={election.status} /></div>

      {/* Commission controls */}
      <Card className="mb-sp-4">
        <CardHeader><CardTitle>Commission controls</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {election.status === "draft" ? (
            <ActionButton action={setElectionStatus.bind(null, id, "nominations")} variant="primary">
              <Megaphone className="size-4" /> Open nominations
            </ActionButton>
          ) : null}
          {election.status === "nominations" ? (
            <ActionButton action={setElectionStatus.bind(null, id, "voting")} variant="primary"
              confirmMessage="Open voting? Members will be able to cast ballots.">
              <Vote className="size-4" /> Open voting
            </ActionButton>
          ) : null}
          {election.status === "voting" ? (
            <ActionButton action={setElectionStatus.bind(null, id, "closed")} variant="outline"
              confirmMessage="Close voting? No further ballots will be accepted.">
              <Square className="size-4" /> Close voting
            </ActionButton>
          ) : null}
          {election.status === "closed" ? (
            <ActionButton action={publishResults.bind(null, id)} variant="primary"
              confirmMessage="Publish results publicly?">
              <Trophy className="size-4" /> Publish results
            </ActionButton>
          ) : null}
          {election.status === "results_published" ? (
            <>
              <ActionButton action={generateCommittee.bind(null, id)} variant="primary"
                confirmMessage="Generate the committee from the winners?">
                <Users2 className="size-4" /> Generate committee
              </ActionButton>
              <ActionButton action={setElectionStatus.bind(null, id, "archived")} variant="ghost">
                <Archive className="size-4" /> Archive
              </ActionButton>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Turnout */}
      {showTurnout ? (
        <div className="mb-sp-4 grid grid-cols-3 gap-sp-3">
          <StatCard icon={Users2} label="Eligible voters" value={turnout.eligible} />
          <StatCard icon={Vote} label="Votes cast" value={turnout.voted} accent="accent" />
          <StatCard icon={Trophy} label="Turnout" value={`${pct}%`} />
        </div>
      ) : null}

      {/* Results */}
      {showResults && results.length > 0 ? (
        <section className="mb-sp-5">
          <h2 className="mb-sp-3 text-h2 font-bold text-ink">Results</h2>
          <div className="grid gap-sp-3 lg:grid-cols-2">
            {results.map((r) => <ResultTable key={r.position.id} result={r} />)}
          </div>
        </section>
      ) : null}

      {/* Positions */}
      <Card className="mb-sp-4">
        <CardHeader><CardTitle>Positions</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-sp-3">
          <AddPositionForm electionId={id} />
          {election.positions.length === 0 ? (
            <p className="text-body text-soft">No positions yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {election.positions.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="font-semibold text-ink">{p.title} <Badge variant="soft">{p.seats} seat{p.seats > 1 ? "s" : ""}</Badge></span>
                  <ActionButton action={deletePosition.bind(null, p.id, id)} variant="ghost" confirmMessage={`Delete position "${p.title}"?`}>
                    <Trash2 className="size-4 text-danger" />
                  </ActionButton>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Nomination review */}
      <Card>
        <CardHeader><CardTitle>Candidate nominations</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-sp-3">
          {election.positions.every((p) => p.candidates.length === 0) ? (
            <p className="text-body text-soft">No nominations submitted yet.</p>
          ) : (
            election.positions.map((p) =>
              p.candidates.length === 0 ? null : (
                <div key={p.id}>
                  <h3 className="mb-sp-1 font-heading font-bold text-ink">{p.title}</h3>
                  <ul className="flex flex-col divide-y divide-line">
                    {p.candidates.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <span className="inline-flex items-center gap-2">
                          <span className="font-semibold text-ink">{c.memberName ?? "Candidate"}</span>
                          <NominationStatusBadge status={c.status} />
                        </span>
                        <span className="flex items-center gap-1">
                          {c.status !== "approved" ? (
                            <ActionButton action={reviewNomination.bind(null, c.id, id, "approved", undefined)} variant="primary">
                              <Check className="size-4" /> Approve
                            </ActionButton>
                          ) : null}
                          {c.status !== "rejected" ? (
                            <ActionButton action={reviewNomination.bind(null, c.id, id, "rejected", undefined)} variant="ghost">
                              <X className="size-4 text-danger" /> Reject
                            </ActionButton>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )
          )}
        </CardContent>
      </Card>
    </>
  );
}
