import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { listBadges, listMemberBadges } from "@/lib/recognition/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { BadgeCard } from "@/components/recognition/badge-card";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "My badges",
  robots: { index: false, follow: false },
};

export default async function PortalBadgesPage() {
  const user = await getCurrentUser();
  const [allBadges, memberBadges] = await Promise.all([
    listBadges(true),
    user ? listMemberBadges(user.id) : Promise.resolve([]),
  ]);

  const earnedAt = new Map(memberBadges.map((mb) => [mb.badge_id, mb.awarded_at]));
  const earnedCount = earnedAt.size;

  return (
    <>
      <PortalPageHeader
        title="My badges"
        description="Earn badges automatically by taking part — and unlock the rest."
      />

      <Card className="mb-sp-4">
        <CardContent className="flex items-center gap-sp-3 p-sp-3">
          <span className="font-display text-display font-extrabold text-accent-active">
            {earnedCount}
          </span>
          <span className="text-body text-soft">
            of {allBadges.length} badges earned
          </span>
        </CardContent>
      </Card>

      <div className="grid gap-sp-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {allBadges.map((badge) => {
          const awardedAt = earnedAt.get(badge.id) ?? null;
          return (
            <BadgeCard
              key={badge.id}
              badge={badge}
              earned={Boolean(awardedAt)}
              awardedAt={awardedAt}
            />
          );
        })}
      </div>
    </>
  );
}
