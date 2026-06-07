import { NextResponse } from "next/server";
import { requireStaffUser } from "@/lib/auth/guards";
import { listAllMembersForExport } from "@/lib/admin/members";

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** GET /api/admin/members/export — CSV download of all members (staff only). */
export async function GET() {
  const user = await requireStaffUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await listAllMembersForExport();
  const headers = [
    "Name",
    "Email",
    "Role",
    "Active",
    "Class",
    "Section",
    "Membership",
    "Joined",
  ];
  const rows = members.map((m) =>
    [
      m.full_name,
      m.email,
      m.role,
      m.is_active ? "yes" : "no",
      m.classLevel ?? "",
      m.section ?? "",
      m.membershipStatus ?? "",
      m.created_at.slice(0, 10),
    ]
      .map(csvCell)
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="members-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
