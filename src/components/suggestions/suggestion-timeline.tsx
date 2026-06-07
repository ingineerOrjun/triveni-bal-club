import { History } from "lucide-react";
import type { HistoryView } from "@/lib/suggestions/queries";
import { formatDateTime } from "@/lib/format";
import { SuggestionStatusBadge } from "@/components/suggestions/suggestion-status-badge";

/** Vertical log of every status change (with reason + who changed it). */
export function SuggestionTimeline({ history }: { history: HistoryView[] }) {
  if (history.length === 0) {
    return (
      <p className="inline-flex items-center gap-2 text-body text-soft">
        <History className="size-4" /> No status changes yet.
      </p>
    );
  }

  return (
    <ol className="relative ml-3 border-l-2 border-line">
      {history.map((h) => (
        <li key={h.id} className="mb-sp-3 ml-sp-3 last:mb-0">
          <span
            aria-hidden
            className="absolute -left-[7px] size-3 rounded-pill bg-primary ring-4 ring-background"
          />
          <div className="flex flex-wrap items-center gap-2">
            <SuggestionStatusBadge status={h.new_status} />
            <time dateTime={h.created_at} className="text-caption text-soft">
              {formatDateTime(h.created_at)}
            </time>
          </div>
          {h.reason ? (
            <p className="mt-1 text-body text-ink">{h.reason}</p>
          ) : null}
          {h.changedBy ? (
            <p className="text-caption text-soft">by {h.changedBy.full_name}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
