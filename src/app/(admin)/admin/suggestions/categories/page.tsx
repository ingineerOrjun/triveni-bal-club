import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listCategories } from "@/lib/suggestions/queries";
import { setCategoryActive } from "@/lib/suggestions/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActionButton } from "@/components/shared/action-button";
import { CategoryForm } from "@/components/suggestions/category-form";

export const metadata: Metadata = {
  title: "Suggestion categories",
  robots: { index: false, follow: false },
};

export default async function SuggestionCategoriesPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin/suggestions");

  const categories = await listCategories();

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-sp-2">
        <Link href="/admin/suggestions">
          <ArrowLeft className="size-4" /> Back to suggestions
        </Link>
      </Button>

      <PortalPageHeader
        title="Suggestion categories"
        description="Categories help organise member ideas. Admin-managed."
      />

      <div className="grid gap-sp-4 lg:grid-cols-[1fr_1.3fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryForm />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-sp-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold">{c.name}</TableCell>
                    <TableCell>
                      {c.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="neutral">Archived</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.is_active ? (
                        <ActionButton
                          action={setCategoryActive.bind(null, c.id, false)}
                          variant="ghost"
                        >
                          Archive
                        </ActionButton>
                      ) : (
                        <ActionButton
                          action={setCategoryActive.bind(null, c.id, true)}
                          variant="ghost"
                        >
                          Restore
                        </ActionButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
