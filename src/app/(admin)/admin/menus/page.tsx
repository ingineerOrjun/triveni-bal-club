import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listMenus, getMenuItems } from "@/lib/cms/queries";
import { PortalPageHeader } from "@/components/portal/page-header";
import { MenuManager, type MenuWithItems } from "@/components/cms/menu-manager";

export const metadata: Metadata = {
  title: "Menus",
  robots: { index: false, follow: false },
};

export default async function AdminMenusPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin" && user?.role !== "moderator") redirect("/admin");

  const menus = await listMenus();
  const withItems: MenuWithItems[] = await Promise.all(
    menus.map(async (menu) => ({ menu, items: await getMenuItems(menu.id) }))
  );

  return (
    <>
      <PortalPageHeader
        title="Menus"
        description="Build header, footer, and quick-link navigation visually."
      />
      <MenuManager menus={withItems} />
    </>
  );
}
