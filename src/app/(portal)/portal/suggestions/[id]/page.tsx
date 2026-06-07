import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Tag as TagIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getSuggestionDetail } from "@/lib/suggestions/queries";
import { formatDate } from "@/lib/format";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SuggestionStatusBadge } from "@/components/suggestions/suggestion-status-badge";
import { SuggestionVoteButton } from "@/components/suggestions/suggestion-vote-button";
import { ProgressTimeline } from "@/components/suggestions/progress-timeline";
import { SuggestionTimeline } from "@/components/suggestions/suggestion-timeline";
import { ModeratorFeedbackCard } from "@/components/suggestions/moderator-feedback-card";

export const metadata: Metadata = {
  title: "Suggestion",
  robots: { index: false, follow: false },
};

export default async function PortalSuggestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const s = user ? await getSuggestionDetail(id, user.id) : null;
  if (!s) notFound();

  const isOwn = s.author_id === user?.id;
  const canVote = !isOwn && s.status !== "draft";

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/portal/suggestions">
          <ArrowLeft className="size-4" /> Back to suggestions
        </Link>
      </Button>

      <PortalPageHeader
        title={s.title}
        action={
          isOwn && s.status === "draft" ? (
            <Button asChild variant="primary">
              <Link href={`/portal/suggestions/${s.id}/edit`}>
                <Pencil className="size-4" /> Edit draft
              </Link>
            </Button>
          ) : (
            <SuggestionVoteButton
              suggestionId={s.id}
              supported={s.supported}
              count={s.support_count}
              disabled={!canVote}
            />
          )
        }
      />

      <div className="grid gap-sp-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-sp-4">
          <Card>
            <CardContent className="flex flex-col gap-sp-3 p-sp-4">
              <div className="flex flex-wrap items-center gap-2">
                {s.category ? <Badge variant="soft">{s.category.name}</Badge> : null}
                <SuggestionStatusBadge status={s.status} />
              </div>
              <ProgressTimeline status={s.status} />
              <p className="whitespace-pre-line text-body text-ink">
                {s.description}
              </p>
              {s.tags.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {s.tags.map((t) => (
                    <li
                      key={t.id}
                      className="inline-flex items-center gap-1 rounded-pill bg-background-subtle px-2 py-0.5 text-caption text-soft"
                    >
                      <TagIcon className="size-3" /> {t.name}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="text-caption text-soft">
                Shared {formatDate(s.created_at)}
                {s.is_anonymous ? " · anonymous" : ""}
              </p>
            </CardContent>
          </Card>

          <section>
            <h2 className="mb-sp-2 text-h3 font-bold text-ink">Moderator feedback</h2>
            {s.feedback.length === 0 ? (
              <p className="text-body text-soft">No feedback yet.</p>
            ) : (
              <div className="flex flex-col gap-sp-2">
                {s.feedback.map((f) => (
                  <ModeratorFeedbackCard key={f.id} feedback={f} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>Progress history</CardTitle>
            </CardHeader>
            <CardContent>
              <SuggestionTimeline history={s.history} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
