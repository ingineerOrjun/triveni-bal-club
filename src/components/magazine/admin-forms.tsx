"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  Plus,
  AlertCircle,
  CheckCircle2,
  Check,
  RotateCcw,
  X,
  CalendarClock,
  Star,
  StarOff,
  Trash2,
  Send,
  Archive,
} from "lucide-react";
import type { FormState } from "@/lib/forms";
import type { MagazineCategoryRow, MagazineEditionRow } from "@/types/database";
import {
  createArticle,
  createEdition,
  createCategory,
  reviewArticleForm,
  scheduleArticle,
  bulkSetStatus,
  bulkSetFeatured,
  bulkDelete,
  bulkMove,
} from "@/lib/magazine/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { FieldError } from "@/components/shared/field-error";
import { MediaField } from "@/components/media/media-field";

function Alerts({ state }: { state: FormState }) {
  return (
    <>
      {state.error ? (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger-bg/50 px-3 py-2 text-caption text-danger">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      ) : null}
      {state.message ? (
        <div role="status" className="flex items-center gap-2 rounded-md border border-success/40 bg-success-bg/50 px-3 py-2 text-caption text-emerald-700">
          <CheckCircle2 className="size-4 shrink-0" /> {state.message}
        </div>
      ) : null}
    </>
  );
}

function Pending({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {children}
    </Button>
  );
}

/* --------------------------- new article (title) -------------------------- */
export function NewArticleForm({ scope }: { scope: "portal" | "admin" }) {
  const [state, formAction] = useActionState<FormState, FormData>(createArticle, {});
  return (
    <form action={formAction} className="flex flex-col gap-2" noValidate>
      <input type="hidden" name="scope" value={scope} />
      <Alerts state={state} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-title">Article title</Label>
        <div className="flex gap-2">
          <Input id="new-title" name="title" placeholder="Give your story a working title" aria-invalid={Boolean(state.fieldErrors?.title)} className="flex-1" />
          <Pending><Plus className="size-4" /> Create draft</Pending>
        </div>
        <FieldError id="title" message={state.fieldErrors?.title} />
      </div>
    </form>
  );
}

/* ------------------------------ new edition ------------------------------- */
export function CreateEditionForm() {
  const [state, formAction] = useActionState<FormState, FormData>(createEdition, {});
  return (
    <form action={formAction} className="flex flex-col gap-sp-3" noValidate>
      <Alerts state={state} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ed-title">Title</Label>
        <Input id="ed-title" name="title" placeholder="e.g. Science Special" aria-invalid={Boolean(state.fieldErrors?.title)} />
        <FieldError id="title" message={state.fieldErrors?.title} />
      </div>
      <div className="grid gap-sp-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ed-volume">Volume</Label>
          <Input id="ed-volume" name="volume" type="number" min={0} placeholder="1" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ed-issue">Issue number</Label>
          <Input id="ed-issue" name="issue_number" type="number" min={0} placeholder="3" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ed-desc">Description</Label>
        <Textarea id="ed-desc" name="description" rows={2} />
      </div>
      <MediaField name="cover_image" label="Cover image" />
      <div><Pending><Plus className="size-4" /> Create edition</Pending></div>
    </form>
  );
}

/* ------------------------------ new category ------------------------------ */
export function CreateCategoryForm() {
  const [state, formAction] = useActionState<FormState, FormData>(createCategory, {});
  return (
    <form action={formAction} className="flex flex-col gap-sp-3" noValidate>
      <Alerts state={state} />
      <div className="grid gap-sp-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cat-name">Name</Label>
          <Input id="cat-name" name="name" placeholder="e.g. Science" aria-invalid={Boolean(state.fieldErrors?.name)} />
          <FieldError id="name" message={state.fieldErrors?.name} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cat-color">Color</Label>
          <Input id="cat-color" name="color" type="color" defaultValue="#10B981" className="h-10 w-16 p-1" />
        </div>
        <div className="flex items-end">
          <Pending><Plus className="size-4" /> Add</Pending>
        </div>
      </div>
    </form>
  );
}

/* -------------------------------- review ---------------------------------- */
export function ReviewForm({ articleId }: { articleId: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(
    reviewArticleForm.bind(null, articleId),
    {}
  );
  const { pending } = useFormStatus();
  return (
    <form action={formAction} className="flex flex-col gap-sp-2" noValidate>
      <Alerts state={state} />
      <Textarea name="remarks" rows={3} placeholder="Remarks for the author (optional for approval, recommended for revisions)" aria-label="Review remarks" />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="approve" variant="primary" disabled={pending}>
          <Check className="size-4" /> Approve
        </Button>
        <Button type="submit" name="decision" value="revise" variant="outline" disabled={pending}>
          <RotateCcw className="size-4" /> Request revision
        </Button>
        <Button type="submit" name="decision" value="reject" variant="ghost" disabled={pending}>
          <X className="size-4 text-danger" /> Send back
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------- schedule --------------------------------- */
export function ScheduleForm({ articleId }: { articleId: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(
    scheduleArticle.bind(null, articleId),
    {}
  );
  return (
    <form action={formAction} className="flex flex-col gap-2" noValidate>
      <Alerts state={state} />
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="scheduled_at">Publish at</Label>
          <Input id="scheduled_at" name="scheduled_at" type="datetime-local" aria-invalid={Boolean(state.fieldErrors?.scheduled_at)} />
        </div>
        <Pending><CalendarClock className="size-4" /> Schedule</Pending>
      </div>
      <FieldError id="scheduled_at" message={state.fieldErrors?.scheduled_at} />
    </form>
  );
}

/* ------------------------------- bulk bar --------------------------------- */
export function ArticleBulkBar({
  ids,
  clear,
  categories,
  editions,
}: {
  ids: string[];
  clear: () => void;
  categories: MagazineCategoryRow[];
  editions: MagazineEditionRow[];
}) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const count = ids.length;
  const run = (message: string, fn: () => Promise<void>) =>
    startTransition(async () => {
      await fn();
      clear();
      toast({ title: message, description: `${count} article${count === 1 ? "" : "s"} updated.`, variant: "success" });
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => run("Published", () => bulkSetStatus(ids, "published"))}>
        <Send className="size-4" /> Publish
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => run("Archived", () => bulkSetStatus(ids, "archived"))}>
        <Archive className="size-4" /> Archive
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => run("Featured", () => bulkSetFeatured(ids, true))}>
        <Star className="size-4" /> Feature
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => run("Unfeatured", () => bulkSetFeatured(ids, false))}>
        <StarOff className="size-4" /> Unfeature
      </Button>
      <select
        aria-label="Move to edition"
        className="rounded-md border border-line bg-surface px-2 py-1.5 text-caption"
        defaultValue=""
        disabled={pending}
        onChange={(e) => {
          const v = e.target.value;
          run("Moved to edition", () => bulkMove(ids, "edition_id", v || null));
        }}
      >
        <option value="" disabled>Move to edition…</option>
        <option value="">Unassigned</option>
        {editions.map((ed) => <option key={ed.id} value={ed.id}>{ed.title}</option>)}
      </select>
      <select
        aria-label="Change category"
        className="rounded-md border border-line bg-surface px-2 py-1.5 text-caption"
        defaultValue=""
        disabled={pending}
        onChange={(e) => {
          const v = e.target.value;
          run("Category changed", () => bulkMove(ids, "category_id", v || null));
        }}
      >
        <option value="" disabled>Change category…</option>
        <option value="">No category</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (window.confirm(`Delete ${ids.length} article(s)? This cannot be undone.`)) {
            run("Deleted", () => bulkDelete(ids));
          }
        }}
      >
        <Trash2 className="size-4 text-danger" /> Delete
      </Button>
    </div>
  );
}
