import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { ArticleStatus, MagazineCommentStatus } from "@/types/database";

const ARTICLE: Record<ArticleStatus, { variant: BadgeProps["variant"]; label: string }> = {
  draft: { variant: "neutral", label: "Draft" },
  review: { variant: "warning", label: "In review" },
  revision_required: { variant: "warning", label: "Revision needed" },
  approved: { variant: "success", label: "Approved" },
  scheduled: { variant: "accent", label: "Scheduled" },
  published: { variant: "success", label: "Published" },
  archived: { variant: "neutral", label: "Archived" },
};

export function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  const cfg = ARTICLE[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

const COMMENT: Record<MagazineCommentStatus, { variant: BadgeProps["variant"]; label: string }> = {
  pending: { variant: "warning", label: "Pending" },
  approved: { variant: "success", label: "Approved" },
  rejected: { variant: "danger", label: "Rejected" },
};

export function CommentStatusBadge({ status }: { status: MagazineCommentStatus }) {
  const cfg = COMMENT[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
