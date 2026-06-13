import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Send, Archive, Star, StarOff, Eye, Trash2 } from "lucide-react";
import {
  getArticleById,
  listCategories,
  listEditions,
  listReviews,
  listVersions,
} from "@/lib/magazine/queries";
import { publishArticle, archiveArticle, setFeatured, deleteArticle } from "@/lib/magazine/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionButton } from "@/components/shared/action-button";
import { ArticleStatusBadge } from "@/components/magazine/magazine-badges";
import { ArticleTimeline } from "@/components/magazine/article-timeline";
import { ArticleEditor } from "@/components/magazine/article-editor";
import { EditorReviewCard } from "@/components/magazine/editor-review-card";
import { VersionHistory } from "@/components/magazine/version-history";
import { ReviewForm, ScheduleForm } from "@/components/magazine/admin-forms";

export const metadata: Metadata = { title: "Edit article", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminArticleConsole({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) notFound();

  const [categories, editions, reviews, versions, user] = await Promise.all([
    listCategories(),
    listEditions(),
    listReviews(id),
    listVersions(id),
    getCurrentUser(),
  ]);
  const isAdmin = user?.role === "admin";

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/admin/magazine/articles"><ArrowLeft className="size-4" /> Articles</Link>
      </Button>
      <PortalPageHeader title={article.title} action={<ArticleStatusBadge status={article.status} />} />
      <div className="mb-sp-4"><ArticleTimeline status={article.status} /></div>

      {/* Workflow controls */}
      <Card className="mb-sp-4">
        <CardHeader><CardTitle>Editorial controls</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-sp-3">
          {article.status === "review" || article.status === "revision_required" ? (
            <ReviewForm articleId={id} />
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {article.status !== "published" ? (
              <ActionButton action={publishArticle.bind(null, id)} variant="primary" confirmMessage="Publish this article now?">
                <Send className="size-4" /> Publish now
              </ActionButton>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={`/magazine/article/${article.slug}`} target="_blank"><Eye className="size-4" /> View live</Link>
              </Button>
            )}
            <ActionButton
              action={setFeatured.bind(null, id, !article.featured)}
              variant="outline"
            >
              {article.featured ? <><StarOff className="size-4" /> Unfeature</> : <><Star className="size-4" /> Feature</>}
            </ActionButton>
            {article.status !== "archived" ? (
              <ActionButton action={archiveArticle.bind(null, id)} variant="ghost" confirmMessage="Archive this article?">
                <Archive className="size-4" /> Archive
              </ActionButton>
            ) : null}
            {isAdmin ? (
              <ActionButton
                action={deleteArticle.bind(null, id, "admin")}
                variant="ghost"
                confirmMessage="Permanently delete this article? This cannot be undone."
              >
                <Trash2 className="size-4 text-danger" /> Delete
              </ActionButton>
            ) : null}
          </div>

          {article.status === "approved" || article.status === "scheduled" ? (
            <div className="border-t border-line pt-sp-3">
              <p className="mb-sp-2 text-caption font-semibold text-soft">Or schedule for later</p>
              <ScheduleForm articleId={id} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Editor */}
      <ArticleEditor article={article} categories={categories} editions={editions} scope="admin" />

      {/* Review history */}
      {reviews.length > 0 ? (
        <Card className="mt-sp-4">
          <CardHeader><CardTitle>Review history</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-sp-2">
            {reviews.map((r) => <EditorReviewCard key={r.id} review={r} />)}
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-sp-4">
        <VersionHistory articleId={id} versions={versions} />
      </div>
    </>
  );
}
