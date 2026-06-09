import type { ModuleMeta, ColumnMapping } from "./types";

/**
 * Plugin registry — client-safe metadata for every import/export module.
 * To add a module: add an entry here + (for import) an importer and (for export)
 * an exporter in `src/lib/dataio/server.ts`. The wizard & export panel are
 * fully data-driven from this list.
 */
export const MODULES: ModuleMeta[] = [
  {
    key: "members",
    label: "Members",
    description: "Member accounts, roles, class & section.",
    supportsImport: true,
    supportsExport: true,
    columns: [
      { key: "full_name", label: "Full name", required: true, type: "text", aliases: ["name", "fullname", "member"] },
      { key: "email", label: "Email", required: true, type: "email", aliases: ["e-mail", "mail"] },
      { key: "role", label: "Role", type: "enum", enumValues: ["member", "moderator", "admin"], aliases: ["user role"] },
      { key: "class_level", label: "Class", type: "text", aliases: ["class", "grade", "level"] },
      { key: "section", label: "Section", type: "text" },
    ],
  },
  {
    key: "activities",
    label: "Activities",
    description: "Club activities catalogue.",
    supportsImport: true,
    supportsExport: true,
    columns: [
      { key: "title", label: "Title", required: true, type: "text", aliases: ["name", "activity"] },
      { key: "category", label: "Category (slug)", type: "text", aliases: ["cat"] },
      { key: "description", label: "Description", type: "text", maxLength: 4000 },
      { key: "status", label: "Status", type: "enum", enumValues: ["draft", "published", "archived"] },
    ],
  },
  {
    key: "events",
    label: "Events",
    description: "Events with venue, schedule & capacity.",
    supportsImport: false,
    supportsExport: true,
    columns: [
      { key: "title", label: "Title", type: "text" },
      { key: "venue", label: "Venue", type: "text" },
      { key: "starts_at", label: "Starts at", type: "date" },
      { key: "capacity", label: "Capacity", type: "number" },
      { key: "status", label: "Status", type: "text" },
    ],
  },
  {
    key: "suggestions",
    label: "Suggestions",
    description: "Student Voice suggestions.",
    supportsImport: false,
    supportsExport: true,
    columns: [
      { key: "title", label: "Title", type: "text" },
      { key: "status", label: "Status", type: "text" },
      { key: "priority", label: "Priority", type: "text" },
      { key: "support_count", label: "Support", type: "number" },
      { key: "created_at", label: "Created", type: "date" },
    ],
  },
  {
    key: "achievements",
    label: "Achievements",
    description: "Member achievements.",
    supportsImport: false,
    supportsExport: true,
    columns: [
      { key: "title", label: "Title", type: "text" },
      { key: "visibility", label: "Visibility", type: "text" },
      { key: "status", label: "Status", type: "text" },
      { key: "award_date", label: "Award date", type: "date" },
    ],
  },
];

export function getModule(key: string): ModuleMeta | undefined {
  return MODULES.find((m) => m.key === key);
}

/** Auto-map source headers → target columns using key/label/alias matching. */
export function autoMap(module: ModuleMeta, headers: string[]): ColumnMapping {
  const norm = (s: string) => s.trim().toLowerCase().replace(/[\s_-]+/g, " ");
  const mapping: ColumnMapping = {};
  for (const col of module.columns) {
    const candidates = new Set(
      [col.key, col.label, ...(col.aliases ?? [])].map(norm)
    );
    const match = headers.find((h) => candidates.has(norm(h)));
    if (match) mapping[col.key] = match;
  }
  return mapping;
}
