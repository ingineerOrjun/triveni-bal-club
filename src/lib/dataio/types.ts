/** Shared, client-safe types for the Import/Export engine. */

export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "date"
  | "enum"
  | "number"
  | "boolean";

export interface ColumnDef {
  key: string;
  label: string;
  required?: boolean;
  type?: FieldType;
  /** Header names that auto-map to this column (lowercased). */
  aliases?: string[];
  enumValues?: string[];
  maxLength?: number;
}

export interface ModuleMeta {
  key: string;
  label: string;
  description: string;
  columns: ColumnDef[];
  supportsImport: boolean;
  supportsExport: boolean;
}

export type ImportModeValue =
  | "insert"
  | "upsert"
  | "ignore_duplicates"
  | "dry_run";

export interface RowIssue {
  row: number;
  field?: string;
  value?: string;
  rule?: string;
  message: string;
  suggestion?: string;
}

export interface ValidatePreview {
  headers: string[];
  sample: Record<string, string>[];
  total: number;
  valid: number;
  invalid: number;
  issues: RowIssue[];
}

export interface ImportSummary {
  jobId?: string;
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  issues: RowIssue[];
  message?: string;
  error?: string;
}

/** mapping: target column key -> source header name */
export type ColumnMapping = Record<string, string>;
