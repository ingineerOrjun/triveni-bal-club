import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/format";
import { listArticles } from "@/lib/magazine/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArticleStatusBadge } from "@/components/magazine/magazine-badges";
import { CategoryChip } from "@/components/magazine/category-chip";
import { EmptyMagazine } from "@/components/magazine/empty-magazine";

export const metadata: Metadata = { title: "Review queue", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  const [review, revision] = await Promise.all([
    listArticles({ status: "review", pageSize: 50 }),
    listArticles({ status: "revision_required", pageSize: 50 }),
  ]);
  const rows = [...review.rows, ...revision.rows];

  return (
    <>
      <PortalPageHeader
        title="Review queue"
        description="Articles submitted for editorial review and those awaiting author revisions."
      />

      {rows.length === 0 ? (
        <EmptyMagazine
          title="Nothing to review"
          description="When members submit articles for review, they'll appear here."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="flex flex-col divide-y divide-line">
              {rows.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-sp-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/magazine/articles/${a.id}`} className="font-heading font-bold text-ink hover:text-primary-active">
                        {a.title}
                      </Link>
                      <ArticleStatusBadge status={a.status} />
                      {a.categoryName ? <CategoryChip name={a.categoryName} color={a.categoryColor} /> : null}
                    </div>
                    <p className="text-caption text-soft">
                      {a.authorName ?? "Member"} · updated {formatDate(a.updated_at ?? a.created_at)}
                    </p>
                  </div>
                  <Button asChild variant="primary" size="sm">
                    <Link href={`/admin/magazine/articles/${a.id}`}><ClipboardCheck className="size-4" /> Review <ArrowRight className="size-4" /></Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
