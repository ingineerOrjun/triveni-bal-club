import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { SuggestionStatus, SuggestionPriority } from "@/types/database";

const STATUS: Record<
  SuggestionStatus,
  { variant: BadgeProps["variant"]; label: string }
> = {
  draft: { variant: "neutral", label: "Draft" },
  submitted: { variant: "soft", label: "Submitted" },
  under_review: { variant: "warning", label: "Under review" },
  accepted: { variant: "success", label: "Accepted" },
  planned: { variant: "soft", label: "Planned" },
  in_progress: { variant: "warning", label: "In progress" },
  implemented: { variant: "success", label: "Implemented" },
  rejected: { variant: "danger", label: "Rejected" },
  archived: { variant: "neutral", label: "Archived" },
};

const PRIORITY: Record<
  SuggestionPriority,
  { variant: BadgeProps["variant"]; label: string }
> = {
  low: { variant: "neutral", label: "Low" },
  medium: { variant: "soft", label: "Medium" },
  high: { variant: "warning", label: "High" },
  critical: { variant: "danger", label: "Critical" },
};

export function SuggestionStatusBadge({ status }: { status: SuggestionStatus }) {
  const s = STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function SuggestionPriorityBadge({
  priority,
}: {
  priority: SuggestionPriority;
}) {
  const p = PRIORITY[priority];
  return <Badge variant={p.variant}>{p.label}</Badge>;
}

export { STATUS as SUGGESTION_STATUS_META };
