import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePortalAccess } from "@/lib/auth/session";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewArticleForm } from "@/components/magazine/admin-forms";

export const metadata: Metadata = { title: "Write an article" };

export default async function NewArticlePage() {
  await requirePortalAccess("/portal/magazine/new");
  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/portal/magazine"><ArrowLeft className="size-4" /> My magazine</Link>
      </Button>
      <PortalPageHeader
        title="Write an article"
        description="Give your story a title to begin. You'll add content with the block editor next."
      />
      <Card>
        <CardContent className="pt-sp-4">
          <NewArticleForm scope="portal" />
        </CardContent>
      </Card>
    </>
  );
}
