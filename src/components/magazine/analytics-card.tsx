import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NamedCount } from "@/lib/magazine/queries";
import { EmptyMagazine } from "./empty-magazine";

/** Ranked list widget (popular categories / authors / editions). */
export function AnalyticsCard({
  title,
  icon: Icon,
  items,
  unit = "views",
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: NamedCount[];
  unit?: string;
}) {
  const max = items.reduce((m, i) => Math.max(m, i.value), 0) || 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon ? <Icon className="size-5 text-primary-active" /> : null}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-body text-soft">No data yet.</p>
        ) : (
          <ul className="flex flex-col gap-sp-2">
            {items.map((item) => (
              <li key={item.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 text-body">
                  <span className="truncate font-semibold text-ink">{item.name}</span>
                  <span className="shrink-0 text-caption text-soft">
                    {item.value.toLocaleString()} {unit}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-pill bg-background-subtle">
                  <div
                    className="h-full rounded-pill bg-primary"
                    style={{ width: `${Math.max(4, Math.round((item.value / max) * 100))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Re-export for screens that want the magazine empty state alongside cards. */
export { EmptyMagazine };
