import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, History, RotateCcw } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getPage, listVersions } from "@/lib/cms/queries";
import { rollbackToVersion } from "@/lib/cms/actions";
import { formatDateTime } from "@/lib/format";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageBuilder } from "@/components/cms/page-builder";
import { ActionButton } from "@/components/shared/action-button";

export const metadata: Metadata = {
  title: "Edit page",
  robots: { index: false, follow: false },
};

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "admin" && user?.role !== "moderator") redirect("/admin");
  const { id } = await params;

  const [page, versions] = await Promise.all([getPage(id), listVersions(id)]);
  if (!page) notFound();

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/admin/pages">
          <ArrowLeft className="size-4" /> All pages
        </Link>
      </Button>

      <PortalPageHeader title="Edit page" description={`/${page.slug}`} />

      <div className="grid gap-sp-4 lg:grid-cols-[1fr_300px]">
        <PageBuilder
          pageId={page.id}
          slug={page.slug}
          status={page.status}
          initialTitle={page.title}
          initialBlocks={page.blocks}
          initialSeo={page.seo}
          canCustomHtml={user?.role === "admin"}
        />

        <aside>
          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2">
                <History className="size-5 text-primary-active" /> Version history
              </CardTitle>
            </CardHeader>
            <CardContent>
              {versions.length === 0 ? (
                <p className="text-body text-soft">
                  No versions yet. A snapshot is saved each time you publish.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-line">
                  {versions.map((v) => (
                    <li key={v.id} className="flex items-center justify-between gap-2 py-2">
                      <span className="min-w-0">
                        <span className="block font-semibold text-ink">v{v.version}</span>
                        <span className="block text-caption text-soft">
                          {v.note ?? "Snapshot"} · {formatDateTime(v.created_at)}
                        </span>
                      </span>
                      <ActionButton
                        action={rollbackToVersion.bind(null, page.id, v.id)}
                        variant="ghost"
                        confirmMessage={`Restore version ${v.version}? Current content is snapshotted first.`}
                      >
                        <RotateCcw className="size-4" />
                      </ActionButton>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
