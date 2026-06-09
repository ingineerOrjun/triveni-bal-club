import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ImportJobRow, ExportJobRow } from "@/types/database";

export async function listImportJobs(limit = 15): Promise<ImportJobRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("import_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as ImportJobRow[] | null) ?? [];
}

export async function listExportJobs(limit = 15): Promise<ExportJobRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("export_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as ExportJobRow[] | null) ?? [];
}

export interface IoAnalytics {
  importsToday: number;
  exportsToday: number;
  failedImports: number;
  importSuccessRate: number;
}

export async function getIoAnalytics(): Promise<IoAnalytics> {
  if (!isSupabaseConfigured())
    return { importsToday: 0, exportsToday: 0, failedImports: 0, importSuccessRate: 100 };
  const supabase = await createClient();
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  const headCount = (b: () => PromiseLike<{ count: number | null }>) => b().then((r) => r.count ?? 0);

  const [importsToday, exportsToday, failedImports, completedImports] = await Promise.all([
    headCount(() => supabase.from("import_jobs").select("*", { count: "exact", head: true }).gte("created_at", sinceIso)),
    headCount(() => supabase.from("export_jobs").select("*", { count: "exact", head: true }).gte("created_at", sinceIso)),
    headCount(() => supabase.from("import_jobs").select("*", { count: "exact", head: true }).eq("status", "failed")),
    headCount(() => supabase.from("import_jobs").select("*", { count: "exact", head: true }).eq("status", "completed")),
  ]);

  const totalFinished = failedImports + completedImports;
  return {
    importsToday,
    exportsToday,
    failedImports,
    importSuccessRate: totalFinished === 0 ? 100 : Math.round((completedImports / totalFinished) * 100),
  };
}
