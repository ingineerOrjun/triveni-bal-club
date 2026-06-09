import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/supabase/audit";
import { EXPORTERS } from "@/lib/dataio/exporters";
import { toCsv } from "@/lib/dataio/csv";

/**
 * GET /api/admin/export?module=members&format=csv|json
 * Streams an export of the chosen module. Admin only; records an export job.
 */
export async function GET(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const module = request.nextUrl.searchParams.get("module") ?? "";
  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";
  const exporter = EXPORTERS[module];
  if (!exporter) {
    return NextResponse.json({ error: "Unknown export module" }, { status: 400 });
  }

  const { headers, rows } = await exporter();
  const date = new Date().toISOString().slice(0, 10);

  // Record the export job + audit (best-effort).
  try {
    const supabase = await createClient();
    await supabase.from("export_jobs").insert({
      module,
      status: "completed",
      format,
      row_count: rows.length,
      created_by: user.id,
      finished_at: new Date().toISOString(),
    });
    await logAudit(supabase, "export.run", "export_job", null, { module, format, rows: rows.length });
  } catch {
    /* non-blocking */
  }

  if (format === "json") {
    return new NextResponse(JSON.stringify(rows, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${module}-${date}.json"`,
      },
    });
  }

  return new NextResponse(toCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${module}-${date}.csv"`,
    },
  });
}
