import Link from "next/link";
import { createMetadata } from "@/lib/seo";
import { SITE } from "@/content/site";
import { GALLERY } from "@/content/gallery";
import { listAlbums } from "@/lib/gallery/queries";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { HeroSection } from "@/components/sections/hero-section";
import { SectionHeader } from "@/components/sections/section-header";
import { GalleryGrid } from "@/components/sections/gallery-grid";
import { MediaThumb } from "@/components/media/media-thumb";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { GalleryThumbnails } from "lucide-react";

export const metadata = createMetadata({
  title: "Gallery",
  description: `Photos from the ${SITE.name} — events, activities, sports, arts, and community moments.`,
  path: "/gallery",
});

// Albums come from the live Gallery CMS.
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const albums = await listAlbums(true);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Gallery", path: "/gallery" },
        ])}
      />

      <HeroSection
        eyebrow={<Badge variant="soft">Moments</Badge>}
        title="Photo gallery"
        description="A look at club life — explore our albums or browse recent moments."
      />

      {albums.length > 0 ? (
        <section className="container-page py-sp-5">
          <SectionHeader eyebrow="Collections" title="Albums" className="mb-sp-4" />
          <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((a) => (
              <Link key={a.id} href={`/gallery/${a.slug}`} className="group block">
                <Card interactive className="h-full overflow-hidden">
                  <span className="block aspect-[16/9] bg-background-subtle">
                    {a.cover ? (
                      <MediaThumb file={a.cover} />
                    ) : (
                      <span className="flex size-full items-center justify-center text-soft">
                        <GalleryThumbnails className="size-8" />
                      </span>
                    )}
                  </span>
                  <span className="block p-sp-3">
                    <span className="block font-heading text-h3 font-bold text-ink">
                      {a.title}
                    </span>
                    <span className="block text-caption text-soft">
                      {a.photoCount} photos
                    </span>
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="container-page py-sp-5">
        <SectionHeader
          eyebrow="Recent moments"
          title="From around the club"
          className="mb-sp-4"
        />
        <GalleryGrid items={GALLERY} />
      </section>
    </>
  );
}
