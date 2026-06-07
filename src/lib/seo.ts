import type { Metadata } from "next";
import { SITE } from "@/content/site";

/**
 * Build per-page Metadata with consistent Open Graph + Twitter cards.
 * `metadataBase` is set once in the root layout, so `path` can be relative.
 */
export interface PageSeo {
  title: string;
  description: string;
  /** Absolute path, e.g. "/activities". Used for canonical + OG url. */
  path?: string;
  /** Image under /public; defaults to the social share image. */
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
}

export const OG_DEFAULT = "/gallery/triveni-05.jpeg";

export function createMetadata({
  title,
  description,
  path = "/",
  image = OG_DEFAULT,
  imageAlt,
  type = "website",
}: PageSeo): Metadata {
  const url = path;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      type,
      images: [{ url: image, width: 1200, height: 630, alt: imageAlt ?? title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
