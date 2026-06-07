import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getProgramById,
  listAwards,
  listMemberOptions,
} from "@/lib/recognition/queries";
import { giveRecognitionAward } from "@/lib/recognition/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { AwardForm } from "@/components/recognition/award-form";
import { RecognitionCard } from "@/components/recognition/recognition-card";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Recognition program",
  robots: { index: false, follow: false },
};

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin/recognition");

  const program = await getProgramById(id);
  if (!program) notFound();

  const [awards, members] = await Promise.all([
    listAwards(id),
    listMemberOptions(),
  ]);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/admin/recognition">
          <ArrowLeft className="size-4" /> All programs
        </Link>
      </Button>

      <PortalPageHeader
        title={program.name}
        description={program.description ?? undefined}
        action={<StatusBadge status={program.status} />}
      />

      <Card className="mb-sp-4">
        <CardHeader>
          <CardTitle>Give an award</CardTitle>
        </CardHeader>
        <CardContent>
          <AwardForm
            action={giveRecognitionAward}
            programId={program.id}
            members={members}
          />
        </CardContent>
      </Card>

      <h2 className="mb-sp-3 text-h2 font-bold text-ink">Winners</h2>
      {awards.length === 0 ? (
        <EmptyState
          title="No winners yet"
          description="Record the first winner of this program above."
        />
      ) : (
        <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
          {awards.map((a) => (
            <RecognitionCard key={a.id} award={a} />
          ))}
        </div>
      )}
    </>
  );
}
