"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Save, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/shared/field-error";

export interface ProgramFormValues {
  name: string;
  description: string;
  criteria: string;
  starts_on: string;
  ends_on: string;
}

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending}>
      <Save className="size-4" /> {pending ? "Saving…" : label}
    </Button>
  );
}

export function ProgramForm({
  action,
  values,
  submitLabel = "Save program",
}: {
  action: Action;
  values?: Partial<ProgramFormValues>;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-sp-3" noValidate>
      {state.error ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger-bg/50 px-3 py-2 text-caption text-danger"
        >
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Program name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={values?.name}
          placeholder="e.g. Member of the Month"
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        <FieldError id="name" message={state.fieldErrors?.name} />
      </div>

      <div className="grid gap-sp-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="starts_on">Start date</Label>
          <Input id="starts_on" name="starts_on" type="date" defaultValue={values?.starts_on} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ends_on">End date</Label>
          <Input
            id="ends_on"
            name="ends_on"
            type="date"
            defaultValue={values?.ends_on}
            aria-invalid={Boolean(state.fieldErrors?.ends_on)}
          />
          <FieldError id="ends_on" message={state.fieldErrors?.ends_on} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="criteria">Criteria</Label>
        <Textarea
          id="criteria"
          name="criteria"
          rows={3}
          defaultValue={values?.criteria}
          placeholder="How winners are chosen…"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={values?.description}
        />
      </div>

      <div className="flex items-center gap-sp-2">
        <SubmitButton label={submitLabel} />
        <Button asChild variant="ghost">
          <Link href="/admin/recognition">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
