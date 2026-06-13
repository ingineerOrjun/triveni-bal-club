import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePortalAccess } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import {
  getArticleById,
  listCategories,
  listEditions,
  listReviews,
  listVersions,
} from "@/lib/magazine/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArticleTimeline } from "@/components/magazine/article-timeline";
import { ArticleEditor } from "@/components/magazine/article-editor";
import { EditorReviewCard } from "@/components/magazine/editor-review-card";
import { VersionHistory } from "@/components/magazine/version-history";

export const metadata: Metadata = { title: "Edit article" };
export const dynamic = "force-dynamic";

export default async function EditMyArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePortalAccess(`/portal/magazine/${id}/edit`);
  const article = await getArticleById(id);
  if (!article) notFound();

  const isStaff = can(user.role, "content:moderate");
  if (article.author_id !== user.id && !isStaff) redirect("/portal/magazine");

  const locked = article.status === "review" || article.status === "approved" || article.status === "scheduled" || article.status === "published";

  const [categories, editions, reviews, versions] = await Promise.all([
    listCategories(),
    listEditions(),
    listReviews(id),
    listVersions(id),
  ]);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/portal/magazine"><ArrowLeft className="size-4" /> My magazine</Link>
      </Button>
      <PortalPageHeader title={article.title} description="Edit your article and submit it for editorial review." />

      <div className="mb-sp-4"><ArticleTimeline status={article.status} /></div>

      {reviews.length > 0 ? (
        <Card className="mb-sp-4">
          <CardHeader><CardTitle>Editor feedback</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-sp-2">
            {reviews.slice(0, 3).map((r) => <EditorReviewCard key={r.id} review={r} />)}
          </CardContent>
        </Card>
      ) : null}

      {locked && !isStaff ? (
        <div className="mb-sp-4 rounded-md border border-warning/40 bg-warning-bg/50 px-3 py-2 text-caption font-semibold text-gold-700">
          This article is {article.status === "review" ? "in review" : article.status} and is read-only.
          {article.status === "review" ? " An editor will respond soon." : ""}
        </div>
      ) : (
        <ArticleEditor article={article} categories={categories} editions={editions} scope="portal" />
      )}

      <div className="mt-sp-4">
        <VersionHistory articleId={id} versions={versions} />
      </div>
    </>
  );
}
