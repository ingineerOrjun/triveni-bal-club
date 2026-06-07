"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, ImageUp, Trash2 } from "lucide-react";
import type { AlbumPhoto } from "@/lib/gallery/queries";
import type { MediaFileRow } from "@/types/database";
import { addPhotoToAlbum, removePhoto, setAlbumCover } from "@/lib/gallery/actions";
import { MediaPicker } from "@/components/media/media-picker";
import { MediaThumb } from "@/components/media/media-thumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { GalleryThumbnails } from "lucide-react";

export function AlbumEditor({
  albumId,
  cover,
  photos,
}: {
  albumId: string;
  cover: MediaFileRow | null;
  photos: AlbumPhoto[];
}) {
  const router = useRouter();
  const [coverOpen, setCoverOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-sp-4">
      <Card className="flex flex-wrap items-center gap-sp-3 p-sp-3">
        <div className="size-20 overflow-hidden rounded-md border border-line bg-background-subtle">
          {cover ? (
            <MediaThumb file={cover} />
          ) : (
            <div className="flex size-full items-center justify-center text-soft">
              <ImagePlus className="size-6" />
            </div>
          )}
        </div>
        <div>
          <p className="font-heading font-bold text-ink">Album cover</p>
          <p className="text-caption text-soft">Shown on gallery listings.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCoverOpen(true)} className="ml-auto">
          <ImageUp className="size-4" /> {cover ? "Change cover" : "Set cover"}
        </Button>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-h3 font-bold text-ink">Photos ({photos.length})</h2>
        <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
          <ImagePlus className="size-4" /> Add photos
        </Button>
      </div>

      {photos.length === 0 ? (
        <EmptyState
          icon={GalleryThumbnails}
          title="No photos yet"
          description="Add photos from the Media Library."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-sp-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <li key={p.id} className="group relative overflow-hidden rounded-lg border border-line bg-surface">
              <span className="block aspect-square">
                {p.file ? (
                  <MediaThumb file={p.file} />
                ) : (
                  <span className="flex size-full items-center justify-center text-soft">missing</span>
                )}
              </span>
              <form
                action={async () => {
                  await removePhoto(p.id, albumId, p.file_id);
                  router.refresh();
                }}
                className="absolute right-2 top-2"
              >
                <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  aria-label="Remove photo"
                  className="size-8 bg-surface/90"
                >
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <MediaPicker
        open={coverOpen}
        onOpenChange={setCoverOpen}
        onSelect={async (f) => {
          await setAlbumCover(albumId, f.id);
          router.refresh();
        }}
      />
      <MediaPicker
        open={addOpen}
        onOpenChange={setAddOpen}
        onSelect={async (f) => {
          await addPhotoToAlbum(albumId, f.id);
          router.refresh();
        }}
      />
    </div>
  );
}
