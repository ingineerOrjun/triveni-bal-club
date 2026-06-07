import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAlbum } from "@/lib/gallery/queries";
import { updateAlbum } from "@/lib/gallery/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { AlbumForm } from "@/components/gallery/album-form";
import { AlbumEditor } from "@/components/gallery/album-editor";

export const metadata: Metadata = {
  title: "Edit album",
  robots: { index: false, follow: false },
};

export default async function AdminAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const album = await getAlbum(id);
  if (!album) notFound();

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/admin/gallery">
          <ArrowLeft className="size-4" /> All albums
        </Link>
      </Button>

      <PortalPageHeader
        title={album.title}
        action={<StatusBadge status={album.status} />}
      />

      <div className="grid gap-sp-4 lg:grid-cols-[1.3fr_1fr]">
        <AlbumEditor albumId={album.id} cover={album.cover} photos={album.photos} />

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Album details</CardTitle>
          </CardHeader>
          <CardContent>
            <AlbumForm
              action={updateAlbum.bind(null, id)}
              submitLabel="Save changes"
              showFeatured
              values={{
                title: album.title,
                description: album.description ?? "",
                category: album.category ?? "",
                seo_description: album.seo_description ?? "",
                featured: album.featured,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
