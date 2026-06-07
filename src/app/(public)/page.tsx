import Link from "next/link";
import {
  ArrowRight,
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
import { getFeaturedActivities } from "@/content/activities";
import { splitEvents, REFERENCE_NOW } from "@/content/events";
import { getAchievementsSorted } from "@/content/achievements";
import { STUDENT_VOICE } from "@/content/student-voice";
import { getLatestIssue } from "@/content/magazine";
import { getPublicSettings, readSetting } from "@/lib/admin/settings";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { HeroSection } from "@/components/sections/hero-section";
import { SectionHeader } from "@/components/sections/section-header";
import { CTASection } from "@/components/sections/cta-section";
import { ActivityCard } from "@/components/cards/activity-card";
import { EventCard } from "@/components/cards/event-card";
import { AchievementCard } from "@/components/cards/achievement-card";
import { MagazineCard } from "@/components/cards/magazine-card";
import { JsonLd, organizationJsonLd } from "@/components/seo/json-ld";

export const metadata = createMetadata({
  title: `${SITE.name} — ${SITE.tagline.en}`,
  description: SITE.description.en,
  path: "/",
});

const PILLARS = [
  { icon: Users, title: "Student-Led", body: "Members shape every activity and decision." },
  { icon: Vote, title: "Fair Elections", body: "Transparent voting for club leadership." },
  { icon: Trophy, title: "Recognition", body: "Celebrating achievement of every kind." },
];

export default async function HomePage() {
  const featuredActivities = getFeaturedActivities(3);
  const { upcoming } = splitEvents(REFERENCE_NOW);
  const upcomingEvents = upcoming.slice(0, 3);
  const achievements = getAchievementsSorted().slice(0, 3);
  const latestIssue = getLatestIssue();

  // Homepage hero is editable from the admin CMS (Content → Homepage hero).
  const settings = await getPublicSettings();
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
          <div className="grid grid-cols-2 gap-sp-3">
            {CLUB_STATS.map((stat) => (
              <Card key={stat.value} className="flex flex-col gap-1 p-sp-3">
                <span className="font-display text-h1 font-extrabold text-primary-active">
                  {stat.value}
                </span>
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
            description="From the environment to the arts, there's a place for every interest."
            action={
              <Button asChild variant="outline">
                <Link href="/activities">
                  View all <ArrowRight className="size-4" />
                </Link>
              </Button>
            }
          />
          <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredActivities.map((activity) => (
              <ActivityCard key={activity.slug} activity={activity} />
            ))}
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
          <div className="grid gap-sp-3 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
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
          <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
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
        <div className="container-page grid items-center gap-sp-5 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-sp-3">
            <SectionHeader
              eyebrow="Read & explore"
              title="Triveni Voices magazine"
              description={localize(latestIssue.description)}
            />
            <ul className="flex flex-col gap-2">
              {latestIssue.articles.slice(0, 3).map((article) => (
                <li
                  key={article.slug}
                  className="flex items-center gap-sp-2 rounded-md border border-line bg-surface p-sp-2"
                >
                  <Target className="size-4 shrink-0 text-primary-active" />
                  <span className="flex-1 text-body text-ink">
                    {localize(article.title)}
                  </span>
                  <span className="text-caption text-soft">{article.author}</span>
                </li>
              ))}
            </ul>
            <div>
              <Button asChild variant="primary">
                <Link href="/magazine">
                  Read the magazine <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[260px]">
            <MagazineCard issue={latestIssue} />
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
