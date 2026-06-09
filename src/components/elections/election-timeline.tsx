import { Check } from "lucide-react";
import type { ElectionStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const STEPS: { status: ElectionStatus; label: string }[] = [
  { status: "nominations", label: "Nominations" },
  { status: "voting", label: "Voting" },
  { status: "closed", label: "Counting" },
  { status: "results_published", label: "Results" },
];
const ORDER = ["draft", "nominations", "voting", "closed", "results_published", "archived"];

export function ElectionTimeline({ status }: { status: ElectionStatus }) {
  const current = ORDER.indexOf(status);
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2" aria-label="Election progress">
      {STEPS.map((step, i) => {
        const stepIdx = ORDER.indexOf(step.status);
        const done = current > stepIdx;
        const isCurrent = status === step.status;
        return (
          <li key={step.status} className="flex items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-caption font-semibold",
                done && "bg-primary-soft text-primary-active",
                isCurrent && "bg-primary text-on-primary",
                !done && !isCurrent && "bg-background-subtle text-soft"
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              {done ? <Check className="size-3.5" /> : null} {step.label}
            </span>
            {i < STEPS.length - 1 ? <span aria-hidden className="h-px w-3 bg-line-strong" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
