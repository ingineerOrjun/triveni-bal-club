import Image from "next/image";
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import type { Activity } from "@/content/types";
import { ACTIVITY_CATEGORIES } from "@/content/activities";
import { localize, type Locale } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface ActivityCardProps {
  activity: Activity;
  locale?: Locale;
}

export function ActivityCard({ activity, locale = "en" }: ActivityCardProps) {
  const title = localize(activity.title, locale);
  const summary = localize(activity.summary, locale);
  const category = ACTIVITY_CATEGORIES.find((c) => c.value === activity.category);

  return (
    <Card interactive className="group flex h-full flex-col overflow-hidden">
      <Link
        href={`/activities/${activity.slug}`}
        className="flex h-full flex-col focus-visible:outline-none"
        aria-label={title}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={activity.image.src}
            alt={activity.image.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-base ease-out group-hover:scale-105"
          />
          {category ? (
            <Badge variant="primary" className="absolute left-3 top-3 shadow-sm">
              {localize(category.label, locale)}
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-sp-3">
          <h3 className="font-heading text-h3 font-bold text-ink">{title}</h3>
          <p className="line-clamp-2 flex-1 text-body text-soft">{summary}</p>
          <div className="mt-sp-1 flex items-center justify-between">
            {typeof activity.participants === "number" ? (
              <span className="inline-flex items-center gap-1.5 text-caption text-soft">
                <Users className="size-4" /> {activity.participants} members
              </span>
            ) : (
              <span />
            )}
            <span className="inline-flex items-center gap-1 font-heading text-caption font-semibold text-primary-active">
              Learn more
              <ArrowRight className="size-4 transition-transform duration-fast group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
