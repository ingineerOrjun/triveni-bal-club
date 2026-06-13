import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReviewDecision } from "@/types/database";
import type { ReviewView } from "@/lib/magazine/queries";

const DECISION: Record<ReviewDecision, { icon: typeof CheckCircle2; label: string; tone: string }> = {
  approve: { icon: CheckCircle2, label: "Approved", tone: "text-emerald-700" },
  reject: { icon: XCircle, label: "Sent back", tone: "text-danger" },
  revise: { icon: RotateCcw, label: "Revision requested", tone: "text-gold-700" },
};

/** A single editorial decision in the article's review history. */
export function EditorReviewCard({ review }: { review: ReviewView }) {
  const cfg = DECISION[review.decision];
  const Icon = cfg.icon;
  return (
    <div className="flex gap-3 rounded-md border border-line bg-surface p-sp-2">
      <Icon className={cn("size-5 shrink-0", cfg.tone)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 text-body">
          <span className={cn("font-heading font-bold", cfg.tone)}>{cfg.label}</span>
          <span className="text-soft">by {review.reviewerName ?? "Editor"}</span>
        </p>
        {review.remarks ? <p className="mt-1 text-body text-ink">{review.remarks}</p> : null}
        <p className="mt-1 text-caption text-soft">{formatDateTime(review.created_at)}</p>
      </div>
    </div>
  );
}
