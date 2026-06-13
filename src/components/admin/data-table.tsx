"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  className?: string;
  /** th alignment helper */
  align?: "left" | "right" | "center";
}

export interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  rows: T[];
  /** Enables row selection + a sticky bulk-action bar. */
  selectable?: boolean;
  /** Enables a compact column visibility chooser. */
  enableColumnVisibility?: boolean;
  /** Render the bulk bar when 1+ rows are selected. */
  renderBulkBar?: (selectedIds: string[], clear: () => void) => React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * Reusable admin table. Rendering, sorting, filtering & pagination are driven by
 * the *page* (server, via URL params); this component owns presentation +
 * client-side selection and the bulk-action bar.
 */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  selectable = false,
  enableColumnVisibility = false,
  renderBulkBar,
  emptyTitle = "Nothing here yet",
  emptyDescription,
}: DataTableProps<T>) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = React.useState<Set<string>>(
    () => new Set(columns.map((column) => column.key))
  );

  // Drop selections that are no longer present (e.g. after a filter change).
  React.useEffect(() => {
    setSelected((prev) => {
      const ids = new Set(rows.map((r) => r.id));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [rows]);

  React.useEffect(() => {
    setVisibleColumns((prev) => {
      const keys = new Set(columns.map((column) => column.key));
      const next = new Set([...prev].filter((key) => keys.has(key)));
      for (const key of keys) {
        if (next.size === 0) next.add(key);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [columns]);

  const allChecked = rows.length > 0 && selected.size === rows.length;
  const someChecked = selected.size > 0 && !allChecked;
  const shownColumns = enableColumnVisibility
    ? columns.filter((column) => visibleColumns.has(column.key))
    : columns;

  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleColumn(key: string) {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key) && next.size > 1) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  const clear = () => setSelected(new Set());

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="flex flex-col gap-sp-2">
      {selectable && selected.size > 0 && renderBulkBar ? (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-sp-2 rounded-md border border-line bg-surface p-sp-2 shadow-md">
          <span className="text-caption font-semibold text-ink">
            {selected.size} selected
          </span>
          {renderBulkBar([...selected], clear)}
        </div>
      ) : null}

      {enableColumnVisibility ? (
        <div className="flex justify-end">
          <details className="relative">
            <summary className="cursor-pointer rounded-md border border-line bg-surface px-3 py-2 text-caption font-semibold text-ink shadow-sm transition-colors hover:bg-background-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Columns
            </summary>
            <div className="absolute right-0 z-20 mt-2 min-w-48 rounded-md border border-line bg-surface p-2 shadow-md">
              {columns.map((column) => (
                <label
                  key={column.key}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-caption text-ink hover:bg-background-subtle"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(column.key)}
                    onChange={() => toggleColumn(column.key)}
                    disabled={visibleColumns.has(column.key) && visibleColumns.size === 1}
                    className="size-4 accent-[var(--primary)]"
                  />
                  {column.header}
                </label>
              ))}
            </div>
          </details>
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            {selectable ? (
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked;
                  }}
                  onChange={toggleAll}
                  aria-label="Select all rows"
                  className="size-4 accent-[var(--primary)]"
                />
              </TableHead>
            ) : null}
            {shownColumns.map((c) => (
              <TableHead
                key={c.key}
                className={cn(
                  c.align === "right" && "text-right",
                  c.align === "center" && "text-center",
                  c.className
                )}
              >
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const checked = selected.has(row.id);
            return (
              <TableRow key={row.id} data-state={checked ? "selected" : undefined}>
                {selectable ? (
                  <TableCell className="w-10">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(row.id)}
                      aria-label="Select row"
                      className="size-4 accent-[var(--primary)]"
                    />
                  </TableCell>
                ) : null}
                {shownColumns.map((c) => (
                  <TableCell
                    key={c.key}
                    className={cn(
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                      c.className
                    )}
                  >
                    {c.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
