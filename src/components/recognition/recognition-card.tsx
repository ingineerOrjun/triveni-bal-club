import { Trophy, UserRound } from "lucide-react";
import type { AwardView } from "@/lib/recognition/queries";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function RecognitionCard({ award }: { award: AwardView }) {
  return (
    <Card className="flex h-full flex-col gap-2 p-sp-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex size-11 items-center justify-center rounded-md bg-accent text-on-accent">
          <Trophy className="size-5" />
        </span>
        {award.period_label ? (
          <Badge variant="soft">{award.period_label}</Badge>
        ) : null}
      </div>
      {award.program ? (
        <p className="font-heading text-caption font-bold uppercase tracking-wide text-primary-active">
          {award.program.name}
        </p>
      ) : null}
      <h3 className="font-heading text-h3 font-bold text-ink">{award.title}</h3>
      {award.member ? (
        <p className="inline-flex items-center gap-1.5 text-body font-semibold text-ink">
          <UserRound className="size-4 text-soft" /> {award.member.full_name}
        </p>
      ) : null}
      {award.note ? (
        <p className="flex-1 text-body text-soft">{award.note}</p>
      ) : (
        <div className="flex-1" />
      )}
      <p className="text-caption text-soft">{formatDate(award.awarded_at)}</p>
    </Card>
  );
}
