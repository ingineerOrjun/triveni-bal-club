import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Send, Archive, RotateCcw, Trash2, GalleryThumbnails, Settings2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listAlbums } from "@/lib/gallery/queries";
import { setAlbumStatus, deleteAlbum } from "@/lib/gallery/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActionButton } from "@/components/shared/action-button";
import { MediaThumb } from "@/components/media/media-thumb";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Gallery",
  robots: { index: false, follow: false },
};

export default async function AdminGalleryPage() {
  const [user, albums] = await Promise.all([getCurrentUser(), listAlbums()]);
  const isAdmin = user?.role === "admin";

  return (
    <>
      <PortalPageHeader
        title="Gallery"
        description="Albums of photos drawn from the Media Library."
        action={
          <Button asChild variant="primary">
            <Link href="/admin/gallery/new">
              <Plus className="size-4" /> New album
            </Link>
          </Button>
        }
      />

      {albums.length === 0 ? (
        <EmptyState
          icon={GalleryThumbnails}
          title="No albums yet"
          description="Create your first album to start curating photos."
          action={
            <Button asChild variant="primary">
              <Link href="/admin/gallery/new">New album</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <Card key={a.id} className="flex flex-col overflow-hidden">
              <Link href={`/admin/gallery/${a.id}`} className="block aspect-[16/9] bg-background-subtle">
                {a.cover ? (
                  <MediaThumb file={a.cover} />
                ) : (
                  <span className="flex size-full items-center justify-center text-soft">
                    <GalleryThumbnails className="size-8" />
                  </span>
                )}
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-sp-3">
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={a.status} />
                  <span className="text-caption text-soft">{a.photoCount} photos</span>
                </div>
                <h3 className="font-heading text-h3 font-bold text-ink">{a.title}</h3>
                <div className="mt-auto flex flex-wrap items-center gap-1">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/gallery/${a.id}`}>
                      <Settings2 className="size-4" /> Manage
                    </Link>
                  </Button>
                  {a.status !== "published" ? (
                    <ActionButton action={setAlbumStatus.bind(null, a.id, "published")} variant="primary">
                      <Send className="size-4" /> Publish
                    </ActionButton>
                  ) : (
                    <ActionButton action={setAlbumStatus.bind(null, a.id, "archived")} variant="outline">
                      <Archive className="size-4" /> Archive
                    </ActionButton>
                  )}
                  {a.status !== "draft" ? (
                    <ActionButton action={setAlbumStatus.bind(null, a.id, "draft")} variant="ghost">
                      <RotateCcw className="size-4" /> Draft
                    </ActionButton>
                  ) : null}
                  {isAdmin ? (
                    <ActionButton
                      action={deleteAlbum.bind(null, a.id)}
                      variant="ghost"
                      confirmMessage={`Delete album "${a.title}"?`}
                    >
                      <Trash2 className="size-4 text-danger" />
                    </ActionButton>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
