import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewArticleForm } from "@/components/magazine/admin-forms";

export const metadata: Metadata = { title: "New article", robots: { index: false, follow: false } };

export default function AdminNewArticlePage() {
  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/admin/magazine/articles"><ArrowLeft className="size-4" /> Articles</Link>
      </Button>
      <PortalPageHeader title="New article" description="Create a draft, then add content with the block editor." />
      <Card>
        <CardContent className="pt-sp-4">
          <NewArticleForm scope="admin" />
        </CardContent>
      </Card>
    </>
  );
}
