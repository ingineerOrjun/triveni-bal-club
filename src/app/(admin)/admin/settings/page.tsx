import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/admin/settings";
import { saveGeneral, saveContact, saveSocial, saveFeatures } from "@/lib/admin/actions";
import { PortalPageHeader } from "@/components/portal/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin");
  const settings = await getSettings();

  return (
    <>
      <PortalPageHeader
        title="Settings"
        description="Club information, contact details, social links, and feature toggles."
      />

      <div className="flex flex-col gap-sp-4">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Club &amp; school identity.</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm
              action={saveGeneral}
              values={settings.general}
              fields={[
                { name: "clubName", label: "Club name" },
                { name: "schoolName", label: "School name" },
                { name: "academicYear", label: "Academic year" },
                { name: "timezone", label: "Timezone" },
                { name: "language", label: "Default language" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
            <CardDescription>Shown on the public website &amp; footer.</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm
              action={saveContact}
              values={settings.contact}
              fields={[
                { name: "email", label: "Email" },
                { name: "phone", label: "Phone" },
                { name: "address", label: "Address", type: "textarea" },
                { name: "officeHours", label: "Office hours" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social links</CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsForm
              action={saveSocial}
              values={settings.social}
              fields={[
                { name: "facebook", label: "Facebook URL", type: "url" },
                { name: "instagram", label: "Instagram URL", type: "url" },
                { name: "youtube", label: "YouTube URL", type: "url" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature toggles</CardTitle>
            <CardDescription>Turn portal modules on or off.</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm
              action={saveFeatures}
              values={settings.features}
              toggles={[
                { name: "studentVoice", label: "Student Voice / Suggestions" },
                { name: "recognition", label: "Achievements & Recognition" },
                { name: "maintenanceMode", label: "Maintenance mode" },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
