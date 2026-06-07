import type { Metadata } from "next";
import { Mail, ShieldCheck, CalendarDays, BadgeCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { roleLabel } from "@/lib/auth/roles";
import { formatDate } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PortalPageHeader } from "@/components/portal/page-header";
import { ChangePasswordCard } from "@/components/portal/change-password-card";

export const metadata: Metadata = {
  title: "Account settings",
  robots: { index: false, follow: false },
};

export default async function AccountSettingsPage() {
  const user = await getCurrentUser();

  const rows = [
    { icon: Mail, label: "Email", value: user?.email ?? "—" },
    { icon: ShieldCheck, label: "Role", value: roleLabel(user?.role ?? "member") },
    {
      icon: BadgeCheck,
      label: "Membership",
      value: user?.profile?.membershipStatus ?? "active",
    },
    {
      icon: CalendarDays,
      label: "Member since",
      value: user?.profile?.joinedOn ? formatDate(user.profile.joinedOn) : "—",
    },
  ];

  return (
    <>
      <PortalPageHeader
        title="Account settings"
        description="Manage your account details and security."
      />

      <div className="flex flex-col gap-sp-4">
        {/* Account details */}
        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
            <CardDescription>
              Some details can only be changed by an administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-sp-3 sm:grid-cols-2">
              {rows.map((row) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.label}
                    className="flex items-start gap-2 rounded-md border border-line bg-surface-2 p-sp-2"
                  >
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-active">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <dt className="text-caption font-semibold uppercase tracking-wide text-soft">
                        {row.label}
                      </dt>
                      <dd className="text-body font-semibold capitalize text-ink">
                        {row.value}
                      </dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Change your password via a secure email link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordCard email={user?.email ?? ""} />
          </CardContent>
        </Card>

        {/* Status note */}
        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>
              You&apos;re signed in. Use “Sign out” in the sidebar to end your
              session on this device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="success">Active session</Badge>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
