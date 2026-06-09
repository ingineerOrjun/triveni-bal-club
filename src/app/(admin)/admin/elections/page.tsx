import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Vote } from "lucide-react";
import { listElections } from "@/lib/elections/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ElectionStatusBadge } from "@/components/elections/election-badges";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Elections", robots: { index: false, follow: false } };

export default async function AdminElectionsPage() {
  const elections = await listElections();
  return (
    <>
      <PortalPageHeader
        title="Elections"
        description="Run nominations, voting, results, and committee generation."
        action={
          <Button asChild variant="primary">
            <Link href="/admin/elections/new"><Plus className="size-4" /> New election</Link>
          </Button>
        }
      />
      {elections.length === 0 ? (
        <EmptyState icon={Vote} title="No elections yet" description="Create your first election to get started." />
      ) : (
        <div className="flex flex-col gap-sp-2">
          {elections.map((e) => (
            <Link key={e.id} href={`/admin/elections/${e.id}`} className="group">
              <Card interactive>
                <CardContent className="flex items-center justify-between gap-sp-3 p-sp-3">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-h3 font-bold text-ink">{e.title}</p>
                    <p className="text-caption text-soft">
                      {e.positionCount} positions · {e.candidateCount} candidates · {formatDate(e.created_at)}
                    </p>
                  </div>
                  <ElectionStatusBadge status={e.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
