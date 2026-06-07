import { Lightbulb, Rocket, Sparkles } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { SITE } from "@/content/site";
import { listPublicSuggestions } from "@/lib/suggestions/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HeroSection } from "@/components/sections/hero-section";
import { SectionHeader } from "@/components/sections/section-header";
import { SuggestionCard } from "@/components/suggestions/suggestion-card";
import { CTASection } from "@/components/sections/cta-section";
import { EmptyState } from "@/components/shared/empty-state";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = createMetadata({
  title: "Student Voice",
  description: `Ideas from the students of the ${SITE.name} — implemented improvements, success stories, and proposals shaping our club.`,
  path: "/student-voice",
});

// Reflects live, approved public suggestions.
export const dynamic = "force-dynamic";

export default async function StudentVoicePage() {
  const suggestions = await listPublicSuggestions(24);
  const implemented = suggestions.filter((s) => s.status === "implemented");
  const inProgress = suggestions.filter((s) => s.status !== "implemented");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Student Voice", path: "/student-voice" },
        ])}
      />

      <HeroSection
        eyebrow={<Badge variant="soft">Student Voice</Badge>}
        title="Ideas that shape our club"
        description="Every student has a voice. Here are the approved ideas our members have shared — and the ones we've already brought to life."
      />

      {/* Impact stats */}
      <section className="container-page py-sp-5">
        <div className="grid grid-cols-3 gap-sp-3">
          {[
            { icon: Lightbulb, value: suggestions.length, label: "Approved ideas" },
            { icon: Rocket, value: implemented.length, label: "Implemented" },
            {
              icon: Sparkles,
              value: suggestions.reduce((n, s) => n + s.support_count, 0),
              label: "Member supports",
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardContent className="flex flex-col items-center gap-1 p-sp-3 text-center">
                  <Icon className="size-6 text-primary-active" />
                  <span className="font-display text-h1 font-extrabold text-ink">
                    {s.value}
                  </span>
                  <span className="text-caption text-soft">{s.label}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Implemented */}
      <section className="bg-background-subtle py-sp-5">
        <div className="container-page flex flex-col gap-sp-4">
          <SectionHeader
            eyebrow="Success stories"
            title="Implemented ideas"
            description="Student suggestions we've turned into reality."
          />
          {implemented.length === 0 ? (
            <EmptyState
              icon={Rocket}
              title="Coming soon"
              description="Implemented student ideas will be celebrated here."
            />
          ) : (
            <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
              {implemented.map((s) => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  href="/student-voice"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* In progress / accepted */}
      {inProgress.length > 0 ? (
        <section className="container-page py-sp-5">
          <SectionHeader
            eyebrow="On the way"
            title="Ideas in progress"
            className="mb-sp-4"
          />
          <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} href="/student-voice" />
            ))}
          </div>
        </section>
      ) : null}

      <CTASection
        title="Have an idea for the club?"
        description="Members can share ideas, support others, and track them from proposal to reality."
        primary={{ label: "Share your idea", href: "/portal/suggestions/new" }}
        secondary={{ label: "Member login", href: "/auth/login" }}
      />
    </>
  );
}
