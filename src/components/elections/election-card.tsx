import Link from "next/link";
import { Vote, Users, ArrowRight } from "lucide-react";
import type { ElectionWithCounts } from "@/lib/elections/queries";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { ElectionStatusBadge } from "@/components/elections/election-badges";

export function ElectionCard({
  election,
  href,
}: {
  election: ElectionWithCounts;
  href: string;
}) {
  return (
    <Card interactive className="group flex h-full flex-col gap-2 p-sp-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex size-11 items-center justify-center rounded-md bg-primary-soft text-primary-active">
          <Vote className="size-5" />
        </span>
        <ElectionStatusBadge status={election.status} />
      </div>
      <h3 className="font-heading text-h3 font-bold text-ink">
        <Link href={href} className="rounded-sm hover:text-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {election.title}
        </Link>
      </h3>
      {election.description ? (
        <p className="line-clamp-2 flex-1 text-body text-soft">{election.description}</p>
      ) : (
        <div className="flex-1" />
      )}
      <div className="flex items-center justify-between text-caption text-soft">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-4" /> {election.positionCount} positions · {election.candidateCount} candidates
        </span>
        <span>{formatDate(election.created_at)}</span>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1 font-heading text-caption font-semibold text-primary-active"
      >
        View <ArrowRight className="size-4 transition-transform duration-fast group-hover:translate-x-1" />
      </Link>
    </Card>
  );
}
