import { requirePortalAccess } from "@/lib/auth/session";
import { PortalShell } from "@/components/portal/portal-shell";

// Portal is per-user and session-bound — never static.
export const dynamic = "force-dynamic";

export default async function PortalGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side gate: authenticated + portal role, else redirect.
  const user = await requirePortalAccess();

  return (
    <PortalShell
      user={{
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      }}
    >
      {children}
    </PortalShell>
  );
}
