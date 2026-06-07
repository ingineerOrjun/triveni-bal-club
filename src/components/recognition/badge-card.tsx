import type { BadgeRow } from "@/types/database";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgeIcon } from "@/components/recognition/badge-icon";

export interface BadgeCardProps {
  badge: BadgeRow;
  /** When true the badge is rendered as earned (full colour); else muted. */
  earned?: boolean;
  awardedAt?: string | null;
  /** "recommended" shows a pending hint. */
  pending?: boolean;
}

export function BadgeCard({
  badge,
  earned = true,
  awardedAt,
  pending = false,
}: BadgeCardProps) {
  return (
    <Card
      className={cn(
        "flex h-full flex-col items-center gap-2 p-sp-3 text-center",
        !earned && "opacity-60"
      )}
    >
      <span
        className={cn(
          "inline-flex size-16 items-center justify-center rounded-pill",
          earned
            ? "bg-accent text-on-accent shadow-sm"
            : "bg-background-subtle text-soft"
        )}
      >
        <BadgeIcon name={badge.icon} className="size-8" />
      </span>
      <h3 className="font-heading text-h3 font-bold text-ink">{badge.name}</h3>
      {badge.description ? (
        <p className="flex-1 text-body text-soft">{badge.description}</p>
      ) : (
        <div className="flex-1" />
      )}
      {badge.criteria ? (
        <p className="text-caption text-soft">
          <span className="font-semibold">How to earn:</span> {badge.criteria}
        </p>
      ) : null}
      {pending ? (
        <Badge variant="warning">Recommended</Badge>
      ) : earned && awardedAt ? (
        <Badge variant="soft">Earned {formatDate(awardedAt)}</Badge>
      ) : null}
    </Card>
  );
}
