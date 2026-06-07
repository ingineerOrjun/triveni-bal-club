import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { PortalPageHeader } from "@/components/portal/page-header";
import { ProfileForm } from "@/components/portal/profile-form";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <>
      <PortalPageHeader
        title="My profile"
        description="Update your personal details. These are visible to club staff."
      />
      <Card className="p-sp-4">
        <ProfileForm
          values={{
            fullName: user?.fullName ?? "",
            email: user?.email ?? "",
            classLevel: user?.profile?.classLevel ?? "",
            section: user?.profile?.section ?? "",
            bio: user?.profile?.bio ?? "",
            avatarUrl: user?.avatarUrl ?? "",
            interests: user?.profile?.interests ?? [],
          }}
        />
      </Card>
    </>
  );
}
