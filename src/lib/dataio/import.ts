"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/auth/guards";
import { logAudit } from "@/lib/supabase/audit";
import { getModule } from "./registry";
import { parseCsv } from "./csv";
import { mapRow, validateRows } from "./core";
import { IMPORTERS } from "./importers";
import type { ColumnMapping, ImportModeValue, ImportSummary } from "./types";
import type { ImportMode } from "@/types/database";

export async function runImport(
  moduleKey: string,
  rawText: string,
  mapping: ColumnMapping,
  mode: ImportModeValue
): Promise<ImportSummary> {
  const base: ImportSummary = { total: 0, imported: 0, skipped: 0, failed: 0, issues: [] };
  const user = await requireAdminUser();
  if (!user) return { ...base, error: "Admins only." };
  if (!isSupabaseConfigured()) return { ...base, error: "Backend not configured." };

  const module = getModule(moduleKey);
  const importer = IMPORTERS[moduleKey];
  if (!module || !importer) return { ...base, error: "Import is not supported for this module." };

  const parsed = parseCsv(rawText);
  const mapped = parsed.rows.map((r) => mapRow(module, r, mapping));
  const { issues, validRowNumbers } = validateRows(module, mapped);
  const total = parsed.rows.length;

  const supabase = await createClient();

  // Create the job record.
  const { data: jobRow } = await supabase
    .from("import_jobs")
    .insert({
      module: moduleKey,
      status: "processing",
      mode: mode as ImportMode,
      total_rows: total,
      valid_rows: validRowNumbers.size,
      error_rows: total - validRowNumbers.size,
      created_by: user.id,
    })
    .select("id")
    .single();
  const jobId = (jobRow as { id: string } | null)?.id;

  // Run the module importer.
  const result = await importer(mapped, { mode, validRowNumbers });

  const allIssues = [...issues, ...result.issues];

  if (jobId) {
    await supabase
      .from("import_jobs")
      .update({
        status: mode === "dry_run" ? "ready" : "completed",
        imported_rows: result.imported,
        skipped_rows: result.skipped,
        error_rows: total - validRowNumbers.size + result.failed,
        finished_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (allIssues.length > 0) {
      await supabase.from("validation_errors").insert(
        allIssues.slice(0, 500).map((iss) => ({
          job_id: jobId,
          row_number: iss.row,
          field: iss.field ?? null,
          value: iss.value ?? null,
          rule: iss.rule ?? null,
          message: iss.message,
          suggestion: iss.suggestion ?? null,
        }))
      );
    }
    await logAudit(supabase, mode === "dry_run" ? "import.dry_run" : "import.run", "import_job", jobId, {
      module: moduleKey,
      imported: result.imported,
    });
  }

  revalidatePath("/admin/import");
  return {
    jobId,
    total,
    imported: result.imported,
    skipped: result.skipped,
    failed: total - validRowNumbers.size + result.failed,
    issues: allIssues.slice(0, 200),
    message:
      mode === "dry_run"
        ? `Dry run complete — ${result.imported} row(s) would import.`
        : `Imported ${result.imported}, skipped ${result.skipped}, failed ${total - validRowNumbers.size + result.failed}.`,
  };
}
