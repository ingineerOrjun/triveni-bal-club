"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/shared/field-error";

export interface AlbumFormValues {
  title: string;
  description: string;
  category: string;
  seo_description: string;
  featured: boolean;
}

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      <Save className="size-4" /> {pending ? "Saving…" : label}
    </Button>
  );
}

export function AlbumForm({
  action,
  values,
  submitLabel = "Save album",
  showFeatured = false,
}: {
  action: Action;
  values?: Partial<AlbumFormValues>;
  submitLabel?: string;
  showFeatured?: boolean;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-sp-3">
      {state.error ? (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger-bg/50 px-3 py-2 text-caption text-danger">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={values?.title} aria-invalid={Boolean(state.fieldErrors?.title)} />
        <FieldError id="title" message={state.fieldErrors?.title} />
      </div>
      <div className="grid gap-sp-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" defaultValue={values?.category} placeholder="e.g. Events" />
        </div>
        {showFeatured ? (
          <label className="mt-6 flex items-center gap-2 text-body text-ink">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={values?.featured ?? false}
              className="size-5 rounded accent-[var(--primary)]"
            />
            Featured album
          </label>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={values?.description} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="seo_description">SEO description</Label>
        <Input id="seo_description" name="seo_description" defaultValue={values?.seo_description} />
      </div>
      <div>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
