"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Trophy, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/forms";
import type { MemberRef } from "@/lib/recognition/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldError } from "@/components/shared/field-error";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      <Trophy className="size-4" /> {pending ? "Saving…" : "Give award"}
    </Button>
  );
}

export function AwardForm({
  action,
  programId,
  members,
}: {
  action: Action;
  programId: string;
  members: MemberRef[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-sp-3" noValidate>
      <input type="hidden" name="program_id" value={programId} />
      {state.error ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger-bg/50 px-3 py-2 text-caption text-danger"
        >
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      ) : null}

      <div className="grid gap-sp-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="member_id">Recipient</Label>
          <Select name="member_id">
            <SelectTrigger id="member_id" aria-invalid={Boolean(state.fieldErrors?.member_id)}>
              <SelectValue placeholder="Choose a member" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError id="member_id" message={state.fieldErrors?.member_id} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="period_label">Period (optional)</Label>
          <Input id="period_label" name="period_label" placeholder="e.g. June 2026" />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="title">Award title</Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g. Member of the Month — June"
            aria-invalid={Boolean(state.fieldErrors?.title)}
          />
          <FieldError id="title" message={state.fieldErrors?.title} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea id="note" name="note" rows={2} />
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
