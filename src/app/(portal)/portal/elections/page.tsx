import type { Metadata } from "next";
import Link from "next/link";
import { Vote, ArrowRight, Megaphone } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listElections, listMyNominations } from "@/lib/elections/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ElectionStatusBadge, NominationStatusBadge } from "@/components/elections/election-badges";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Elections", robots: { index: false, follow: false } };

export default async function PortalElectionsPage() {
  const user = await getCurrentUser();
  const [elections, myNoms] = await Promise.all([
    listElections(),
    user ? listMyNominations(user.id) : Promise.resolve([]),
  ]);
  const active = elections.filter((e) => e.status !== "draft");

  return (
    <>
      <PortalPageHeader title="Elections" description="Vote, stand for election, and follow the results." />

      {active.length === 0 ? (
        <EmptyState icon={Vote} title="No elections right now" description="Check back when an election opens." />
      ) : (
        <div className="flex flex-col gap-sp-3">
          {active.map((e) => (
            <Card key={e.id}>
              <CardContent className="flex flex-col gap-sp-2 p-sp-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/portal/elections/${e.slug}`} className="font-heading text-h3 font-bold text-ink hover:text-primary-active">
                    {e.title}
                  </Link>
                  <p className="text-caption text-soft">{e.positionCount} positions · {e.candidateCount} candidates</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ElectionStatusBadge status={e.status} />
                  {e.status === "nominations" ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/portal/elections/${e.slug}/nominate`}>
                        <Megaphone className="size-4" /> Stand
                      </Link>
                    </Button>
                  ) : null}
                  {e.status === "voting" ? (
                    <Button asChild variant="primary" size="sm">
                      <Link href={`/portal/elections/${e.slug}`}>
                        <Vote className="size-4" /> Vote
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/portal/elections/${e.slug}`}>
                        View <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {myNoms.length > 0 ? (
        <section className="mt-sp-5">
          <h2 className="mb-sp-3 text-h2 font-bold text-ink">My nominations</h2>
          <div className="flex flex-col gap-sp-2">
            {myNoms.map((n) => (
              <Card key={n.id}>
                <CardContent className="flex items-center justify-between gap-2 p-sp-3">
                  <span className="text-body text-ink">{n.slogan || "Nomination"}</span>
                  <NominationStatusBadge status={n.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
