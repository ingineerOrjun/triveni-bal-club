import { Trophy, Award } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { SITE } from "@/content/site";
import {
  getHallOfFame,
  listAwards,
  listPublicAchievements,
} from "@/lib/recognition/queries";
import { Badge } from "@/components/ui/badge";
import { HeroSection } from "@/components/sections/hero-section";
import { SectionHeader } from "@/components/sections/section-header";
import { RecognitionLeaderboard } from "@/components/recognition/recognition-leaderboard";
import { RecognitionCard } from "@/components/recognition/recognition-card";
import { AchievementCard } from "@/components/recognition/achievement-card";
import { EmptyState } from "@/components/shared/empty-state";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = createMetadata({
  title: "Hall of Fame",
  description: `Celebrating the most recognised members of the ${SITE.name} — top badge earners, award winners, and public achievements.`,
  path: "/hall-of-fame",
});

// Reflects live recognition data.
export const dynamic = "force-dynamic";

export default async function HallOfFamePage() {
  const [leaders, awards, achievements] = await Promise.all([
    getHallOfFame(10),
    listAwards(),
    listPublicAchievements(12),
  ]);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Hall of Fame", path: "/hall-of-fame" },
        ])}
      />

      <HeroSection
        eyebrow={<Badge variant="soft">Recognition</Badge>}
        title="Hall of Fame"
        description="Celebrating the members who lead, serve, and shine in our club."
      />

      <section className="container-page py-sp-5">
        <div className="grid gap-sp-5 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionHeader
              eyebrow="Top badge earners"
              title="Leaderboard"
              className="mb-sp-3"
            />
            <RecognitionLeaderboard entries={leaders} />
          </div>

          <div>
            <SectionHeader
              eyebrow="Award winners"
              title="Recognition awards"
              className="mb-sp-3"
            />
            {awards.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="No awards yet"
                description="Recognition program winners will be celebrated here."
              />
            ) : (
              <div className="grid gap-sp-3 sm:grid-cols-2">
                {awards.slice(0, 6).map((a) => (
                  <RecognitionCard key={a.id} award={a} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-background-subtle py-sp-5">
        <div className="container-page flex flex-col gap-sp-4">
          <SectionHeader eyebrow="Celebrated publicly" title="Member achievements" />
          {achievements.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No public achievements yet"
              description="Members' public achievements will appear here."
            />
          ) : (
            <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a) => (
                <AchievementCard key={a.id} achievement={a} showRecipient />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
