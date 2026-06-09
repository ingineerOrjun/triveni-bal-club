# Phase 8.2 — Import / Export Wizard

A guided, validated, audited import/export system with a **plugin architecture**
so any module registers with minimal effort. Extends existing
auth/RBAC/RLS/audit/DataTable/design-system — nothing rewritten.

> Scope (consistent with Phases 8 / 8.1): production-quality **CSV** import
> (Members, Activities) and **CSV/JSON** export (Members, Activities, Events,
> Suggestions, Achievements) through the wizard, full job/template/log/validation
> schema, history + analytics. XLSX/ODS/ZIP, background queue, scheduled/emailed
> exports, PDF, and rollback are documented as roadmap below.

---

## Plugin / extension architecture (the core API)
Everything is driven by a **registry** of `ModuleMeta`
([`registry.ts`](../src/lib/dataio/registry.ts)) — client-safe metadata:
`key`, `label`, `columns` (with `type`, `required`, `aliases`, `enumValues`,
`maxLength`), and `supportsImport` / `supportsExport` flags. The wizard and the
export panel render entirely from this list.

To add a module:
1. Add a `ModuleMeta` entry to `MODULES`.
2. For **import**: add an `Importer` to `IMPORTERS` in
   [`importers.ts`](../src/lib/dataio/importers.ts) (`(rows, {mode, validRowNumbers}) => result`).
3. For **export**: add an `Exporter` to `EXPORTERS` in
   [`exporters.ts`](../src/lib/dataio/exporters.ts) (`() => {headers, rows}`).

No UI changes are needed — the module appears in the wizard/export panel
automatically. This is the plug-in foundation future modules (Magazine,
Elections, Notifications) use.

## Import architecture (6-step wizard)
[`import-wizard.tsx`](../src/components/dataio/import-wizard.tsx):
**Module → Upload → Preview → Map → Validate → Import → Summary.**
- **Upload/Preview/Map** happen client-side ([`csv.ts`](../src/lib/dataio/csv.ts)
  parser, `autoMap` by header/alias) for instant UX.
- **Validate** and **Import** are **server actions** ([`validate.ts`](../src/lib/dataio/validate.ts),
  [`import.ts`](../src/lib/dataio/import.ts)) — the client preview is never
  trusted; the server re-parses the raw file and re-validates with the shared
  [`core.ts`](../src/lib/dataio/core.ts) rules.
- Each run records an `import_job` (+ `validation_errors`, audit) with row
  counts; the summary offers a downloadable **error report** CSV.

**Import modes:** insert-only · upsert · ignore-duplicates · **dry-run**
(validate, no writes). No partial corruption — invalid rows are excluded and
counted, valid rows import.

## Validation guide ([core.ts](../src/lib/dataio/core.ts))
Per-column: required, email, phone, number, enum (against `enumValues`),
max-length; plus **uniqueness** on the natural key (email/required column) within
the file. Issues carry `{row, field, value, rule, message, suggestion}` and are
shown in the preview and exported to CSV. Add custom business rules by extending
`validateRows` or an importer.

## Export architecture
Generic route [`/api/admin/export?module=…&format=csv|json`](../src/app/api/admin/export/route.ts)
— admin-guarded, runs the module exporter, records an `export_job` + audit, and
streams the file. The [export panel](../src/components/dataio/export-panel.tsx)
just builds the URL.

## History & analytics
[`/admin/import`](../src/app/(admin)/admin/import/page.tsx) and
[`/admin/export`](../src/app/(admin)/admin/export/page.tsx) show recent jobs and
widgets (imports today, success rate, failed imports, exports today) from
[`jobs.ts`](../src/lib/dataio/jobs.ts).

## Templates guide
`import_templates` / `export_templates` + `column_mappings` tables exist for
saving/reusing mappings and filters. The wizard's `autoMap` covers the common
case; a save/load-template UI is a small additive step on these tables.

## Security
Admin-only at every layer (middleware → page redirect → `requireAdminUser` in
actions/route → RLS on all io tables). File type/extension/size validated;
a `virusScanHook` slot is documented in the upload path (shared with the Media
Library). Every import/export run is audit-logged. Member creation during import
uses the service-role admin client server-side only.

## Administrator guide
**Import:** open *Import*, pick a module, drop a CSV, check the preview, confirm
the auto-mapped columns (or remap), **Validate** (download the error report if
needed), pick a mode (use **Dry run** first), then **Run import** and read the
summary. **Export:** open *Export*, choose a module + format, **Download**.

## Troubleshooting
- *"Import not supported for this module"* — only modules with `supportsImport`
  have an importer (Members, Activities today).
- *Rows failed* — download the error report; fix the flagged cells; re-upload.
  Validation runs before any writes, so failures never corrupt data.
- *Members import created accounts* — new emails create accounts (random
  password; users reset via the forgot-password flow). Existing emails update in
  *upsert* mode, skip otherwise.
- *Large files* — current processing is synchronous (good for thousands of
  rows). 100k+ rows should use the background queue (roadmap).

## Developer guide
Engines live in `src/lib/dataio/` (`registry`, `csv`, `core`, `validate`,
`import`, `importers`, `exporters`, `jobs`). Reads are batched (no N+1); writes
are guarded + audited. Follow the existing `FormState`/server-action patterns.

---

## Roadmap (documented, not yet built)
- **XLSX / ODS / JSON / ZIP** import parsing; **ZIP / PDF** export packages.
- **Background job queue** (chunked, cancellable, resumable) + **notifications**
  for very large datasets; **scheduled** and **emailed** exports.
- **Rollback** of a completed import (job + `import_rows` snapshot already
  modelled).
- **Save/load mapping & filter templates** UI; **saved filters** on export.
- Importers/exporters for the remaining registered modules (events,
  registrations, attendance, achievements, badges, certificates, recognition,
  gallery, settings) — each is one `Importer`/`Exporter` function.
