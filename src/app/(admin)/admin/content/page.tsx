import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/admin/settings";
import { saveHomepage, saveSeo } from "@/lib/admin/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = {
  title: "Website content",
  robots: { index: false, follow: false },
};

export default async function ContentPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin");
  const settings = await getSettings();

  return (
    <>
      <PortalPageHeader
        title="Website content"
        description="Edit homepage copy and default SEO without touching code."
      />

      <div className="flex flex-col gap-sp-4">
        <Card>
          <CardHeader>
            <CardTitle>Homepage hero</CardTitle>
            <CardDescription>
              The headline visitors see first on the public homepage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm
              action={saveHomepage}
              values={settings.homepage}
              fields={[
                { name: "heroTitle", label: "Hero title", type: "textarea" },
                { name: "heroSubtitle", label: "Hero subtitle", type: "textarea" },
                { name: "heroCtaLabel", label: "Button label" },
                { name: "heroCtaHref", label: "Button link", placeholder: "/about" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO defaults</CardTitle>
            <CardDescription>
              Used for search engines &amp; social sharing when a page has no
              specific values.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm
              action={saveSeo}
              values={settings.seo}
              fields={[
                { name: "defaultTitle", label: "Default title" },
                { name: "defaultDescription", label: "Default description", type: "textarea" },
                { name: "ogImage", label: "Open Graph image path", placeholder: "/gallery/triveni-05.jpeg" },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
