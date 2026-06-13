import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Eye,
  Heart,
  MessageSquare,
  Users,
  FolderOpen,
  BookOpen,
  PenSquare,
  ClipboardCheck,
  BarChart3,
  Settings,
  Newspaper,
} from "lucide-react";
import { getDashboard } from "@/lib/magazine/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArticleStatusBadge } from "@/components/magazine/magazine-badges";

export const metadata: Metadata = { title: "Magazine", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const QUICK_LINKS = [
  { href: "/admin/magazine/articles", label: "Articles", icon: FileText },
  { href: "/admin/magazine/articles/new", label: "New article", icon: PenSquare },
  { href: "/admin/magazine/review", label: "Review queue", icon: ClipboardCheck },
  { href: "/admin/magazine/editions", label: "Editions", icon: BookOpen },
  { href: "/admin/magazine/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/magazine/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/magazine/analytics", label: "Analytics", icon: BarChart3 },
];

export default async function AdminMagazinePage() {
  const d = await getDashboard();

  return (
    <>
      <PortalPageHeader
        title="Magazine"
        description="Editorial dashboard — drafts, reviews, publishing, and readership."
        action={
          <Button asChild variant="primary">
            <Link href="/admin/magazine/articles/new"><PenSquare className="size-4" /> New article</Link>
          </Button>
        }
      />

      <div className="mb-sp-4 grid grid-cols-2 gap-sp-3 lg:grid-cols-4">
        <StatCard icon={FileText} label="Drafts" value={d.byStatus.draft} tone="slate" href="/admin/magazine/articles?status=draft" />
        <StatCard icon={ClipboardCheck} label="In review" value={d.byStatus.review} tone="gold" href="/admin/magazine/review" />
        <StatCard icon={Newspaper} label="Published" value={d.byStatus.published} tone="emerald" href="/admin/magazine/articles?status=published" />
        <StatCard icon={BookOpen} label="Scheduled" value={d.byStatus.scheduled} tone="sky" href="/admin/magazine/articles?status=scheduled" />
        <StatCard icon={Eye} label="Total views" value={d.totalViews} tone="indigo" />
        <StatCard icon={Heart} label="Reactions" value={d.totalLikes} tone="rose" />
        <StatCard icon={MessageSquare} label="Comments pending" value={d.totalComments} tone="violet" href="/admin/magazine/comments" />
        <StatCard icon={Users} label="Authors" value={d.authors} tone="sky" />
      </div>

      <div className="grid gap-sp-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Editorial pipeline</CardTitle></CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1.5">
              {(["draft", "review", "revision_required", "approved", "scheduled", "published", "archived"] as const).map((s) => (
                <li
                  key={s}
                  className="flex items-center justify-between gap-2 rounded-button border border-line bg-surface-2/40 px-3 py-2"
                >
                  <ArticleStatusBadge status={s} />
                  <span className="font-display text-lead font-extrabold tabular-nums text-ink">{d.byStatus[s]}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick links</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-sp-2">
            {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-md border border-line bg-surface p-sp-2 font-heading font-semibold text-ink hover:border-line-strong hover:bg-background-subtle"
              >
                <Icon className="size-5 text-primary-active" /> {label}
              </Link>
            ))}
            <Link
              href="/admin/settings"
              className="flex items-center gap-2 rounded-md border border-line bg-surface p-sp-2 font-heading font-semibold text-ink hover:border-line-strong hover:bg-background-subtle"
            >
              <Settings className="size-5 text-primary-active" /> Settings
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
