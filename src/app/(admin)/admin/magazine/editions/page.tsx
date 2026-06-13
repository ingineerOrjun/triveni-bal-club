import type { Metadata } from "next";
import Link from "next/link";
import { Trash2, Send, Undo2, Archive, ExternalLink } from "lucide-react";
import { listEditions } from "@/lib/magazine/queries";
import { setEditionStatus, deleteEdition } from "@/lib/magazine/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/shared/action-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { CreateEditionForm } from "@/components/magazine/admin-forms";
import { editionLabel } from "@/components/magazine/edition-card";

export const metadata: Metadata = { title: "Editions", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MagazineEditionsPage() {
  const editions = await listEditions();
  return (
    <>
      <PortalPageHeader title="Editions" description="Group articles into volumes and issues (e.g. Vol. 1 · Issue 3 — Science Special)." />

      <Card className="mb-sp-4">
        <CardHeader><CardTitle>Create an edition</CardTitle></CardHeader>
        <CardContent><CreateEditionForm /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All editions</CardTitle></CardHeader>
        <CardContent>
          {editions.length === 0 ? (
            <p className="text-body text-soft">No editions yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {editions.map((e) => {
                const label = editionLabel(e);
                return (
                  <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading font-bold text-ink">{e.title}</span>
                        <StatusBadge status={e.status} />
                        {label ? <Badge variant="soft">{label}</Badge> : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {e.status === "published" ? (
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/magazine/${e.slug}`} target="_blank"><ExternalLink className="size-4" /> View</Link>
                        </Button>
                      ) : null}
                      {e.status !== "published" ? (
                        <ActionButton action={setEditionStatus.bind(null, e.id, "published")} variant="primary" confirmMessage="Publish this edition?">
                          <Send className="size-4" /> Publish
                        </ActionButton>
                      ) : (
                        <ActionButton action={setEditionStatus.bind(null, e.id, "draft")} variant="outline">
                          <Undo2 className="size-4" /> Unpublish
                        </ActionButton>
                      )}
                      {e.status !== "archived" ? (
                        <ActionButton action={setEditionStatus.bind(null, e.id, "archived")} variant="ghost">
                          <Archive className="size-4" /> Archive
                        </ActionButton>
                      ) : null}
                      <ActionButton action={deleteEdition.bind(null, e.id)} variant="ghost" confirmMessage={`Delete edition "${e.title}"? Articles will be unassigned.`}>
                        <Trash2 className="size-4 text-danger" />
                      </ActionButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
