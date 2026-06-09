import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createMetadata } from "@/lib/seo";
import { getPublishedPageBySlug } from "@/lib/cms/queries";
import { PageRenderer } from "@/components/cms/page-renderer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  if (!page) return createMetadata({ title: "Page not found", description: "" });
  const seo = page.seo as Record<string, string | boolean | undefined>;
  return {
    ...createMetadata({
      title: (seo.title as string) || page.title,
      description: (seo.description as string) || "",
      path: `/pages/${page.slug}`,
      image: (seo.ogImage as string) || undefined,
    }),
    ...(seo.canonical ? { alternates: { canonical: String(seo.canonical) } } : {}),
    ...(seo.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function CmsPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  if (!page) notFound();

  return (
    <div className="py-sp-2">
      <PageRenderer blocks={page.blocks} />
    </div>
  );
}
