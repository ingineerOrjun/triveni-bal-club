import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Tag as TagIcon, UserRound, EyeOff, Archive } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getSuggestionDetail,
  listAssignableModerators,
  listMergeCandidates,
} from "@/lib/suggestions/queries";
import { archiveSuggestion } from "@/lib/suggestions/actions";
import { formatDate } from "@/lib/format";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SuggestionStatusBadge,
  SuggestionPriorityBadge,
} from "@/components/suggestions/suggestion-status-badge";
import { ProgressTimeline } from "@/components/suggestions/progress-timeline";
import { SuggestionTimeline } from "@/components/suggestions/suggestion-timeline";
import { ModeratorFeedbackCard } from "@/components/suggestions/moderator-feedback-card";
import {
  StatusChangeForm,
  TriageForm,
  FeedbackForm,
  MergeForm,
} from "@/components/suggestions/staff-forms";
import { ActionButton } from "@/components/shared/action-button";

export const metadata: Metadata = {
  title: "Review suggestion",
  robots: { index: false, follow: false },
};

export default async function AdminSuggestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const s = user ? await getSuggestionDetail(id, user.id) : null;
  if (!s) notFound();

  const isAdmin = user?.role === "admin";
  const [moderators, mergeCandidates] = await Promise.all([
    listAssignableModerators(),
    isAdmin ? listMergeCandidates(id) : Promise.resolve([]),
  ]);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/admin/suggestions">
          <ArrowLeft className="size-4" /> All suggestions
        </Link>
      </Button>

      <PortalPageHeader
        title={s.title}
        action={
          <ActionButton
            action={archiveSuggestion.bind(null, id)}
            variant="outline"
            confirmMessage="Archive this suggestion?"
          >
            <Archive className="size-4" /> Archive
          </ActionButton>
        }
      />

      <div className="grid gap-sp-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Left: content + feedback */}
        <div className="flex flex-col gap-sp-4">
          <Card>
            <CardContent className="flex flex-col gap-sp-3 p-sp-4">
              <div className="flex flex-wrap items-center gap-2">
                {s.category ? <Badge variant="soft">{s.category.name}</Badge> : null}
                <SuggestionStatusBadge status={s.status} />
                <SuggestionPriorityBadge priority={s.priority} />
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
              <p className="inline-flex items-center gap-1.5 text-caption text-soft">
                {s.is_anonymous ? (
                  <EyeOff className="size-4" />
                ) : (
                  <UserRound className="size-4" />
                )}
                {s.author?.full_name ?? "Member"}
                {s.is_anonymous ? " (anonymous — staff view)" : ""} ·{" "}
                {formatDate(s.created_at)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Moderator feedback</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-sp-3">
              <FeedbackForm id={id} />
              {s.feedback.length > 0 ? (
                <div className="flex flex-col gap-sp-2">
                  {s.feedback.map((f) => (
                    <ModeratorFeedbackCard key={f.id} feedback={f} />
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Right: workflow */}
        <aside className="flex flex-col gap-sp-4">
          <Card>
            <CardHeader>
              <CardTitle>Change status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusChangeForm id={id} current={s.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Triage</CardTitle>
            </CardHeader>
            <CardContent>
              <TriageForm
                id={id}
                current={{
                  priority: s.priority,
                  assigned_to: s.assigned_to,
                  estimated_completion: s.estimated_completion,
                  moderator_notes: s.moderator_notes,
                }}
                moderators={moderators}
              />
            </CardContent>
          </Card>

          {isAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle>Merge duplicate</CardTitle>
              </CardHeader>
              <CardContent>
                <MergeForm sourceId={id} candidates={mergeCandidates} />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
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
