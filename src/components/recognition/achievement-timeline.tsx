import { Award } from "lucide-react";
import type { AchievementView } from "@/lib/recognition/queries";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  VisibilityBadge,
  AwardStatusBadge,
} from "@/components/recognition/recognition-badges";
import { EmptyState } from "@/components/shared/empty-state";

/** Vertical timeline of a member's achievements (most recent first). */
export function AchievementTimeline({
  achievements,
  showMeta = false,
}: {
  achievements: AchievementView[];
  showMeta?: boolean;
}) {
  if (achievements.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="No achievements yet"
        description="Take part in club life — your achievements will appear here."
      />
    );
  }

  return (
    <ol className="relative ml-3 border-l-2 border-line">
      {achievements.map((a) => (
        <li key={a.id} className="mb-sp-4 ml-sp-3 last:mb-0">
          <span
            aria-hidden
            className="absolute -left-[13px] flex size-6 items-center justify-center rounded-pill bg-accent text-on-accent ring-4 ring-background"
          >
            <Award className="size-3.5" />
          </span>
          <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-sp-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {a.category ? <Badge variant="soft">{a.category.name}</Badge> : null}
              {showMeta ? (
                <>
                  <VisibilityBadge visibility={a.visibility} />
                  {a.status !== "awarded" ? (
                    <AwardStatusBadge status={a.status} />
                  ) : null}
                </>
              ) : null}
              <time
                dateTime={a.award_date}
                className="ml-auto text-caption text-soft"
              >
                {formatDate(a.award_date)}
              </time>
            </div>
            <h3 className="font-heading text-h3 font-bold text-ink">{a.title}</h3>
            {a.description ? (
              <p className="text-body text-soft">{a.description}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
