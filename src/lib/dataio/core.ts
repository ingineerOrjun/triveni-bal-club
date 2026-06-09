import type { ModuleMeta, ColumnMapping, RowIssue } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+0-9][0-9\s-]{5,}$/;

/** Apply a column mapping to one source row → { columnKey: value }. */
export function mapRow(
  module: ModuleMeta,
  source: Record<string, string>,
  mapping: ColumnMapping
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const col of module.columns) {
    const header = mapping[col.key];
    out[col.key] = header ? (source[header] ?? "").trim() : "";
  }
  return out;
}

/**
 * Validate mapped rows against the module's column definitions.
 * Pure & deterministic — shared by the client preview and the server import so
 * the same rules apply in both places (the server run is authoritative).
 */
export function validateRows(
  module: ModuleMeta,
  rows: Record<string, string>[]
): { issues: RowIssue[]; validRowNumbers: Set<number> } {
  const issues: RowIssue[] = [];
  const invalid = new Set<number>();
  const seen = new Map<string, number>(); // uniqueness on email/title

  rows.forEach((row, i) => {
    const rowNumber = i + 1;
    let rowInvalid = false;
    const flag = (issue: Omit<RowIssue, "row">) => {
      issues.push({ row: rowNumber, ...issue });
      rowInvalid = true;
    };

    for (const col of module.columns) {
      const value = row[col.key] ?? "";
      if (col.required && !value) {
        flag({ field: col.key, value, rule: "required", message: `${col.label} is required.` });
        continue;
      }
      if (!value) continue;
      if (col.type === "email" && !EMAIL_RE.test(value))
        flag({ field: col.key, value, rule: "email", message: "Invalid email address.", suggestion: "name@example.com" });
      if (col.type === "phone" && !PHONE_RE.test(value))
        flag({ field: col.key, value, rule: "phone", message: "Invalid phone number." });
      if (col.type === "number" && Number.isNaN(Number(value)))
        flag({ field: col.key, value, rule: "number", message: "Must be a number." });
      if (col.type === "enum" && col.enumValues && !col.enumValues.includes(value.toLowerCase()))
        flag({
          field: col.key,
          value,
          rule: "enum",
          message: `Must be one of: ${col.enumValues.join(", ")}.`,
          suggestion: col.enumValues[0],
        });
      if (col.maxLength && value.length > col.maxLength)
        flag({ field: col.key, value, rule: "maxLength", message: `Max length is ${col.maxLength}.` });
    }

    // Uniqueness on the first email/required-text column.
    const uniqueCol = module.columns.find((c) => c.type === "email") ?? module.columns.find((c) => c.required);
    if (uniqueCol) {
      const key = (row[uniqueCol.key] ?? "").toLowerCase();
      if (key) {
        const prev = seen.get(key);
        if (prev !== undefined)
          flag({
            field: uniqueCol.key,
            value: row[uniqueCol.key],
            rule: "duplicate",
            message: `Duplicate ${uniqueCol.label} (also on row ${prev}).`,
          });
        else seen.set(key, rowNumber);
      }
    }

    if (rowInvalid) invalid.add(rowNumber);
  });

  const validRowNumbers = new Set<number>();
  rows.forEach((_, i) => {
    if (!invalid.has(i + 1)) validRowNumbers.add(i + 1);
  });
  return { issues, validRowNumbers };
}
