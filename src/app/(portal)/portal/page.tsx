import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarRange,
  GraduationCap,
  Trophy,
  UserRound,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import type { MembershipStatus } from "@/types/database";
import { getFeaturedActivities } from "@/content/activities";
import { getAchievementsSorted } from "@/content/achievements";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityCard } from "@/components/cards/activity-card";
import { AchievementCard } from "@/components/cards/achievement-card";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

const STATUS_VARIANT: Record<MembershipStatus, BadgeProps["variant"]> = {
  active: "success",
  pending: "warning",
  suspended: "danger",
  alumni: "neutral",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = user?.fullName.split(" ")[0] ?? "Member";
  const status = user?.profile?.membershipStatus ?? "active";

  // Placeholder data sourced from the public content layer for now.
  const activities = getFeaturedActivities(3);
  const achievements = getAchievementsSorted().slice(0, 2);

  return (
    <>
      {/* Welcome card */}
      <Card className="mb-sp-4 overflow-hidden">
        <div className="relative bg-ink p-sp-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_100%_0%,var(--emerald-700)_0%,transparent_60%)] opacity-50"
          />
          <div className="relative flex flex-col gap-2">
            <p className="font-heading text-caption font-bold uppercase tracking-wide text-emerald-300">
              Welcome back
            </p>
            <h2 className="text-h1 font-extrabold text-ink-inverse">
              Namaste, {firstName} 👋
            </h2>
            <p className="max-w-lg text-lead text-slate-300">
              Here&apos;s what&apos;s happening in the club. Keep up the great work!
            </p>
            <div className="mt-sp-2 flex flex-wrap gap-sp-2">
              <Button asChild variant="accent">
                <Link href="/portal/profile">
                  Edit profile <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-navy-600 bg-transparent text-ink-inverse hover:bg-navy-700"
              >
                <Link href="/portal/activities">My activities</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Membership status */}
      <div className="mb-sp-4 grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<BadgeCheck className="size-5" />}
          label="Membership"
          value={
            <Badge variant={STATUS_VARIANT[status]} className="capitalize">
              {status}
            </Badge>
          }
        />
        <StatCard
          icon={<GraduationCap className="size-5" />}
          label="Class"
          value={
            <span className="font-heading text-h3 font-bold text-ink">
              {user?.profile?.classLevel ?? "—"}
              {user?.profile?.section ? ` · ${user.profile.section}` : ""}
            </span>
          }
        />
        <StatCard
          icon={<UserRound className="size-5" />}
          label="Member since"
          value={
            <span className="font-heading text-h3 font-bold text-ink">
              {user?.profile?.joinedOn
                ? formatDate(user.profile.joinedOn)
                : "—"}
            </span>
          }
        />
        <StatCard
          icon={<Trophy className="size-5" />}
          label="Achievements"
          value={
            <span className="font-heading text-h3 font-bold text-ink">
              {achievements.length}
            </span>
          }
        />
      </div>

      {/* Recent activities */}
      <section className="mb-sp-4">
        <SectionTitle
          icon={<CalendarRange className="size-5" />}
          title="Recent activities"
          href="/portal/activities"
        />
        <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((a) => (
            <ActivityCard key={a.slug} activity={a} />
          ))}
        </div>
      </section>

      {/* Recent achievements */}
      <section>
        <SectionTitle
          icon={<Trophy className="size-5" />}
          title="Recent achievements"
          href="/portal/achievements"
        />
        <div className="grid gap-sp-3 sm:grid-cols-2">
          {achievements.map((a) => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      </section>

      <p className="mt-sp-4 text-caption text-soft">
        Showing sample data — live data arrives as features are connected.
      </p>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-sp-3">
        <span className="inline-flex size-10 items-center justify-center rounded-md bg-primary-soft text-primary-active">
          {icon}
        </span>
        <span className="text-caption font-semibold uppercase tracking-wide text-soft">
          {label}
        </span>
        <div>{value}</div>
      </CardContent>
    </Card>
  );
}

function SectionTitle({
  icon,
  title,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  href: string;
}) {
  return (
    <div className="mb-sp-3 flex items-center justify-between">
      <h2 className="inline-flex items-center gap-2 text-h2 font-bold text-ink">
        <span className="text-primary-active">{icon}</span> {title}
      </h2>
      <Button asChild variant="ghost" size="sm">
        <Link href={href}>
          View all <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
