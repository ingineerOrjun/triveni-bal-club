"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Save, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/forms";
import type { AchievementCategoryRow } from "@/types/database";
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

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending}>
      <Save className="size-4" /> {pending ? "Saving…" : label}
    </Button>
  );
}

export function AchievementForm({
  action,
  members,
  categories,
  canChooseVisibility = true,
  submitLabel = "Save achievement",
}: {
  action: Action;
  members: MemberRef[];
  categories: AchievementCategoryRow[];
  canChooseVisibility?: boolean;
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
          <Label htmlFor="category_id">Category</Label>
          <Select name="category_id">
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

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            aria-invalid={Boolean(state.fieldErrors?.title)}
          />
          <FieldError id="title" message={state.fieldErrors?.title} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="award_date">Award date</Label>
          <Input id="award_date" name="award_date" type="date" />
        </div>

        {canChooseVisibility ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="visibility">Visibility</Label>
            <Select name="visibility" defaultValue="members">
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="members">Members only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <input type="hidden" name="visibility" value="members" />
        )}

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="evidence">Evidence (optional link or note)</Label>
          <Input id="evidence" name="evidence" placeholder="https://… or a short note" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} />
      </div>

      <div className="flex items-center gap-sp-2">
        <SubmitButton label={submitLabel} />
        <Button asChild variant="ghost">
          <Link href="/admin/achievements">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
