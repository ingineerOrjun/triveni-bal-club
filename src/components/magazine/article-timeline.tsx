import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArticleStatus } from "@/types/database";

/** Linear editorial workflow indicator (draft → review → approved → published). */
const STEPS: { key: ArticleStatus; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "review", label: "Review" },
  { key: "approved", label: "Approved" },
  { key: "published", label: "Published" },
];

const ORDER: Record<ArticleStatus, number> = {
  draft: 0,
  revision_required: 0,
  review: 1,
  approved: 2,
  scheduled: 2,
  published: 3,
  archived: 3,
};

export function ArticleTimeline({ status }: { status: ArticleStatus }) {
  const current = ORDER[status];
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Editorial progress">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-caption font-heading font-semibold",
                done && "border-transparent bg-success-bg text-emerald-700",
                active && "border-transparent bg-primary text-on-primary",
                !done && !active && "border-line bg-background-subtle text-soft"
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check className="size-3.5" /> : <span className="font-bold">{i + 1}</span>}
              {step.label}
            </span>
            {i < STEPS.length - 1 ? <span aria-hidden className="h-px w-4 bg-line-strong" /> : null}
          </li>
        );
      })}
      {status === "revision_required" ? (
        <li className="text-caption font-semibold text-gold-700">· Revision requested</li>
      ) : null}
      {status === "scheduled" ? (
        <li className="text-caption font-semibold text-primary-active">· Scheduled</li>
      ) : null}
      {status === "archived" ? (
        <li className="text-caption font-semibold text-soft">· Archived</li>
      ) : null}
    </ol>
  );
}
