import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";
import { ACTIVITIES } from "@/content/activities";
import { listPublishedArticles, listEditions } from "@/lib/magazine/queries";
import { listContributors } from "@/lib/contributors/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const staticRoutes = [
    "",
    "/about",
    "/committee",
    "/activities",
    "/events",
    "/gallery",
    "/achievements",
    "/magazine",
    "/contact",
  ];

  const lastModified = new Date("2026-06-05");

  const pages: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const activityPages: MetadataRoute.Sitemap = ACTIVITIES.map((a) => ({
    url: `${base}/activities/${a.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  // Magazine content is dynamic; best-effort (skipped when the DB is
  // unavailable, e.g. during a build with no Supabase connection).
  let magazinePages: MetadataRoute.Sitemap = [];
  try {
    const [articles, editions, contributors] = await Promise.all([
      listPublishedArticles({ limit: 200 }),
      listEditions({ publishedOnly: true }),
      listContributors(),
    ]);
    magazinePages = [
      { url: `${base}/authors`, lastModified, changeFrequency: "weekly" as const, priority: 0.5 },
      ...editions.map((e) => ({
        url: `${base}/magazine/${e.slug}`,
        lastModified: e.published_at ? new Date(e.published_at) : lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
      ...articles.map((a) => ({
        url: `${base}/magazine/article/${a.slug}`,
        lastModified: a.published_at ? new Date(a.published_at) : lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...contributors.map((c) => ({
        url: `${base}/authors/${c.slug}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.4,
      })),
    ];
  } catch {
    magazinePages = [];
  }

  return [...pages, ...activityPages, ...magazinePages];
}
