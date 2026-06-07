"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, CheckCircle2, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/forms";
import { createCategory } from "@/lib/suggestions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/shared/field-error";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      <Plus className="size-4" /> {pending ? "Adding…" : "Add category"}
    </Button>
  );
}

export function CategoryForm() {
  const [state, formAction] = useActionState<FormState, FormData>(
    createCategory,
    {}
  );
  return (
    <form action={formAction} className="flex flex-col gap-sp-2">
      <div className="grid gap-sp-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" aria-invalid={Boolean(state.fieldErrors?.name)} />
          <FieldError id="name" message={state.fieldErrors?.name} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name_ne">Name (Nepali)</Label>
          <Input id="name_ne" name="name_ne" lang="ne" className="font-nepali" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Input id="description" name="description" />
      </div>
      <label className="flex items-center gap-2 text-body text-ink">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked
          className="size-5 rounded accent-[var(--primary)]"
        />
        Active
      </label>
      <div className="flex items-center gap-sp-2">
        <Submit />
        {state.message ? (
          <p role="status" className="inline-flex items-center gap-1 text-caption text-emerald-700">
            <CheckCircle2 className="size-3.5" /> {state.message}
          </p>
        ) : null}
        {state.error ? (
          <p role="alert" className="inline-flex items-center gap-1 text-caption text-danger">
            <AlertCircle className="size-3.5" /> {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
