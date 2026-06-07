import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, Trash2, BadgeCheck } from "lucide-react";
import { listBadges, listMemberOptions } from "@/lib/recognition/queries";
import { deleteBadge, awardBadgeForm } from "@/lib/recognition/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgeIcon } from "@/components/recognition/badge-icon";
import { AwardBadgePicker } from "@/components/recognition/award-badge-picker";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Manage badges",
  robots: { index: false, follow: false },
};

export default async function AdminBadgesPage() {
  const [badges, members] = await Promise.all([
    listBadges(false),
    listMemberOptions(),
  ]);
  const activeBadges = badges.filter((b) => b.is_active);

  return (
    <>
      <PortalPageHeader
        title="Badges"
        description="Manage the badge catalog and award badges to members."
        action={
          <Button asChild variant="primary">
            <Link href="/admin/badges/new">
              <Plus className="size-4" /> New badge
            </Link>
          </Button>
        }
      />

      {/* Award a badge */}
      <Card className="mb-sp-4">
        <CardHeader>
          <CardTitle>Award a badge</CardTitle>
        </CardHeader>
        <CardContent>
          <AwardBadgePicker
            action={awardBadgeForm}
            members={members}
            badges={activeBadges}
          />
          <p className="mt-sp-2 text-caption text-soft">
            Moderators submit recommendations; admins award immediately.
            Automatic badges are awarded by the engine when members participate.
          </p>
        </CardContent>
      </Card>

      {/* Catalog */}
      {badges.length === 0 ? (
        <EmptyState
          icon={BadgeCheck}
          title="No badges yet"
          description="Create your first badge to start recognising members."
        />
      ) : (
        <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => (
            <Card key={badge.id} className="flex flex-col gap-2 p-sp-3">
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex size-12 items-center justify-center rounded-pill bg-accent-soft text-accent-active">
                  <BadgeIcon name={badge.icon} />
                </span>
                {badge.is_active ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="neutral">Inactive</Badge>
                )}
              </div>
              <h3 className="font-heading text-h3 font-bold text-ink">
                {badge.name}
              </h3>
              {badge.criteria ? (
                <p className="flex-1 text-caption text-soft">{badge.criteria}</p>
              ) : (
                <div className="flex-1" />
              )}
              <div className="flex items-center justify-end gap-1">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/badges/${badge.id}/edit`}>
                    <Pencil className="size-4" /> Edit
                  </Link>
                </Button>
                <ActionButton
                  action={deleteBadge.bind(null, badge.id)}
                  variant="ghost"
                  confirmMessage={`Delete the "${badge.name}" badge?`}
                >
                  <Trash2 className="size-4 text-danger" />
                </ActionButton>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
