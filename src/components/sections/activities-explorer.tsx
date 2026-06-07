"use client";

import * as React from "react";
import { LayoutGrid } from "lucide-react";
import type { Activity, ActivityCategory } from "@/content/types";
import { ACTIVITY_CATEGORIES } from "@/content/activities";
import { localize, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ActivityCard } from "@/components/cards/activity-card";
import { EmptyState } from "@/components/shared/empty-state";

export interface ActivitiesExplorerProps {
  activities: Activity[];
  locale?: Locale;
}

const ALL = "all" as const;

export function ActivitiesExplorer({
  activities,
  locale = "en",
}: ActivitiesExplorerProps) {
  const [active, setActive] = React.useState<ActivityCategory | typeof ALL>(ALL);

  // Only show categories that actually have activities.
  const available = ACTIVITY_CATEGORIES.filter((c) =>
    activities.some((a) => a.category === c.value)
  );

  const filtered =
    active === ALL ? activities : activities.filter((a) => a.category === active);

  return (
    <div className="flex flex-col gap-sp-4">
      <div
        role="tablist"
        aria-label="Filter activities by category"
        className="flex flex-wrap gap-2"
      >
        <FilterPill
          active={active === ALL}
          onClick={() => setActive(ALL)}
          label="All"
        />
        {available.map((cat) => (
          <FilterPill
            key={cat.value}
            active={active === cat.value}
            onClick={() => setActive(cat.value)}
            label={localize(cat.label, locale)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No activities in this category"
          description="Check back soon — new activities are added every term."
        />
      ) : (
        <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((activity) => (
            <ActivityCard key={activity.slug} activity={activity} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-pill border px-4 py-1.5 font-heading text-caption font-semibold transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "border-transparent bg-primary text-on-primary"
          : "border-line bg-surface text-soft hover:border-line-strong hover:text-ink"
      )}
    >
      {label}
    </button>
  );
}
