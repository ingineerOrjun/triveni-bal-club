import { requireRole } from "@/lib/auth/session";
import { STAFF_ROLES } from "@/lib/auth/roles";
import { AdminShell } from "@/components/admin/admin-shell";

// Admin area is staff-only and session-bound.
export const dynamic = "force-dynamic";

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side gate: moderator or admin only.
  const user = await requireRole(STAFF_ROLES);

  return (
    <AdminShell user={{ fullName: user.fullName, role: user.role }}>
      {children}
    </AdminShell>
  );
}
