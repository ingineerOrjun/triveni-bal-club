import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Check, Trash2, Award } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listAllAchievements } from "@/lib/recognition/queries";
import { approveAchievement, deleteAchievement } from "@/lib/recognition/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AchievementCard } from "@/components/recognition/achievement-card";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Manage achievements",
  robots: { index: false, follow: false },
};

export default async function AdminAchievementsPage() {
  const [user, achievements] = await Promise.all([
    getCurrentUser(),
    listAllAchievements(),
  ]);
  const isAdmin = user?.role === "admin";

  return (
    <>
      <PortalPageHeader
        title="Achievements"
        description={
          isAdmin
            ? "Award achievements to members and review recommendations."
            : "Recommend achievements for admins to review and award."
        }
        action={
          <Button asChild variant="primary">
            <Link href="/admin/achievements/new">
              <Plus className="size-4" />{" "}
              {isAdmin ? "Award achievement" : "Recommend achievement"}
            </Link>
          </Button>
        }
      />

      {achievements.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No achievements yet"
          description="Award or recommend an achievement to get started."
        />
      ) : (
        <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a) => (
            <div key={a.id} className="flex flex-col gap-2">
              <AchievementCard achievement={a} showRecipient showMeta />
              {isAdmin ? (
                <Card className="flex items-center justify-end gap-1 p-2">
                  {a.status === "recommended" ? (
                    <ActionButton
                      action={approveAchievement.bind(null, a.id)}
                      variant="primary"
                    >
                      <Check className="size-4" /> Approve
                    </ActionButton>
                  ) : null}
                  <ActionButton
                    action={deleteAchievement.bind(null, a.id)}
                    variant="ghost"
                    confirmMessage={`Delete "${a.title}"?`}
                  >
                    <Trash2 className="size-4 text-danger" />
                  </ActionButton>
                </Card>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
