import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { listCategories } from "@/lib/magazine/queries";
import { deleteCategory } from "@/lib/magazine/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionButton } from "@/components/shared/action-button";
import { CategoryChip } from "@/components/magazine/category-chip";
import { CreateCategoryForm } from "@/components/magazine/admin-forms";

export const metadata: Metadata = { title: "Categories", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MagazineCategoriesPage() {
  const categories = await listCategories();
  return (
    <>
      <PortalPageHeader title="Categories" description="Organize stories into sections readers can browse and filter." />

      <Card className="mb-sp-4">
        <CardHeader><CardTitle>Add a category</CardTitle></CardHeader>
        <CardContent><CreateCategoryForm /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All categories</CardTitle></CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-body text-soft">No categories yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {categories.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 py-2.5">
                  <CategoryChip name={c.name} color={c.color} />
                  <ActionButton action={deleteCategory.bind(null, c.id)} variant="ghost" confirmMessage={`Delete category "${c.name}"? Articles keep their content but lose this category.`}>
                    <Trash2 className="size-4 text-danger" />
                  </ActionButton>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
