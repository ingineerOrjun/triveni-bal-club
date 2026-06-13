import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { getAlbumBySlug } from "@/lib/gallery/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/sections/hero-section";
import { GalleryViewer } from "@/components/gallery/gallery-viewer";
import type { LightboxImage } from "@/components/gallery/lightbox";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/shared/empty-state";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { GalleryThumbnails } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);
  if (!album) return createMetadata({ title: "Album not found", description: "" });
  return createMetadata({
    title: album.title,
    description: album.seo_description ?? album.description ?? `${album.title} — photo album.`,
    path: `/gallery/${album.slug}`,
    image: album.cover?.public_url ?? undefined,
  });
}

export default async function PublicAlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);
  if (!album || album.status !== "published") notFound();

  const images: LightboxImage[] = album.photos
    .filter((p) => p.file?.public_url)
    .map((p) => ({
      src: p.file!.public_url as string,
      alt: p.file!.alt_text ?? p.caption ?? album.title,
      title: p.caption ?? p.file!.alt_text ?? undefined,
      date: p.file!.created_at ? formatDate(p.file!.created_at) : undefined,
    }));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Gallery", path: "/gallery" },
          { name: album.title, path: `/gallery/${album.slug}` },
        ])}
      />

      <HeroSection
        eyebrow={album.category ? <Badge variant="soft">{album.category}</Badge> : undefined}
        title={album.title}
        description={album.description ?? undefined}
      />

      <section className="container-page py-sp-5">
        <Button asChild variant="ghost" size="sm" className="mb-sp-3">
          <Link href="/gallery">
            <ArrowLeft className="size-4" /> All albums
          </Link>
        </Button>

        {images.length === 0 ? (
          <EmptyState
            icon={GalleryThumbnails}
            title="No photos yet"
            description="This album doesn't have any photos yet."
          />
        ) : (
          <GalleryViewer images={images} />
        )}
      </section>
    </>
  );
}
