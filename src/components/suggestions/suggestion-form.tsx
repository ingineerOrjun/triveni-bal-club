"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Send, Save, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/forms";
import type { SuggestionCategoryRow, TagRow } from "@/types/database";
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

export interface SuggestionFormValues {
  title: string;
  description: string;
  category_id: string;
  visibility: "private" | "members" | "public";
  is_anonymous: boolean;
  tagIds: string[];
}

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function Buttons() {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap items-center gap-sp-2">
      <Button
        type="submit"
        name="intent"
        value="submit"
        variant="primary"
        size="lg"
        disabled={pending}
      >
        <Send className="size-4" /> {pending ? "Working…" : "Submit idea"}
      </Button>
      <Button
        type="submit"
        name="intent"
        value="draft"
        variant="outline"
        size="lg"
        disabled={pending}
      >
        <Save className="size-4" /> Save as draft
      </Button>
      <Button asChild variant="ghost">
        <Link href="/portal/my-suggestions">Cancel</Link>
      </Button>
    </div>
  );
}

export function SuggestionForm({
  action,
  categories,
  tags,
  values,
}: {
  action: Action;
  categories: SuggestionCategoryRow[];
  tags: TagRow[];
  values?: Partial<SuggestionFormValues>;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const selectedTags = new Set(values?.tagIds ?? []);

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
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={values?.title}
          placeholder="A short, clear summary of your idea"
          aria-invalid={Boolean(state.fieldErrors?.title)}
        />
        <FieldError id="title" message={state.fieldErrors?.title} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={values?.description}
          placeholder="Explain your idea, the problem it solves, and how it could work…"
          aria-invalid={Boolean(state.fieldErrors?.description)}
        />
        <FieldError id="description" message={state.fieldErrors?.description} />
      </div>

      <div className="grid gap-sp-3 sm:grid-cols-2">
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
          <Label htmlFor="visibility">Who can see this?</Label>
          <Select name="visibility" defaultValue={values?.visibility ?? "members"}>
            <SelectTrigger id="visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private (only staff &amp; me)</SelectItem>
              <SelectItem value="members">Members</SelectItem>
              <SelectItem value="public">Public (if approved)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-caption font-semibold text-ink">Tags</legend>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <label
              key={t.id}
              className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface px-3 py-1.5 text-caption text-ink has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-active"
            >
              <input
                type="checkbox"
                name="tags"
                value={t.id}
                defaultChecked={selectedTags.has(t.id)}
                className="size-4 accent-[var(--primary)]"
              />
              {t.name}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-body text-ink">
        <input
          type="checkbox"
          name="is_anonymous"
          defaultChecked={values?.is_anonymous ?? false}
          className="size-5 rounded accent-[var(--primary)]"
        />
        Submit anonymously
        <span className="text-caption text-soft">
          (hidden from other students &amp; the public; staff retain
          accountability)
        </span>
      </label>

      <Buttons />
    </form>
  );
}
