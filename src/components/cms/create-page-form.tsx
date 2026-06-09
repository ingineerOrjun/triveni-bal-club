"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/forms";
import { createPage } from "@/lib/cms/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      <Plus className="size-4" /> {pending ? "Creating…" : "Create page"}
    </Button>
  );
}

export function CreatePageForm() {
  const [state, formAction] = useActionState<FormState, FormData>(createPage, {});
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-sp-2">
      <div className="flex flex-1 flex-col gap-1.5">
        <label htmlFor="page-title" className="text-caption font-semibold text-ink">
          New page title
        </label>
        <Input id="page-title" name="title" placeholder="e.g. Our Programs" aria-invalid={Boolean(state.fieldErrors?.title)} />
      </div>
      <SubmitButton />
      {state.error ? (
        <p role="alert" className="inline-flex items-center gap-1 text-caption text-danger sm:basis-full">
          <AlertCircle className="size-3.5" /> {state.error}
        </p>
      ) : null}
    </form>
  );
}
