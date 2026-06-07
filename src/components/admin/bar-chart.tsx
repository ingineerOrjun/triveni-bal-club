import { cn } from "@/lib/utils";

export interface BarDatum {
  label: string;
  value: number;
}

/**
 * Lightweight, dependency-free horizontal bar chart. Accessible: rendered as a
 * description list with text values (screen readers read label + value).
 */
export function BarChart({
  data,
  accent = "primary",
}: {
  data: BarDatum[];
  accent?: "primary" | "accent";
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <dl className="flex flex-col gap-sp-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-sp-2">
          <dt className="w-28 shrink-0 truncate text-caption capitalize text-soft">
            {d.label}
          </dt>
          <dd className="flex flex-1 items-center gap-2">
            <div className="h-2.5 flex-1 overflow-hidden rounded-pill bg-background-subtle">
              <div
                className={cn(
                  "h-full rounded-pill",
                  accent === "primary" ? "bg-primary" : "bg-accent"
                )}
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right text-caption font-semibold text-ink">
              {d.value}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
