import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";
import { ACTIVITIES } from "@/content/activities";

export default function sitemap(): MetadataRoute.Sitemap {
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

  return [...pages, ...activityPages];
}
