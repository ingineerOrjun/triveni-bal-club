import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { getAlbumBySlug } from "@/lib/gallery/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/sections/hero-section";
import { MediaThumb } from "@/components/media/media-thumb";
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

        {album.photos.length === 0 ? (
          <EmptyState
            icon={GalleryThumbnails}
            title="No photos yet"
            description="This album doesn't have any photos yet."
          />
        ) : (
          <ul className="grid grid-cols-2 gap-sp-2 sm:grid-cols-3 lg:grid-cols-4">
            {album.photos.map((p) =>
              p.file ? (
                <li key={p.id}>
                  <a
                    href={p.file.public_url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block overflow-hidden rounded-md border border-line bg-background-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={p.caption ?? p.file.alt_text ?? p.file.filename}
                  >
                    <span className="block aspect-square">
                      <MediaThumb
                        file={p.file}
                        className="transition-transform duration-base ease-out group-hover:scale-105"
                      />
                    </span>
                  </a>
                </li>
              ) : null
            )}
          </ul>
        )}
      </section>
    </>
  );
}
