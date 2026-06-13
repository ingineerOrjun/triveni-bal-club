"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Save, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/forms";
import type { ActivityCategoryRow } from "@/types/database";
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
import { MediaField } from "@/components/media/media-field";
import { MediaMultiField } from "@/components/media/media-multi-field";

export interface ActivityFormValues {
  title: string;
  title_ne: string;
  description: string;
  category_id: string;
  cover_url: string;
  gallery: string[];
  starts_on: string;
  ends_on: string;
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

export function ActivityForm({
  action,
  categories,
  values,
  submitLabel = "Save activity",
}: {
  action: Action;
  categories: ActivityCategoryRow[];
  values?: Partial<ActivityFormValues>;
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category_id">Category</Label>
          <Select name="category_id" defaultValue={values?.category_id || undefined}>
            <SelectTrigger id="category_id">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2">
          <MediaField name="cover_url" label="Cover image" defaultValue={values?.cover_url ?? ""} />
          <FieldError id="cover_url" message={state.fieldErrors?.cover_url} />
        </div>

        <div className="sm:col-span-2">
          <MediaMultiField
            name="gallery"
            label="Photo gallery"
            defaultValue={values?.gallery ?? []}
            help="Add multiple photos from the Media Library — shown on the public activity page."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="starts_on">Start date</Label>
          <Input
            id="starts_on"
            name="starts_on"
            type="date"
            defaultValue={values?.starts_on}
          />
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
          <Link href="/admin/activities">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
