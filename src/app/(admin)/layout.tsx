import { requireRole } from "@/lib/auth/session";
import { STAFF_ROLES } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getApprovalCenter } from "@/lib/admin/approvals";
import { AdminShell, type AdminContextData } from "@/components/admin/admin-shell";

// Admin area is staff-only and session-bound.
export const dynamic = "force-dynamic";

async function loadContext(): Promise<AdminContextData> {
  const empty: AdminContextData = { approvalsTotal: 0, approvals: [], recent: [] };
  if (!isSupabaseConfigured()) return empty;

  const approvals = await getApprovalCenter();
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, created_at")
    .order("created_at", { ascending: false })
    .limit(6);
  const recent = (
    (data as { id: string; action: string; entity_type: string; created_at: string }[] | null) ?? []
  ).map((r) => ({ id: r.id, action: r.action, entity: r.entity_type, at: r.created_at }));

  return {
    approvalsTotal: approvals.total,
    approvals: approvals.buckets
      .filter((b) => b.count > 0)
      .slice(0, 6)
      .map((b) => ({ title: b.title, count: b.count, href: b.href })),
    recent,
  };
}

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side gate: moderator or admin only.
  const [user, context] = await Promise.all([requireRole(STAFF_ROLES), loadContext()]);

  return (
    <AdminShell user={{ fullName: user.fullName, role: user.role }} context={context}>
      {children}
    </AdminShell>
  );
}
