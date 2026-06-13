import Link from "next/link";
import type * as React from "react";
import {
  ArrowRight,
  CalendarDays,
  Image as ImageIcon,
  Lightbulb,
  Newspaper,
  Sparkles,
  Quote,
  Target,
  Users,
  Vote,
  Trophy,
} from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { localize } from "@/lib/i18n";
import { SITE } from "@/content/site";
import { MISSION, CLUB_STATS } from "@/content/about";
import { STUDENT_VOICE } from "@/content/student-voice";
import { getPublicSettings, readSetting } from "@/lib/admin/settings";
import { listActivities } from "@/lib/activities/queries";
import { listEvents } from "@/lib/events/queries";
import { listPublicAchievements, getHallOfFame } from "@/lib/recognition/queries";
import { getLatestEdition, listPublishedArticles } from "@/lib/magazine/queries";
import { listPublicSuggestions } from "@/lib/suggestions/queries";
import { listAlbums } from "@/lib/gallery/queries";
import { listElections } from "@/lib/elections/queries";
import { formatDate, formatDateTime } from "@/lib/format";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { HeroSection } from "@/components/sections/hero-section";
import { SectionHeader } from "@/components/sections/section-header";
import { CTASection } from "@/components/sections/cta-section";
import { JsonLd, organizationJsonLd } from "@/components/seo/json-ld";

export const metadata = createMetadata({
  title: `${SITE.name} — ${SITE.tagline.en}`,
  description: SITE.description.en,
  path: "/",
});

// Homepage widgets read live DB content (events, magazine, achievements, …),
// so render per-request — published content appears immediately, no rebuild.
export const dynamic = "force-dynamic";

const PILLARS = [
  { icon: Users, title: "Student-Led", body: "Members shape every activity and decision." },
  { icon: Vote, title: "Fair Elections", body: "Transparent voting for club leadership." },
  { icon: Trophy, title: "Recognition", body: "Celebrating achievement of every kind." },
];

export default async function HomePage() {
  const nowMs = Date.now();

  // Homepage hero is editable from the admin CMS (Content → Homepage hero).
  const [
    settings,
    activities,
    events,
    achievements,
    hallOfFame,
    latestEdition,
    articles,
    suggestions,
    albums,
    elections,
  ] = await Promise.all([
    getPublicSettings(),
    listActivities(),
    listEvents(),
    listPublicAchievements(3),
    getHallOfFame(4),
    getLatestEdition(),
    listPublishedArticles({ limit: 3 }),
    listPublicSuggestions(3),
    listAlbums(true),
    listElections(),
  ]);

  const featuredActivities = activities
    .filter((activity) => activity.status === "published")
    .slice(0, 3);
  const upcomingEvents = events
    .filter((event) => event.status === "published" && new Date(event.starts_at).getTime() >= nowMs)
    .slice(0, 3);
  const latestGallery = albums.slice(0, 3);
  const upcomingElections = elections
    .filter((election) => election.status !== "archived")
    .slice(0, 3);
  const hero = settings.homepage;
  const heroTitle = readSetting(hero, "heroTitle", localize(SITE.tagline));
  const heroSubtitle = readSetting(hero, "heroSubtitle", localize(SITE.description));
  const heroCtaLabel = readSetting(hero, "heroCtaLabel", "Discover the Club");
  const heroCtaHref = readSetting(hero, "heroCtaHref", "/about");

  return (
    <>
      <JsonLd data={organizationJsonLd()} />

      {/* 1 · HERO (editable via admin CMS) */}
      <HeroSection
        eyebrow={
          <Badge variant="soft" className="gap-1.5">
            <Sparkles className="size-3.5" />
            Civic-Optimist · Student-Led
          </Badge>
        }
        title={heroTitle}
        description={heroSubtitle}
        image={{ src: "/gallery/triveni-01.jpeg", alt: "Triveni Child Club members together" }}
        actions={
          <>
            <Button asChild size="lg" variant="primary">
              <Link href={heroCtaHref}>
                {heroCtaLabel} <ArrowRight className="size-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/activities">Explore Activities</Link>
            </Button>
          </>
        }
        footer={
          <p lang="ne" className="font-nepali text-body text-soft">
            {localize(SITE.tagline, "ne")}
          </p>
        }
      />

      {/* 2 · ABOUT CLUB */}
      <section className="container-page py-sp-5">
        <div className="grid items-center gap-sp-5 lg:grid-cols-2">
          <div className="flex flex-col gap-sp-3">
            <SectionHeader
              eyebrow="About the Club"
              title="A community where every voice matters"
              description={localize(MISSION)}
            />
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="primary">
                <Link href="/about">Our Story</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/committee">Meet the Committee</Link>
              </Button>
            </div>
          </div>
          <div className="stagger-children grid grid-cols-2 gap-sp-3">
            {CLUB_STATS.map((stat) => (
              <Card key={stat.value} interactive gradientBorder className="flex flex-col gap-1 p-sp-3">
                <AnimatedCounter
                  value={stat.value}
                  className="font-display text-h1 font-extrabold text-primary-active"
                />
                <span className="text-body text-soft">
                  {localize(stat.label)}
                </span>
              </Card>
            ))}
          </div>
        </div>

        {/* Pillars */}
        <div className="mt-sp-5 grid gap-sp-3 md:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="flex items-start gap-sp-2 p-sp-3">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-active">
                <Icon className="size-6" />
              </span>
              <div>
                <h3 className="font-heading text-h3 font-bold text-ink">{title}</h3>
                <p className="text-body text-soft">{body}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 3 · FEATURED ACTIVITIES */}
      <section className="bg-background-subtle py-sp-5">
        <div className="container-page flex flex-col gap-sp-4">
          <SectionHeader
            eyebrow="What we do"
            title="Featured activities"
            description="Published activities from the club database."
            action={
              <Button asChild variant="outline">
                <Link href="/activities">
                  View all <ArrowRight className="size-4" />
                </Link>
              </Button>
            }
          />
          <div className="stagger-children grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredActivities.length > 0 ? (
              featuredActivities.map((activity) => (
                <LiveCard
                  key={activity.id}
                  href={`/activities/${activity.slug}`}
                  title={activity.title}
                  description={activity.description ?? "Activity details will be updated by the club team."}
                  meta={activity.category?.name ?? "Activity"}
                  icon={Target}
                />
              ))
            ) : (
              <EmptyLiveCard title="No published activities yet" />
            )}
          </div>
        </div>
      </section>

      {/* 4 · UPCOMING EVENTS */}
      <section className="container-page py-sp-5">
        <div className="flex flex-col gap-sp-4">
          <SectionHeader
            eyebrow="Mark your calendar"
            title="Upcoming events"
            action={
              <Button asChild variant="outline">
                <Link href="/events">
                  All events <ArrowRight className="size-4" />
                </Link>
              </Button>
            }
          />
          <div className="stagger-children grid gap-sp-3 lg:grid-cols-3">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <LiveCard
                  key={event.id}
                  href="/events"
                  title={event.title}
                  description={event.description ?? "Event details will be shared soon."}
                  meta={formatDateTime(event.starts_at)}
                  icon={CalendarDays}
                />
              ))
            ) : (
              <EmptyLiveCard title="No upcoming events" />
            )}
          </div>
        </div>
      </section>

      {/* 5 · ACHIEVEMENTS */}
      <section className="bg-background-subtle py-sp-5">
        <div className="container-page flex flex-col gap-sp-4">
          <SectionHeader
            eyebrow="Proud moments"
            title="Recent achievements"
            action={
              <Button asChild variant="outline">
                <Link href="/achievements">
                  See all <ArrowRight className="size-4" />
                </Link>
              </Button>
            }
          />
          <div className="stagger-children grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.length > 0 ? (
              achievements.map((achievement) => (
                <LiveCard
                  key={achievement.id}
                  href="/hall-of-fame"
                  title={achievement.title}
                  description={achievement.description ?? achievement.category?.name ?? "Club achievement"}
                  meta={achievement.member?.full_name ?? formatDate(achievement.award_date)}
                  icon={Trophy}
                />
              ))
            ) : (
              <EmptyLiveCard title="No public achievements yet" />
            )}
          </div>
        </div>
      </section>

      {/* 6 · STUDENT VOICE */}
      <section className="container-page py-sp-5">
        <SectionHeader
          eyebrow="Student voice"
          title="In their own words"
          align="center"
          description="What being part of the club means to our members."
          className="mb-sp-4"
        />
        <div className="grid gap-sp-3 md:grid-cols-3">
          {STUDENT_VOICE.map((sv) => (
            <Card key={sv.id} className="flex flex-col gap-sp-2 p-sp-3">
              <Quote className="size-8 text-accent" aria-hidden />
              <p className="flex-1 text-lead text-ink">
                “{localize(sv.quote)}”
              </p>
              <div>
                <p className="font-heading font-bold text-ink">
                  {localize(sv.name)}
                </p>
                <p className="text-caption text-soft">{sv.classLevel}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 7 · MAGAZINE PREVIEW */}
      <section className="bg-background-subtle py-sp-5">
        <div className="container-page flex flex-col gap-sp-4">
          <SectionHeader
            eyebrow="Live updates"
            title="What's new across the club"
            description="Magazine, suggestions, gallery, elections, and recognition pulled from the database."
          />
          <div className="grid gap-sp-3 lg:grid-cols-3">
            <LivePanel title="Latest magazine" href="/magazine" icon={Newspaper}>
              {latestEdition ? (
                <LiveList
                  items={[
                    {
                      title: latestEdition.title,
                      meta: latestEdition.published_at
                        ? formatDate(latestEdition.published_at)
                        : "Published edition",
                    },
                    ...articles.map((article) => ({
                      title: article.title,
                      meta: article.authorName ?? article.categoryName ?? "Article",
                    })),
                  ].slice(0, 4)}
                />
              ) : (
                <EmptyInline text="No published editions yet." />
              )}
            </LivePanel>

            <LivePanel title="Hall of fame" href="/hall-of-fame" icon={Trophy}>
              {hallOfFame.length > 0 ? (
                <LiveList
                  items={hallOfFame.map((entry) => ({
                    title: entry.member.full_name,
                    meta: `${entry.badgeCount} badge${entry.badgeCount === 1 ? "" : "s"}`,
                  }))}
                />
              ) : (
                <EmptyInline text="No badge leaders yet." />
              )}
            </LivePanel>

            <LivePanel title="Latest suggestions" href="/student-voice" icon={Lightbulb}>
              {suggestions.length > 0 ? (
                <LiveList
                  items={suggestions.map((suggestion) => ({
                    title: suggestion.title,
                    meta: `${suggestion.support_count} support${suggestion.support_count === 1 ? "" : "s"}`,
                  }))}
                />
              ) : (
                <EmptyInline text="No public suggestions yet." />
              )}
            </LivePanel>

            <LivePanel title="Latest gallery" href="/gallery" icon={ImageIcon}>
              {latestGallery.length > 0 ? (
                <LiveList
                  items={latestGallery.map((album) => ({
                    title: album.title,
                    meta: `${album.photoCount} photo${album.photoCount === 1 ? "" : "s"}`,
                  }))}
                />
              ) : (
                <EmptyInline text="No published albums yet." />
              )}
            </LivePanel>

            <LivePanel title="Upcoming elections" href="/elections" icon={Vote}>
              {upcomingElections.length > 0 ? (
                <LiveList
                  items={upcomingElections.map((election) => ({
                    title: election.title,
                    meta: `${election.positionCount} positions · ${election.status.replace(/_/g, " ")}`,
                  }))}
                />
              ) : (
                <EmptyInline text="No active elections yet." />
              )}
            </LivePanel>

            <LivePanel title="Club statistics" href="/about" icon={Users}>
              <LiveList
                items={CLUB_STATS.map((stat) => ({
                  title: stat.value,
                  meta: localize(stat.label),
                }))}
              />
            </LivePanel>
          </div>
        </div>
      </section>

      {/* 8 · CALL TO ACTION */}
      <CTASection
        title="Ready to be part of something bigger?"
        description="Join activities, vote in elections, and share your voice with the whole club."
        primary={{ label: "Get Started", href: "/contact" }}
        secondary={{ label: "Learn More", href: "/about" }}
      />
    </>
  );
}

function LiveCard({
  href,
  title,
  description,
  meta,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  meta: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card interactive className="group flex h-full flex-col gap-sp-2 p-sp-3">
      <Badge variant="soft" className="w-fit gap-1.5">
        <Icon className="size-3.5" />
        {meta}
      </Badge>
      <h3 className="font-heading text-h3 font-bold text-ink">{title}</h3>
      <p className="line-clamp-3 flex-1 text-body text-soft">{description}</p>
      <Link
        href={href}
        className="mt-sp-1 inline-flex items-center gap-1 font-heading text-caption font-semibold text-primary-active"
      >
        View details
        <ArrowRight className="size-4 transition-transform duration-fast group-hover:translate-x-1" />
      </Link>
    </Card>
  );
}

function EmptyLiveCard({ title }: { title: string }) {
  return (
    <Card className="p-sp-3">
      <p className="font-heading text-h3 font-bold text-ink">{title}</p>
      <p className="mt-1 text-body text-soft">
        Publish content in admin and it will appear here automatically.
      </p>
    </Card>
  );
}

function LivePanel({
  title,
  href,
  icon: Icon,
  children,
}: {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex min-h-64 flex-col p-sp-3">
      <div className="mb-sp-2 flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 font-heading text-h3 font-bold text-ink">
          <Icon className="size-5 text-primary-active" />
          {title}
        </h3>
        <Link href={href} className="text-caption font-semibold text-primary-active">
          Open
        </Link>
      </div>
      {children}
    </Card>
  );
}

function LiveList({ items }: { items: { title: string; meta: string }[] }) {
  return (
    <ul className="flex flex-col divide-y divide-line">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="py-2">
          <p className="line-clamp-1 font-heading font-semibold text-ink">
            {item.title}
          </p>
          <p className="line-clamp-1 text-caption text-soft">{item.meta}</p>
        </li>
      ))}
    </ul>
  );
}

function EmptyInline({ text }: { text: string }) {
  return (
    <p className="rounded-md bg-background-subtle p-sp-2 text-body text-soft">
      {text}
    </p>
  );
}
