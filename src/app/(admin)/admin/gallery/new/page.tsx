import type { Metadata } from "next";
import { createAlbum } from "@/lib/gallery/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card } from "@/components/ui/card";
import { AlbumForm } from "@/components/gallery/album-form";

export const metadata: Metadata = {
  title: "New album",
  robots: { index: false, follow: false },
};

export default function NewAlbumPage() {
  return (
    <>
      <PortalPageHeader
        title="New album"
        description="Albums start as drafts — add photos, then publish."
      />
      <Card className="p-sp-4">
        <AlbumForm action={createAlbum} submitLabel="Create album" />
      </Card>
    </>
  );
}
