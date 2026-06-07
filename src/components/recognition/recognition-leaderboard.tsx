import { Award, Medal } from "lucide-react";
import type { HallOfFameEntry } from "@/lib/recognition/queries";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const RANK_COLORS = ["text-gold-500", "text-slate-400", "text-gold-700"];

export function RecognitionLeaderboard({
  entries,
}: {
  entries: HallOfFameEntry[];
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="No badges earned yet"
        description="As members earn badges, the leaderboard will fill up here."
      />
    );
  }

  return (
    <Card className="divide-y divide-line">
      <ol>
        {entries.map((entry, i) => (
          <li
            key={entry.member.id}
            className="flex items-center gap-sp-3 p-sp-3"
          >
            <span
              className={cn(
                "flex w-8 shrink-0 items-center justify-center font-display text-h3 font-extrabold",
                i < 3 ? RANK_COLORS[i] : "text-soft"
              )}
              aria-label={`Rank ${i + 1}`}
            >
              {i < 3 ? <Medal className="size-6" /> : i + 1}
            </span>
            <Avatar size="sm">
              <AvatarFallback>{initials(entry.member.full_name)}</AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate font-heading font-bold text-ink">
              {entry.member.full_name}
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-primary-active">
              <Award className="size-4" /> {entry.badgeCount}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
