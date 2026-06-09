"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Save, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/forms";
import type { AchievementCategoryRow } from "@/types/database";
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

export interface BadgeFormValues {
  name: string;
  description: string;
  icon: string;
  category_id: string;
  criteria: string;
  image_url: string;
  is_active: boolean;
}

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

const ICON_OPTIONS = [
  "Award",
  "Star",
  "Trophy",
  "Medal",
  "Crown",
  "PartyPopper",
  "Users",
  "HandHeart",
  "HeartHandshake",
  "MessageSquare",
  "ClipboardList",
  "Sparkles",
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending}>
      <Save className="size-4" /> {pending ? "Saving…" : label}
    </Button>
  );
}

export function BadgeForm({
  action,
  categories,
  values,
  submitLabel = "Save badge",
}: {
  action: Action;
  categories: AchievementCategoryRow[];
  values?: Partial<BadgeFormValues>;
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={values?.name}
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
          <FieldError id="name" message={state.fieldErrors?.name} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="icon">Icon</Label>
          <Select name="icon" defaultValue={values?.icon || "Award"}>
            <SelectTrigger id="icon">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ICON_OPTIONS.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        <div className="flex flex-col gap-1.5">
          <MediaField
            name="image_url"
            label="Image (optional)"
            defaultValue={values?.image_url}
            help="Choose from the Media Library, or upload a new image."
          />
          <FieldError id="image_url" message={state.fieldErrors?.image_url} />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="criteria">Criteria (how members earn it)</Label>
          <Input
            id="criteria"
            name="criteria"
            defaultValue={values?.criteria}
            placeholder="e.g. Attend 5 events"
          />
        </div>
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

      <label className="flex items-center gap-2 text-body text-ink">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={values?.is_active ?? true}
          className="size-5 rounded accent-[var(--primary)]"
        />
        Active (visible and awardable)
      </label>

      <div className="flex items-center gap-sp-2">
        <SubmitButton label={submitLabel} />
        <Button asChild variant="ghost">
          <Link href="/admin/badges">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
