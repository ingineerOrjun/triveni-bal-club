import type * as React from "react";
import Image from "next/image";
import { Award, Medal, Trophy, GraduationCap, Sparkles, Flag } from "lucide-react";
import type { Achievement, AchievementType } from "@/content/types";
import { localize, type Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TYPE_META: Record<
  AchievementType,
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  competition: { icon: Trophy, label: "Competition" },
  academic: { icon: GraduationCap, label: "Academic" },
  sports: { icon: Medal, label: "Sports" },
  arts: { icon: Sparkles, label: "Arts" },
  club: { icon: Award, label: "Club" },
  milestone: { icon: Flag, label: "Milestone" },
};

export interface AchievementCardProps {
  achievement: Achievement;
  locale?: Locale;
}

export function AchievementCard({
  achievement,
  locale = "en",
}: AchievementCardProps) {
  const title = localize(achievement.title, locale);
  const description = localize(achievement.description, locale);
  const recipient = achievement.recipient
    ? localize(achievement.recipient, locale)
    : undefined;
  const meta = TYPE_META[achievement.type];
  const Icon = meta.icon;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {achievement.image ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={achievement.image.src}
            alt={achievement.image.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
          <span className="absolute left-3 top-3 inline-flex size-10 items-center justify-center rounded-md bg-accent text-on-accent shadow-sm">
            <Icon className="size-5" />
          </span>
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-2 p-sp-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="soft">{meta.label}</Badge>
          <time
            dateTime={achievement.awardedOn}
            className="text-caption text-soft"
          >
            {formatDate(achievement.awardedOn)}
          </time>
        </div>
        <h3 className="font-heading text-h3 font-bold text-ink">{title}</h3>
        <p className="flex-1 text-body text-soft">{description}</p>
        {recipient ? (
          <p className="text-caption font-semibold text-primary-active">
            {recipient}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
