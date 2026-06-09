import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { ElectionStatus, NominationStatus } from "@/types/database";

const ELECTION: Record<ElectionStatus, { variant: BadgeProps["variant"]; label: string }> = {
  draft: { variant: "neutral", label: "Draft" },
  nominations: { variant: "soft", label: "Nominations open" },
  voting: { variant: "warning", label: "Voting open" },
  closed: { variant: "neutral", label: "Voting closed" },
  results_published: { variant: "success", label: "Results published" },
  archived: { variant: "neutral", label: "Archived" },
};

const NOMINATION: Record<NominationStatus, { variant: BadgeProps["variant"]; label: string }> = {
  draft: { variant: "neutral", label: "Draft" },
  submitted: { variant: "soft", label: "Submitted" },
  under_review: { variant: "warning", label: "Under review" },
  approved: { variant: "success", label: "Approved" },
  rejected: { variant: "danger", label: "Rejected" },
  withdrawn: { variant: "neutral", label: "Withdrawn" },
};

export function ElectionStatusBadge({ status }: { status: ElectionStatus }) {
  const s = ELECTION[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function NominationStatusBadge({ status }: { status: NominationStatus }) {
  const s = NOMINATION[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
