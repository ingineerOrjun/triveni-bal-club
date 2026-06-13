import type { Metadata } from "next";
import { Check, X, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { listPendingComments } from "@/lib/magazine/queries";
import { moderateComment, deleteComment } from "@/lib/magazine/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ActionButton } from "@/components/shared/action-button";
import { CommentStatusBadge } from "@/components/magazine/magazine-badges";
import { EmptyMagazine } from "@/components/magazine/empty-magazine";

export const metadata: Metadata = { title: "Comments", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MagazineCommentsPage() {
  const comments = await listPendingComments();
  const pending = comments.filter((c) => c.status === "pending");
  const rest = comments.filter((c) => c.status !== "pending");
  const ordered = [...pending, ...rest];

  return (
    <>
      <PortalPageHeader
        title="Comments"
        description={`${pending.length} awaiting moderation. Approve to publish on the article.`}
      />

      {ordered.length === 0 ? (
        <EmptyMagazine title="No comments yet" description="Reader comments will appear here for moderation." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="flex flex-col divide-y divide-line">
              {ordered.map((c) => (
                <li key={c.id} className="flex flex-col gap-2 p-sp-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-caption">
                      <span className="font-heading font-bold text-ink">{c.authorName ?? "Member"}</span>
                      <CommentStatusBadge status={c.status} />
                      <span className="text-soft">{formatDateTime(c.created_at)}</span>
                    </p>
                    {c.articleTitle ? <p className="text-caption text-soft">on “{c.articleTitle}”</p> : null}
                    <p className="mt-1 whitespace-pre-wrap text-body text-ink">{c.content}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {c.status !== "approved" ? (
                      <ActionButton action={moderateComment.bind(null, c.id, "approved")} variant="primary">
                        <Check className="size-4" /> Approve
                      </ActionButton>
                    ) : null}
                    {c.status !== "rejected" ? (
                      <ActionButton action={moderateComment.bind(null, c.id, "rejected")} variant="outline">
                        <X className="size-4" /> Reject
                      </ActionButton>
                    ) : null}
                    <ActionButton action={deleteComment.bind(null, c.id)} variant="ghost" confirmMessage="Delete this comment permanently?">
                      <Trash2 className="size-4 text-danger" />
                    </ActionButton>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
