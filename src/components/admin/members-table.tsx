"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { MemberRow } from "@/lib/admin/members";
import { bulkMemberAction } from "@/lib/admin/actions";
import type { FormState } from "@/lib/forms";
import { roleLabel } from "@/lib/auth/roles";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/admin/data-table";

const columns: Column<MemberRow>[] = [
  {
    key: "name",
    header: "Member",
    render: (m) => (
      <div className="min-w-0">
        <Link
          href={`/admin/members/${m.id}`}
          className="font-semibold text-ink hover:text-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          {m.full_name}
        </Link>
        <span className="block truncate text-caption text-soft">{m.email}</span>
      </div>
    ),
  },
  {
    key: "role",
    header: "Role",
    render: (m) => (
      <Badge variant={m.role === "admin" ? "primary" : m.role === "moderator" ? "soft" : "neutral"}>
        {roleLabel(m.role)}
      </Badge>
    ),
  },
  {
    key: "class",
    header: "Class",
    render: (m) =>
      m.classLevel ? `${m.classLevel}${m.section ? ` · ${m.section}` : ""}` : "—",
  },
  {
    key: "status",
    header: "Status",
    render: (m) =>
      m.is_active ? (
        <Badge variant="success">Active</Badge>
      ) : (
        <Badge variant="neutral">Inactive</Badge>
      ),
  },
  {
    key: "joined",
    header: "Joined",
    align: "right",
    render: (m) => (
      <span className="text-caption text-soft">{formatDate(m.created_at)}</span>
    ),
  },
];

export function MembersTable({ rows }: { rows: MemberRow[] }) {
  const [state, formAction] = useActionState<FormState, FormData>(
    bulkMemberAction,
    {}
  );

  return (
    <DataTable
      rows={rows}
      columns={columns}
      selectable
      emptyTitle="No members match"
      emptyDescription="Try adjusting your search or filters."
      renderBulkBar={(ids) => (
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          {ids.map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}
          <select
            name="op"
            aria-label="Bulk action"
            defaultValue="role:member"
            className="h-9 rounded-md border border-line bg-surface px-2 text-caption text-ink"
          >
            <option value="role:member">Set role → Member</option>
            <option value="role:moderator">Set role → Moderator</option>
            <option value="role:admin">Set role → Admin</option>
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
          </select>
          <Button type="submit" size="sm" variant="primary">
            Apply
          </Button>
          {state.error ? (
            <span role="alert" className="text-caption text-danger">
              {state.error}
            </span>
          ) : null}
          {state.message ? (
            <span role="status" className="text-caption text-emerald-700">
              {state.message}
            </span>
          ) : null}
        </form>
      )}
    />
  );
}
