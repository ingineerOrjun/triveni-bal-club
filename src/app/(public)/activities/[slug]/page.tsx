import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, CalendarDays, Tag, ArrowLeft } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { localize } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import {
  ACTIVITIES,
  ACTIVITY_CATEGORIES,
  getActivityBySlug,
} from "@/content/activities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SectionHeader } from "@/components/sections/section-header";
import { ActivityCard } from "@/components/cards/activity-card";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return ACTIVITIES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const activity = getActivityBySlug(slug);
  if (!activity) return createMetadata({ title: "Activity not found", description: "" });
  return createMetadata({
    title: localize(activity.title),
    description: localize(activity.summary),
    path: `/activities/${activity.slug}`,
    image: activity.image.src,
    imageAlt: activity.image.alt,
    type: "article",
  });
}

export default async function ActivityDetailPage({ params }: Params) {
  const { slug } = await params;
  const activity = getActivityBySlug(slug);
  if (!activity) notFound();

  const title = localize(activity.title);
  const category = ACTIVITY_CATEGORIES.find((c) => c.value === activity.category);
  const related = ACTIVITIES.filter(
    (a) => a.category === activity.category && a.slug !== activity.slug
  ).slice(0, 3);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Activities", path: "/activities" },
          { name: title, path: `/activities/${activity.slug}` },
        ])}
      />

      <article className="container-page py-sp-4">
        <Breadcrumb className="mb-sp-3">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/activities">Activities</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid gap-sp-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-line shadow-md">
            <Image
              src={activity.image.src}
              alt={activity.image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col gap-sp-3">
            {category ? (
              <Badge variant="primary" className="w-fit">
                {localize(category.label)}
              </Badge>
            ) : null}
            <h1 className="text-h1 font-bold text-ink">{title}</h1>
            <p className="text-lead text-soft">{localize(activity.summary)}</p>

            <dl className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-sp-3">
              <div className="flex items-center gap-2 text-body">
                <Tag className="size-4 text-primary-active" />
                <dt className="text-soft">Term:</dt>
                <dd className="font-semibold text-ink">{activity.term}</dd>
              </div>
              {typeof activity.participants === "number" ? (
                <div className="flex items-center gap-2 text-body">
                  <Users className="size-4 text-primary-active" />
                  <dt className="text-soft">Members:</dt>
                  <dd className="font-semibold text-ink">{activity.participants}</dd>
                </div>
              ) : null}
              {activity.startsOn ? (
                <div className="flex items-center gap-2 text-body">
                  <CalendarDays className="size-4 text-primary-active" />
                  <dt className="text-soft">Starts:</dt>
                  <dd className="font-semibold text-ink">
                    {formatDate(activity.startsOn)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>

        <div className="mt-sp-4 max-w-prose">
          <p className="text-lead text-ink">{localize(activity.body)}</p>
          <p lang="ne" className="mt-sp-2 font-nepali text-body text-soft">
            {localize(activity.body, "ne")}
          </p>
        </div>

        <div className="mt-sp-4">
          <Button asChild variant="ghost">
            <Link href="/activities">
              <ArrowLeft className="size-4" /> Back to activities
            </Link>
          </Button>
        </div>
      </article>

      {related.length > 0 ? (
        <section className="bg-background-subtle py-sp-5">
          <div className="container-page flex flex-col gap-sp-4">
            <SectionHeader eyebrow="More like this" title="Related activities" />
            <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a) => (
                <ActivityCard key={a.slug} activity={a} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
