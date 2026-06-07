import Image from "next/image";
import { LogIn, LogOut } from "lucide-react";
import type { ActivityWithCategory } from "@/lib/activities/queries";
import { joinActivity, leaveActivity } from "@/lib/activities/actions";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/shared/action-button";

/** Portal activity card with join / leave controls. */
export function ActivityItem({
  activity,
  joined,
}: {
  activity: ActivityWithCategory;
  joined: boolean;
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {activity.cover_url ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-background-subtle">
          <Image
            src={activity.cover_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-2 p-sp-3">
        <div className="flex items-center justify-between gap-2">
          {activity.category ? (
            <Badge variant="soft">{activity.category.name}</Badge>
          ) : (
            <span />
          )}
          {joined ? <Badge variant="success">Joined</Badge> : null}
        </div>
        <h3 className="font-heading text-h3 font-bold text-ink">
          {activity.title}
        </h3>
        {activity.description ? (
          <p className="line-clamp-2 flex-1 text-body text-soft">
            {activity.description}
          </p>
        ) : (
          <div className="flex-1" />
        )}
        {activity.starts_on ? (
          <p className="text-caption text-soft">
            Starts {formatDate(activity.starts_on)}
          </p>
        ) : null}
        <div className="pt-sp-1">
          {joined ? (
            <ActionButton
              action={leaveActivity.bind(null, activity.id)}
              variant="outline"
            >
              <LogOut className="size-4" /> Leave
            </ActionButton>
          ) : (
            <ActionButton
              action={joinActivity.bind(null, activity.id)}
              variant="primary"
            >
              <LogIn className="size-4" /> Join activity
            </ActionButton>
          )}
        </div>
      </div>
    </Card>
  );
}
