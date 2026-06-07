import Link from "next/link";
import { createMetadata } from "@/lib/seo";
import { SITE } from "@/content/site";
import { getAchievementsSorted } from "@/content/achievements";
import { listPublicAchievements } from "@/lib/recognition/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/sections/hero-section";
import { SectionHeader } from "@/components/sections/section-header";
import { AchievementCard } from "@/components/cards/achievement-card";
import { AchievementCard as MemberAchievementCard } from "@/components/recognition/achievement-card";
import { EmptyState } from "@/components/shared/empty-state";
import { CTASection } from "@/components/sections/cta-section";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { ArrowRight, Trophy } from "lucide-react";

export const metadata = createMetadata({
  title: "Achievements",
  description: `Awards, recognition, and milestones earned by the ${SITE.name} and its members.`,
  path: "/achievements",
});

// Includes live public member achievements from the database.
export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const achievements = getAchievementsSorted();
  const memberAchievements = await listPublicAchievements(12);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Achievements", path: "/achievements" },
        ])}
      />

      <HeroSection
        eyebrow={<Badge variant="soft">Proud moments</Badge>}
        title="Achievements"
        description="Celebrating the awards, recognition, and milestones our students have earned."
      />

      <section className="container-page py-sp-5">
        <SectionHeader
          eyebrow="Awards & recognition"
          title="Every win, big and small"
          className="mb-sp-4"
        />
        {achievements.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No achievements listed yet"
            description="As our members earn recognition, you'll see it celebrated here."
          />
        ) : (
          <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        )}
      </section>

      {memberAchievements.length > 0 ? (
        <section className="bg-background-subtle py-sp-5">
          <div className="container-page flex flex-col gap-sp-4">
            <SectionHeader
              eyebrow="From our members"
              title="Recent member achievements"
              action={
                <Button asChild variant="outline">
                  <Link href="/hall-of-fame">
                    Hall of Fame <ArrowRight className="size-4" />
                  </Link>
                </Button>
              }
            />
            <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
              {memberAchievements.map((a) => (
                <MemberAchievementCard key={a.id} achievement={a} showRecipient />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <CTASection
        title="Be part of the next milestone"
        description="Join an activity, represent the club, and add your own chapter to our story."
        primary={{ label: "Explore activities", href: "/activities" }}
        secondary={{ label: "Hall of Fame", href: "/hall-of-fame" }}
      />
    </>
  );
}
