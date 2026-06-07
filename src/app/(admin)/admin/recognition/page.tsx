import type { Metadata } from "next";
import Link from "next/link";
import {
  Plus,
  Send,
  Archive,
  RotateCcw,
  Trash2,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { listPrograms } from "@/lib/recognition/queries";
import { setProgramStatus, deleteProgram } from "@/lib/recognition/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Recognition programs",
  robots: { index: false, follow: false },
};

export default async function AdminRecognitionPage() {
  const programs = await listPrograms();

  return (
    <>
      <PortalPageHeader
        title="Recognition programs"
        description="Run campaigns like Member of the Month and record winners."
        action={
          <Button asChild variant="primary">
            <Link href="/admin/recognition/new">
              <Plus className="size-4" /> New program
            </Link>
          </Button>
        }
      />

      {programs.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No programs yet"
          description="Create a recognition program to celebrate outstanding members."
        />
      ) : (
        <div className="flex flex-col gap-sp-2">
          {programs.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-col gap-sp-2 p-sp-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/admin/recognition/${p.id}`}
                    className="font-heading text-h3 font-bold text-ink hover:text-primary-active"
                  >
                    {p.name}
                  </Link>
                  {p.description ? (
                    <p className="line-clamp-1 text-caption text-soft">
                      {p.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <StatusBadge status={p.status} />
                  {p.status !== "published" ? (
                    <ActionButton
                      action={setProgramStatus.bind(null, p.id, "published")}
                      variant="primary"
                    >
                      <Send className="size-4" /> Publish
                    </ActionButton>
                  ) : (
                    <ActionButton
                      action={setProgramStatus.bind(null, p.id, "archived")}
                      variant="outline"
                    >
                      <Archive className="size-4" /> Archive
                    </ActionButton>
                  )}
                  {p.status !== "draft" ? (
                    <ActionButton
                      action={setProgramStatus.bind(null, p.id, "draft")}
                      variant="ghost"
                    >
                      <RotateCcw className="size-4" /> Draft
                    </ActionButton>
                  ) : null}
                  <ActionButton
                    action={deleteProgram.bind(null, p.id)}
                    variant="ghost"
                    confirmMessage={`Delete "${p.name}" and its awards?`}
                  >
                    <Trash2 className="size-4 text-danger" />
                  </ActionButton>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/recognition/${p.id}`}>
                      Manage <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
