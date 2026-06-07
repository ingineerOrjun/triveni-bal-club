import { Check, X, Archive } from "lucide-react";
import type { SuggestionStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const STEPS: { status: SuggestionStatus; label: string }[] = [
  { status: "submitted", label: "Submitted" },
  { status: "under_review", label: "Under review" },
  { status: "accepted", label: "Accepted" },
  { status: "planned", label: "Planned" },
  { status: "in_progress", label: "In progress" },
  { status: "implemented", label: "Implemented" },
];

const ORDER = STEPS.map((s) => s.status);

/** Horizontal stepper showing how far a suggestion has progressed. */
export function ProgressTimeline({ status }: { status: SuggestionStatus }) {
  if (status === "rejected" || status === "archived") {
    const isRejected = status === "rejected";
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-md px-3 py-2 font-heading font-semibold",
          isRejected ? "bg-danger-bg text-danger" : "bg-background-subtle text-soft"
        )}
      >
        {isRejected ? <X className="size-4" /> : <Archive className="size-4" />}
        {isRejected ? "Not accepted" : "Archived"}
      </div>
    );
  }

  const currentIndex = Math.max(0, ORDER.indexOf(status));

  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2" aria-label="Progress">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <li key={step.status} className="flex items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-caption font-semibold",
                done && "bg-primary-soft text-primary-active",
                current && "bg-primary text-on-primary",
                !done && !current && "bg-background-subtle text-soft"
              )}
              aria-current={current ? "step" : undefined}
            >
              {done ? <Check className="size-3.5" /> : null}
              {step.label}
            </span>
            {i < STEPS.length - 1 ? (
              <span aria-hidden className="h-px w-3 bg-line-strong" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
