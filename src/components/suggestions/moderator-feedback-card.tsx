import { MessageSquare } from "lucide-react";
import type { FeedbackView } from "@/lib/suggestions/queries";
import { formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/card";

export function ModeratorFeedbackCard({ feedback }: { feedback: FeedbackView }) {
  return (
    <Card className="flex gap-sp-2 p-sp-3">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-active">
        <MessageSquare className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-heading text-body font-bold text-ink">
            {feedback.moderator?.full_name ?? "Moderator"}
          </span>
          <time dateTime={feedback.created_at} className="text-caption text-soft">
            {formatDateTime(feedback.created_at)}
          </time>
        </div>
        <p className="mt-1 whitespace-pre-line text-body text-soft">
          {feedback.body}
        </p>
      </div>
    </Card>
  );
}
