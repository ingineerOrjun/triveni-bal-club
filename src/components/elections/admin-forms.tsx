"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import type { FormState } from "@/lib/forms";
import { createElection, addPosition } from "@/lib/elections/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/shared/field-error";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      <Plus className="size-4" /> {pending ? "Saving…" : label}
    </Button>
  );
}

export function CreateElectionForm() {
  const [state, action] = useActionState<FormState, FormData>(createElection, {});
  return (
    <form action={action} className="flex flex-col gap-sp-3">
      {state.error ? (
        <p role="alert" className="inline-flex items-center gap-1 text-caption text-danger">
          <AlertCircle className="size-3.5" /> {state.error}
        </p>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Election title</Label>
        <Input id="title" name="title" placeholder="e.g. Club Committee Election 2026" aria-invalid={Boolean(state.fieldErrors?.title)} />
        <FieldError id="title" message={state.fieldErrors?.title} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>
      <div>
        <Submit label="Create election" />
      </div>
    </form>
  );
}

export function AddPositionForm({ electionId }: { electionId: string }) {
  const [state, action] = useActionState<FormState, FormData>(
    addPosition.bind(null, electionId),
    {}
  );
  return (
    <form action={action} className="flex flex-wrap items-end gap-sp-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pos-title">Position</Label>
        <Input id="pos-title" name="title" placeholder="President" className="w-48" aria-invalid={Boolean(state.fieldErrors?.title)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pos-seats">Seats</Label>
        <Input id="pos-seats" name="seats" type="number" min={1} defaultValue={1} className="w-24" />
      </div>
      <Submit label="Add position" />
      {state.message ? (
        <span role="status" className="inline-flex items-center gap-1 text-caption text-emerald-700">
          <CheckCircle2 className="size-3.5" /> {state.message}
        </span>
      ) : null}
      <FieldError id="pos-title" message={state.fieldErrors?.title} />
    </form>
  );
}
