"use server";

import { requireAdminUser } from "@/lib/auth/guards";
import { getModule } from "./registry";
import { parseCsv } from "./csv";
import { mapRow, validateRows } from "./core";
import type { ColumnMapping, ValidatePreview } from "./types";

const EMPTY: ValidatePreview = {
  headers: [],
  sample: [],
  total: 0,
  valid: 0,
  invalid: 0,
  issues: [],
};

/** Authoritative server-side validation (never trusts the client preview). */
export async function validateImport(
  moduleKey: string,
  rawText: string,
  mapping: ColumnMapping
): Promise<ValidatePreview> {
  const user = await requireAdminUser();
  if (!user) return { ...EMPTY, issues: [{ row: 0, message: "Admins only." }] };

  const module = getModule(moduleKey);
  if (!module) return { ...EMPTY, issues: [{ row: 0, message: "Unknown module." }] };

  const parsed = parseCsv(rawText);
  const mapped = parsed.rows.map((r) => mapRow(module, r, mapping));
  const { issues, validRowNumbers } = validateRows(module, mapped);

  return {
    headers: parsed.headers,
    sample: mapped.slice(0, 50),
    total: parsed.rows.length,
    valid: validRowNumbers.size,
    invalid: parsed.rows.length - validRowNumbers.size,
    issues: issues.slice(0, 200),
  };
}
