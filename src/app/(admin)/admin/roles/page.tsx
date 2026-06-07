import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check, Minus, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISSIONS, roleLabel, type UserRole, type Permission } from "@/lib/auth/roles";
import { PortalPageHeader } from "@/components/portal/page-header";
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

export const metadata: Metadata = {
  title: "Roles & permissions",
  robots: { index: false, follow: false },
};

const ROLES: UserRole[] = ["member", "moderator", "admin"];

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  public: "Anonymous website visitors.",
  member: "Students: portal access, participation, suggestions, recognition.",
  moderator: "Review & moderate content; recommend recognition; no certificates or settings.",
  admin: "Full management of the entire portal.",
};

const PERMISSION_LABELS: Record<Permission, string> = {
  "profile:edit-own": "Edit own profile",
  "member:manage": "Manage members & roles",
  "role:assign": "Assign roles",
  "content:moderate": "Moderate content (activities, events, suggestions)",
  "audit:read": "View audit logs",
};

export default async function RolesPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin");

  const permissions = Object.keys(PERMISSIONS) as Permission[];

  return (
    <>
      <PortalPageHeader
        title="Roles & permissions"
        description="The role-based access model enforced across middleware, server actions, and the database."
      />

      <div className="mb-sp-4 grid gap-sp-3 sm:grid-cols-3">
        {ROLES.map((r) => (
          <Card key={r}>
            <CardContent className="flex flex-col gap-1 p-sp-3">
              <Badge variant={r === "admin" ? "primary" : r === "moderator" ? "soft" : "neutral"} className="w-fit">
                {roleLabel(r)}
              </Badge>
              <p className="text-caption text-soft">{ROLE_DESCRIPTIONS[r]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary-active" /> Permission matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="p-sp-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission</TableHead>
                {ROLES.map((r) => (
                  <TableHead key={r} className="text-center">
                    {roleLabel(r)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((perm) => {
                const allowed = PERMISSIONS[perm] as readonly UserRole[];
                return (
                  <TableRow key={perm}>
                    <TableCell className="font-semibold">
                      {PERMISSION_LABELS[perm] ?? perm}
                      <code className="ml-2 text-[0.7rem] text-soft">{perm}</code>
                    </TableCell>
                    {ROLES.map((r) => (
                      <TableCell key={r} className="text-center">
                        {allowed.includes(r) ? (
                          <Check className="mx-auto size-4 text-emerald-700" aria-label="Allowed" />
                        ) : (
                          <Minus className="mx-auto size-4 text-soft" aria-label="Not allowed" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="mt-sp-3 text-caption text-soft">
        Permissions are currently defined in code (<code>src/lib/auth/roles.ts</code>)
        and enforced by RLS in the database. Editable custom roles are on the
        roadmap (see <code>docs/phase8-admin-cms.md</code>).
      </p>
    </>
  );
}
