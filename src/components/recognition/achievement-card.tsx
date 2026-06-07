import { CalendarDays, UserRound } from "lucide-react";
import type { AchievementView } from "@/lib/recognition/queries";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  VisibilityBadge,
  AwardStatusBadge,
} from "@/components/recognition/recognition-badges";

export interface AchievementCardProps {
  achievement: AchievementView;
  /** Show recipient name (admin/hall-of-fame contexts). */
  showRecipient?: boolean;
  /** Show visibility + status badges (admin/owner contexts). */
  showMeta?: boolean;
}

export function AchievementCard({
  achievement,
  showRecipient = false,
  showMeta = false,
}: AchievementCardProps) {
  return (
    <Card className="flex h-full flex-col gap-2 p-sp-3">
      <div className="flex flex-wrap items-center gap-2">
        {achievement.category ? (
          <Badge variant="soft">{achievement.category.name}</Badge>
        ) : null}
        {showMeta ? (
          <>
            <VisibilityBadge visibility={achievement.visibility} />
            {achievement.status !== "awarded" ? (
              <AwardStatusBadge status={achievement.status} />
            ) : null}
          </>
        ) : null}
      </div>

      <h3 className="font-heading text-h3 font-bold text-ink">
        {achievement.title}
      </h3>
      {achievement.description ? (
        <p className="flex-1 text-body text-soft">{achievement.description}</p>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex flex-wrap items-center gap-x-sp-3 gap-y-1 pt-sp-1 text-caption text-soft">
        {showRecipient && achievement.member ? (
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-4" /> {achievement.member.full_name}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-4" />
          <time dateTime={achievement.award_date}>
            {formatDate(achievement.award_date)}
          </time>
        </span>
      </div>
    </Card>
  );
}
