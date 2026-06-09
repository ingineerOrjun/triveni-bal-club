import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getElectionBySlug } from "@/lib/elections/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CandidateForm } from "@/components/elections/candidate-form";

export const metadata: Metadata = { title: "Stand for election", robots: { index: false, follow: false } };

export default async function NominatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const election = await getElectionBySlug(slug);
  if (!election) notFound();
  if (election.status !== "nominations") redirect(`/portal/elections/${slug}`);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/portal/elections"><ArrowLeft className="size-4" /> Back</Link>
      </Button>
      <PortalPageHeader
        title={`Stand in: ${election.title}`}
        description="Submit your nomination. A commissioner will review it before it appears publicly."
      />
      <Card className="p-sp-4">
        <CandidateForm electionId={election.id} positions={election.positions} />
      </Card>
    </>
  );
}
