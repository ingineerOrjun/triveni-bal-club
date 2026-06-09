"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Download,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { ModuleMeta, ColumnMapping, ValidatePreview, ImportSummary, ImportModeValue } from "@/lib/dataio/types";
import { getModule, autoMap } from "@/lib/dataio/registry";
import { parseCsv } from "@/lib/dataio/csv";
import { validateImport } from "@/lib/dataio/validate";
import { runImport } from "@/lib/dataio/import";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STEPS = ["Module", "Upload", "Preview", "Map", "Validate", "Import"];
const MODES: { value: ImportModeValue; label: string }[] = [
  { value: "insert", label: "Insert new only" },
  { value: "upsert", label: "Upsert (create or update)" },
  { value: "ignore_duplicates", label: "Ignore duplicates" },
  { value: "dry_run", label: "Dry run (validate, no writes)" },
];

function downloadErrorReport(preview: ValidatePreview | ImportSummary) {
  const head = "row,field,value,rule,message,suggestion";
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = preview.issues
    .map((i) => [i.row, i.field, i.value, i.rule, i.message, i.suggestion].map(esc).join(","))
    .join("\n");
  const blob = new Blob([`${head}\n${body}`], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "import-errors.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportWizard({ modules }: { modules: ModuleMeta[] }) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [moduleKey, setModuleKey] = React.useState<string>("");
  const [fileName, setFileName] = React.useState("");
  const [rawText, setRawText] = React.useState("");
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [sampleRows, setSampleRows] = React.useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = React.useState<ColumnMapping>({});
  const [preview, setPreview] = React.useState<ValidatePreview | null>(null);
  const [mode, setMode] = React.useState<ImportModeValue>("insert");
  const [summary, setSummary] = React.useState<ImportSummary | null>(null);
  const [busy, setBusy] = React.useState(false);

  const moduleMeta = moduleKey ? getModule(moduleKey) : undefined;

  function reset() {
    setStep(1);
    setModuleKey("");
    setFileName("");
    setRawText("");
    setHeaders([]);
    setSampleRows([]);
    setMapping({});
    setPreview(null);
    setSummary(null);
  }

  async function onFile(file: File) {
    const text = await file.text();
    setFileName(file.name);
    setRawText(text);
    const parsed = parseCsv(text);
    setHeaders(parsed.headers);
    setSampleRows(parsed.rows.slice(0, 20));
    if (moduleMeta) setMapping(autoMap(moduleMeta, parsed.headers));
    setStep(3);
  }

  async function doValidate() {
    if (!moduleMeta) return;
    setBusy(true);
    try {
      setPreview(await validateImport(moduleKey, rawText, mapping));
      setStep(5);
    } finally {
      setBusy(false);
    }
  }

  async function doImport() {
    setBusy(true);
    try {
      const result = await runImport(moduleKey, rawText, mapping, mode);
      setSummary(result);
      setStep(6);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-sp-4">
      {/* Stepper */}
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-2" aria-label="Import steps">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const current = n === step;
          return (
            <li key={label} className="flex items-center gap-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-caption font-semibold",
                  done && "bg-primary-soft text-primary-active",
                  current && "bg-primary text-on-primary",
                  !done && !current && "bg-background-subtle text-soft"
                )}
                aria-current={current ? "step" : undefined}
              >
                {done ? <Check className="size-3.5" /> : <span>{n}</span>} {label}
              </span>
              {i < STEPS.length - 1 ? <span aria-hidden className="h-px w-3 bg-line-strong" /> : null}
            </li>
          );
        })}
      </ol>

      {/* Step 1: module */}
      {step === 1 ? (
        <div className="grid gap-sp-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <button
              key={m.key}
              onClick={() => {
                setModuleKey(m.key);
                setStep(2);
              }}
              className="rounded-lg border border-line bg-surface p-sp-3 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="font-heading text-h3 font-bold text-ink">{m.label}</p>
              <p className="text-caption text-soft">{m.description}</p>
            </button>
          ))}
        </div>
      ) : null}

      {/* Step 2: upload */}
      {step === 2 ? (
        <Card>
          <CardContent className="p-sp-4">
            <label
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-line-strong bg-surface-2 p-sp-5 text-center hover:border-primary"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
              }}
            >
              <UploadCloud className="size-8 text-primary-active" />
              <span className="font-heading font-semibold text-ink">
                Drop a CSV file, or click to browse
              </span>
              <span className="text-caption text-soft">
                UTF-8 CSV (Nepali text supported). XLSX/ODS/ZIP coming soon.
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
            </label>
          </CardContent>
        </Card>
      ) : null}

      {/* Step 3: preview */}
      {step === 3 && headers.length > 0 ? (
        <Card>
          <CardContent className="p-sp-3">
            <p className="mb-sp-2 text-caption text-soft">
              {fileName} · {sampleRows.length} of many rows shown
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleRows.map((r, i) => (
                    <TableRow key={i}>
                      {headers.map((h) => (
                        <TableCell key={h} className="max-w-40 truncate">{r[h]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Step 4: mapping */}
      {step === 4 && moduleMeta ? (
        <Card>
          <CardContent className="flex flex-col gap-sp-3 p-sp-3">
            {moduleMeta.columns.map((col) => (
              <div key={col.key} className="flex flex-wrap items-center gap-sp-2">
                <span className="w-48 font-heading text-body font-semibold text-ink">
                  {col.label}
                  {col.required ? <span className="text-danger"> *</span> : null}
                </span>
                <select
                  value={mapping[col.key] ?? ""}
                  onChange={(e) => setMapping((prev) => ({ ...prev, [col.key]: e.target.value }))}
                  className="h-10 min-w-48 rounded-md border border-line bg-surface px-2 text-body text-ink"
                  aria-label={`Map ${col.label}`}
                >
                  <option value="">— not mapped —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Step 5: validate */}
      {step === 5 && preview ? (
        <Card>
          <CardContent className="flex flex-col gap-sp-3 p-sp-3">
            <div className="flex flex-wrap items-center gap-sp-3">
              <Badge variant="soft">{preview.total} rows</Badge>
              <Badge variant="success">{preview.valid} valid</Badge>
              <Badge variant={preview.invalid > 0 ? "danger" : "neutral"}>{preview.invalid} invalid</Badge>
              {preview.issues.length > 0 ? (
                <Button variant="ghost" size="sm" onClick={() => downloadErrorReport(preview)}>
                  <Download className="size-4" /> Error report
                </Button>
              ) : null}
            </div>
            {preview.issues.length > 0 ? (
              <div className="max-h-60 overflow-y-auto rounded-md border border-line">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Issue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.issues.map((iss, i) => (
                      <TableRow key={i}>
                        <TableCell>{iss.row}</TableCell>
                        <TableCell>{iss.field ?? "—"}</TableCell>
                        <TableCell className="text-danger">{iss.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="inline-flex items-center gap-2 text-body text-emerald-700">
                <CheckCircle2 className="size-4" /> All rows passed validation.
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-caption font-semibold text-ink" htmlFor="mode">Import mode</label>
              <select
                id="mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as ImportModeValue)}
                className="h-10 w-72 rounded-md border border-line bg-surface px-2 text-body text-ink"
              >
                {MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Step 6: summary */}
      {step === 6 && summary ? (
        <Card>
          <CardContent className="flex flex-col gap-sp-3 p-sp-4">
            {summary.error ? (
              <p className="inline-flex items-center gap-2 text-danger">
                <AlertCircle className="size-5" /> {summary.error}
              </p>
            ) : (
              <>
                <p className="inline-flex items-center gap-2 text-h3 font-bold text-ink">
                  <CheckCircle2 className="size-6 text-emerald-700" /> {summary.message}
                </p>
                <div className="flex flex-wrap gap-sp-2">
                  <Badge variant="success">{summary.imported} imported</Badge>
                  <Badge variant="neutral">{summary.skipped} skipped</Badge>
                  <Badge variant={summary.failed > 0 ? "danger" : "neutral"}>{summary.failed} failed</Badge>
                </div>
                {summary.issues.length > 0 ? (
                  <Button variant="ghost" size="sm" onClick={() => downloadErrorReport(summary)}>
                    <Download className="size-4" /> Download error report
                  </Button>
                ) : null}
              </>
            )}
            <div>
              <Button variant="primary" onClick={reset}>
                Import another file
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Footer nav */}
      {step > 1 && step < 6 ? (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={busy}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          {step === 3 ? (
            <Button variant="primary" onClick={() => setStep(4)}>
              Map columns <ArrowRight className="size-4" />
            </Button>
          ) : step === 4 ? (
            <Button variant="primary" onClick={doValidate} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null} Validate <ArrowRight className="size-4" />
            </Button>
          ) : step === 5 ? (
            <Button variant="primary" onClick={doImport} disabled={busy || (preview?.valid ?? 0) === 0}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode === "dry_run" ? "Run dry run" : "Run import"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
