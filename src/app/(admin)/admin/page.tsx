import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  UsersRound,
  Activity as ActivityIcon,
  CalendarRange,
  Lightbulb,
  FileBadge,
  BadgeCheck,
  Award,
  Trophy,
  CalendarPlus,
  Image as ImageIcon,
  UserPlus,
  ClipboardCheck,
  ArrowRight,
  Newspaper,
  MessageSquare,
  Vote,
  PenSquare,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/admin/dashboard";
import { formatDateTime } from "@/lib/format";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { BarChart } from "@/components/admin/bar-chart";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

const QUICK = [
  { label: "Create event", href: "/admin/events/new", icon: CalendarPlus },
  { label: "Create activity", href: "/admin/activities/new", icon: ActivityIcon },
  { label: "Write article", href: "/admin/magazine/articles/new", icon: PenSquare },
  { label: "New election", href: "/admin/elections/new", icon: Vote },
  { label: "Issue certificate", href: "/admin/certificates/new", icon: Award },
  { label: "New badge", href: "/admin/badges/new", icon: ImageIcon },
  { label: "Add member", href: "/admin/members", icon: UserPlus },
  { label: "Review ideas", href: "/admin/suggestions", icon: Lightbulb },
];

export default async function AdminDashboardPage() {
  const [user, data] = await Promise.all([getCurrentUser(), getDashboardData()]);
  const { stats, recentAudit, suggestionsByStatus, activitiesByStatus, recentMembers } =
    data;
  const firstName = user?.fullName.split(" ")[0] ?? "there";

  return (
    <>
      <PortalPageHeader
        title="Dashboard"
        description={`Welcome back, ${firstName}. Here's how the club is doing.`}
      />

      {/* Quick actions */}
      <div className="mb-sp-4 flex flex-wrap gap-sp-2">
        {QUICK.map((q) => (
          <Button key={q.href} asChild variant="outline" size="sm">
            <Link href={q.href}>
              <q.icon className="size-4" /> {q.label}
            </Link>
          </Button>
        ))}
      </div>

      {/* Pending approvals breakdown */}
      {stats.pendingApprovals > 0 ? (
        <Card className="mb-sp-4 border-warning/40 bg-warning-bg/40">
          <CardContent className="flex flex-col gap-sp-2 p-sp-3">
            <span className="inline-flex items-center gap-2 font-heading font-bold text-gold-700">
              <ClipboardCheck className="size-5" />
              {stats.pendingApprovals} item{stats.pendingApprovals === 1 ? "" : "s"} awaiting review
            </span>
            <div className="flex flex-wrap gap-2">
              {stats.magazineInReview > 0 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/magazine/review">
                    <Newspaper className="size-4" /> {stats.magazineInReview} article{stats.magazineInReview === 1 ? "" : "s"}
                  </Link>
                </Button>
              ) : null}
              {stats.magazineCommentsPending > 0 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/magazine/comments">
                    <MessageSquare className="size-4" /> {stats.magazineCommentsPending} comment{stats.magazineCommentsPending === 1 ? "" : "s"}
                  </Link>
                </Button>
              ) : null}
              {stats.nominationsSubmitted > 0 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/elections">
                    <Vote className="size-4" /> {stats.nominationsSubmitted} nomination{stats.nominationsSubmitted === 1 ? "" : "s"}
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="primary" size="sm">
                <Link href="/admin/approvals">
                  Open approval center <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Stat grid */}
      <div className="mb-sp-5 grid grid-cols-2 gap-sp-3 md:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Members" value={stats.members} href="/admin/members" />
        <StatCard icon={UsersRound} label="Committee" value={stats.committee} href="/committee" />
        <StatCard icon={ActivityIcon} label="Activities" value={stats.activities} href="/admin/activities" />
        <StatCard icon={CalendarRange} label="Upcoming events" value={stats.upcomingEvents} href="/admin/events" />
        <StatCard icon={Lightbulb} label="Ideas to review" value={stats.suggestionsPending} href="/admin/suggestions" accent="accent" />
        <StatCard icon={FileBadge} label="Certificates" value={stats.certificates} href="/admin/certificates" />
        <StatCard icon={BadgeCheck} label="Badges awarded" value={stats.badgesAwarded} href="/admin/badges" />
        <StatCard icon={Trophy} label="Programs" value={stats.programs} href="/admin/recognition" />
        <StatCard icon={Newspaper} label="Magazine drafts" value={stats.magazineDrafts} href="/admin/magazine/articles?status=draft" />
        <StatCard icon={ClipboardCheck} label="Articles in review" value={stats.magazineInReview} href="/admin/magazine/review" accent="accent" />
        <StatCard icon={MessageSquare} label="Comments pending" value={stats.magazineCommentsPending} href="/admin/magazine/comments" />
        <StatCard icon={Vote} label="Active elections" value={stats.activeElections} href="/admin/elections" accent="accent" />
      </div>

      {/* Analytics */}
      <div className="mb-sp-5 grid gap-sp-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Suggestions by status</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={suggestionsByStatus} accent="accent" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activities by status</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={activitiesByStatus} />
          </CardContent>
        </Card>
      </div>

      {/* Recent activity + members */}
      <div className="grid gap-sp-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent audit log</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAudit.length === 0 ? (
              <p className="text-body text-soft">No activity recorded yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {recentAudit.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="min-w-0">
                      <code className="text-caption text-ink">{a.action}</code>
                      <span className="block text-caption text-soft">
                        {a.entity_type}
                      </span>
                    </span>
                    <time className="shrink-0 text-caption text-soft" dateTime={a.created_at}>
                      {formatDateTime(a.created_at)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="ghost" size="sm" className="mt-sp-2">
              <Link href="/admin/audit">
                View full log <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Newest members</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMembers.length === 0 ? (
              <p className="text-body text-soft">No members yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {recentMembers.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 py-2">
                    <Link
                      href={`/admin/members/${m.id}`}
                      className="truncate font-semibold text-ink hover:text-primary-active"
                    >
                      {m.full_name}
                    </Link>
                    <Badge variant="neutral">{m.created_at.slice(0, 10)}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="ghost" size="sm" className="mt-sp-2">
              <Link href="/admin/members">
                All members <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
