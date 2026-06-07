"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/forms";
import type { AttendanceStatus } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface AttendanceRosterEntry {
  memberId: string;
  name: string;
  email: string;
  status: AttendanceStatus | null;
}

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      <Save className="size-4" /> {pending ? "Saving…" : "Save attendance"}
    </Button>
  );
}

/**
 * Roster with present/absent radio per member. Submits all marks at once via
 * the bound `markAttendance` action (named `att:<memberId>`).
 */
export function AttendanceTable({
  roster,
  action,
}: {
  roster: AttendanceRosterEntry[];
  action: Action;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  if (roster.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-line-strong bg-surface-2 p-sp-3 text-body text-soft">
        No registered members to mark yet.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-sp-3">
      {state.message ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md border border-success/40 bg-success-bg/50 px-3 py-2 text-caption text-emerald-700"
        >
          <CheckCircle2 className="size-4 shrink-0" /> {state.message}
        </div>
      ) : null}
      {state.error ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger-bg/50 px-3 py-2 text-caption text-danger"
        >
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead className="w-28 text-center">Present</TableHead>
            <TableHead className="w-28 text-center">Absent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roster.map((m) => (
            <TableRow key={m.memberId}>
              <TableCell>
                <span className="font-semibold text-ink">{m.name}</span>
                <span className="block text-caption text-soft">{m.email}</span>
              </TableCell>
              <TableCell className="text-center">
                <input
                  type="radio"
                  name={`att:${m.memberId}`}
                  value="present"
                  defaultChecked={m.status === "present"}
                  aria-label={`Mark ${m.name} present`}
                  className="size-5 accent-[var(--primary)]"
                />
              </TableCell>
              <TableCell className="text-center">
                <input
                  type="radio"
                  name={`att:${m.memberId}`}
                  value="absent"
                  defaultChecked={m.status === "absent"}
                  aria-label={`Mark ${m.name} absent`}
                  className="size-5 accent-[var(--danger)]"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div>
        <SaveButton />
      </div>
    </form>
  );
}
