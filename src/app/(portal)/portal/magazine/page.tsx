import type { Metadata } from "next";
import Link from "next/link";
import { PenSquare, Eye, Heart, FileText, Bookmark, Pencil, UserRound } from "lucide-react";
import { requirePortalAccess } from "@/lib/auth/session";
import { listMyArticles, listMyBookmarks, listMyLiked } from "@/lib/magazine/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArticleStatusBadge } from "@/components/magazine/magazine-badges";
import { MagazineGrid } from "@/components/magazine/magazine-grid";
import { EmptyMagazine } from "@/components/magazine/empty-magazine";

export const metadata: Metadata = { title: "My magazine" };
export const dynamic = "force-dynamic";

export default async function PortalMagazinePage() {
  const user = await requirePortalAccess("/portal/magazine");
  const [mine, bookmarks, liked] = await Promise.all([
    listMyArticles(user.id),
    listMyBookmarks(user.id),
    listMyLiked(user.id),
  ]);

  const published = mine.filter((a) => a.status === "published").length;
  const totalViews = mine.reduce((s, a) => s + Number(a.views), 0);
  const totalLikes = mine.reduce((s, a) => s + Number(a.likes), 0);

  return (
    <>
      <PortalPageHeader
        title="My magazine"
        description="Write articles, track their editorial status, and revisit what you've saved."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/portal/magazine/profile"><UserRound className="size-4" /> My author profile</Link>
            </Button>
            <Button asChild variant="primary">
              <Link href="/portal/magazine/new"><PenSquare className="size-4" /> Write an article</Link>
            </Button>
          </div>
        }
      />

      <div className="mb-sp-4 grid grid-cols-2 gap-sp-3 sm:grid-cols-4">
        <StatCard icon={FileText} label="My articles" value={mine.length} />
        <StatCard icon={PenSquare} label="Published" value={published} accent="accent" />
        <StatCard icon={Eye} label="Total views" value={totalViews} />
        <StatCard icon={Heart} label="Total reactions" value={totalLikes} />
      </div>

      <Card className="mb-sp-4">
        <CardHeader><CardTitle>My articles</CardTitle></CardHeader>
        <CardContent>
          {mine.length === 0 ? (
            <EmptyMagazine
              title="No articles yet"
              description="Start writing — your drafts and submissions will appear here."
              action={
                <Button asChild variant="primary"><Link href="/portal/magazine/new">Write your first article</Link></Button>
              }
            />
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {mine.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-heading font-bold text-ink">{a.title}</p>
                    <p className="flex flex-wrap items-center gap-x-3 text-caption text-soft">
                      <span className="inline-flex items-center gap-1"><Eye className="size-3.5" /> {a.views}</span>
                      <span className="inline-flex items-center gap-1"><Heart className="size-3.5" /> {a.likes}</span>
                      {a.editionTitle ? <span>{a.editionTitle}</span> : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArticleStatusBadge status={a.status} />
                    {a.status === "published" ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/magazine/article/${a.slug}`}><Eye className="size-4" /> View</Link>
                      </Button>
                    ) : null}
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/portal/magazine/${a.id}/edit`}><Pencil className="size-4" /> Edit</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <section className="mb-sp-4">
        <h2 className="mb-sp-3 flex items-center gap-2 text-h2 font-bold text-ink">
          <Bookmark className="size-6 text-primary-active" /> Saved articles
        </h2>
        <MagazineGrid
          articles={bookmarks}
          emptyTitle="Nothing saved yet"
          emptyDescription="Bookmark stories while reading to find them here."
        />
      </section>

      <section>
        <h2 className="mb-sp-3 flex items-center gap-2 text-h2 font-bold text-ink">
          <Heart className="size-6 text-accent-active" /> Liked stories
        </h2>
        <MagazineGrid
          articles={liked}
          emptyTitle="No reactions yet"
          emptyDescription="Stories you react to will appear here."
        />
      </section>
    </>
  );
}
