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

export interface EventFormValues {
  title: string;
  title_ne: string;
  description: string;
  venue: string;
  starts_at: string; // datetime-local
  ends_at: string;
  capacity: string;
  registration_deadline: string;
}

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending}>
      <Save className="size-4" />
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function EventForm({
  action,
  values,
  submitLabel = "Save event",
}: {
  action: Action;
  values?: Partial<EventFormValues>;
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

      <div className="grid gap-sp-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={values?.title}
            aria-invalid={Boolean(state.fieldErrors?.title)}
          />
          <FieldError id="title" message={state.fieldErrors?.title} />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="title_ne">Title (Nepali)</Label>
          <Input
            id="title_ne"
            name="title_ne"
            lang="ne"
            className="font-nepali"
            defaultValue={values?.title_ne}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="venue">Venue</Label>
          <Input id="venue" name="venue" defaultValue={values?.venue} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="starts_at">Starts</Label>
          <Input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            defaultValue={values?.starts_at}
            aria-invalid={Boolean(state.fieldErrors?.starts_at)}
          />
          <FieldError id="starts_at" message={state.fieldErrors?.starts_at} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ends_at">Ends</Label>
          <Input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            defaultValue={values?.ends_at}
            aria-invalid={Boolean(state.fieldErrors?.ends_at)}
          />
          <FieldError id="ends_at" message={state.fieldErrors?.ends_at} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="capacity">Capacity (optional)</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            placeholder="Unlimited if blank"
            defaultValue={values?.capacity}
            aria-invalid={Boolean(state.fieldErrors?.capacity)}
          />
          <FieldError id="capacity" message={state.fieldErrors?.capacity} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="registration_deadline">Registration deadline</Label>
          <Input
            id="registration_deadline"
            name="registration_deadline"
            type="datetime-local"
            defaultValue={values?.registration_deadline}
            aria-invalid={Boolean(state.fieldErrors?.registration_deadline)}
          />
          <FieldError
            id="registration_deadline"
            message={state.fieldErrors?.registration_deadline}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={values?.description}
        />
      </div>

      <div className="flex items-center gap-sp-2">
        <SubmitButton label={submitLabel} />
        <Button asChild variant="ghost">
          <Link href="/admin/events">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
