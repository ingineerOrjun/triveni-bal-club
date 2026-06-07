import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Archive, RotateCcw, Trash2, Link2, ExternalLink } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getFileDetail, listFolders } from "@/lib/media/queries";
import { archiveFile, restoreFile, deleteFile } from "@/lib/media/actions";
import { humanSize } from "@/lib/media/storage";
import { formatDateTime } from "@/lib/format";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MediaThumb } from "@/components/media/media-thumb";
import { FileMetaForm } from "@/components/media/file-meta-form";
import { ActionButton } from "@/components/shared/action-button";

export const metadata: Metadata = {
  title: "Media file",
  robots: { index: false, follow: false },
};

export default async function MediaFilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, file, folders] = await Promise.all([
    getCurrentUser(),
    getFileDetail(id),
    listFolders(),
  ]);
  if (!file) notFound();
  const isAdmin = user?.role === "admin";
  const inUse = file.usage.length > 0;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/admin/media">
          <ArrowLeft className="size-4" /> Media library
        </Link>
      </Button>

      <PortalPageHeader
        title={file.filename}
        action={
          <div className="flex items-center gap-1">
            {file.status === "archived" ? (
              <ActionButton action={restoreFile.bind(null, id)} variant="outline">
                <RotateCcw className="size-4" /> Restore
              </ActionButton>
            ) : (
              <ActionButton action={archiveFile.bind(null, id)} variant="outline">
                <Archive className="size-4" /> Archive
              </ActionButton>
            )}
            {isAdmin ? (
              <ActionButton
                action={deleteFile.bind(null, id)}
                variant="ghost"
                confirmMessage={
                  inUse
                    ? "This file is in use — deletion will be blocked. Continue anyway?"
                    : "Permanently delete this file?"
                }
              >
                <Trash2 className="size-4 text-danger" />
              </ActionButton>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-sp-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-sp-3">
          <Card className="overflow-hidden">
            <div className="aspect-square bg-background-subtle">
              <MediaThumb file={file} />
            </div>
            <CardContent className="flex flex-col gap-1 p-sp-3 text-caption text-soft">
              <span>{file.mime_type} · {humanSize(file.size)}{file.width ? ` · ${file.width}×${file.height}` : ""}</span>
              <span>Uploaded {formatDateTime(file.created_at)}</span>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant={file.status === "active" ? "success" : "neutral"}>{file.status}</Badge>
                <Badge variant="soft">{file.visibility}</Badge>
              </div>
              {file.public_url ? (
                <div className="flex flex-wrap gap-2 pt-sp-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={file.public_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" /> Open
                    </a>
                  </Button>
                  <span className="inline-flex items-center gap-1 text-caption">
                    <Link2 className="size-3.5" /> public URL available
                  </span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage ({file.usage.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {file.usage.length === 0 ? (
                <p className="text-body text-soft">
                  Not used anywhere yet. Files in use cannot be deleted.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {file.usage.map((u) => (
                    <li key={u.id} className="flex items-center justify-between gap-2 text-caption">
                      <span className="text-ink">{u.label ?? `${u.module} · ${u.entity_type}`}</span>
                      <Badge variant="neutral">{u.module}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <FileMetaForm
              id={id}
              folders={folders}
              values={{
                filename: file.filename,
                alt_text: file.alt_text ?? "",
                caption: file.caption ?? "",
                description: file.description ?? "",
                folder_id: file.folder_id ?? "",
              }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
