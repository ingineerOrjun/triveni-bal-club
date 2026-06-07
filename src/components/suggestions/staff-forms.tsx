"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Send, MessageSquarePlus, SlidersHorizontal, GitMerge } from "lucide-react";
import type { FormState } from "@/lib/forms";
import type {
  SuggestionStatus,
  SuggestionPriority,
} from "@/types/database";
import type { MemberRef } from "@/lib/suggestions/queries";
import { SUGGESTION_STATUSES } from "@/lib/suggestions/schema";
import {
  changeStatus,
  triageSuggestion,
  leaveModeratorFeedback,
  mergeSuggestions,
} from "@/lib/suggestions/actions";
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

function Feedback({ state }: { state: FormState }) {
  if (state.message)
    return (
      <p role="status" className="text-caption text-emerald-700">
        {state.message}
      </p>
    );
  if (state.error)
    return (
      <p role="alert" className="text-caption text-danger">
        {state.error}
      </p>
    );
  return null;
}

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {children}
    </Button>
  );
}

/* ------------------------------ status change ----------------------------- */
export function StatusChangeForm({
  id,
  current,
}: {
  id: string;
  current: SuggestionStatus;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    changeStatus.bind(null, id),
    {}
  );
  return (
    <form action={formAction} className="flex flex-col gap-sp-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={current}>
          <SelectTrigger id="status" className="capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUGGESTION_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reason">Reason (optional)</Label>
        <Textarea id="reason" name="reason" rows={2} />
      </div>
      <div className="flex items-center gap-sp-2">
        <Submit>
          <Send className="size-4" /> Update status
        </Submit>
        <Feedback state={state} />
      </div>
    </form>
  );
}

/* --------------------------------- triage --------------------------------- */
export function TriageForm({
  id,
  current,
  moderators,
}: {
  id: string;
  current: {
    priority: SuggestionPriority;
    assigned_to: string | null;
    estimated_completion: string | null;
    moderator_notes: string | null;
  };
  moderators: MemberRef[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    triageSuggestion.bind(null, id),
    {}
  );
  return (
    <form action={formAction} className="flex flex-col gap-sp-2">
      <div className="grid gap-sp-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" defaultValue={current.priority}>
            <SelectTrigger id="priority" className="capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["low", "medium", "high", "critical"] as const).map((p) => (
                <SelectItem key={p} value={p} className="capitalize">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="assigned_to">Assign moderator</Label>
          <Select
            name="assigned_to"
            defaultValue={current.assigned_to ?? undefined}
          >
            <SelectTrigger id="assigned_to">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              {moderators.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="estimated_completion">Estimated completion</Label>
          <Input
            id="estimated_completion"
            name="estimated_completion"
            type="date"
            defaultValue={current.estimated_completion ?? undefined}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="moderator_notes">Internal notes</Label>
        <Textarea
          id="moderator_notes"
          name="moderator_notes"
          rows={2}
          defaultValue={current.moderator_notes ?? undefined}
        />
      </div>
      <div className="flex items-center gap-sp-2">
        <Submit>
          <SlidersHorizontal className="size-4" /> Save triage
        </Submit>
        <Feedback state={state} />
      </div>
    </form>
  );
}

/* -------------------------------- feedback -------------------------------- */
export function FeedbackForm({ id }: { id: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(
    leaveModeratorFeedback.bind(null, id),
    {}
  );
  return (
    <form action={formAction} className="flex flex-col gap-sp-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="body">Add feedback</Label>
        <Textarea
          id="body"
          name="body"
          rows={3}
          placeholder="e.g. Needs more detail, merged with another idea, accepted for planning…"
          aria-invalid={Boolean(state.fieldErrors?.body)}
        />
        <FieldError id="body" message={state.fieldErrors?.body} />
      </div>
      <div className="flex items-center gap-sp-2">
        <Submit>
          <MessageSquarePlus className="size-4" /> Post feedback
        </Submit>
        <Feedback state={state} />
      </div>
    </form>
  );
}

/* --------------------------------- merge ---------------------------------- */
export function MergeForm({
  sourceId,
  candidates,
}: {
  sourceId: string;
  candidates: { id: string; title: string }[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    mergeSuggestions,
    {}
  );
  if (candidates.length === 0) {
    return (
      <p className="text-caption text-soft">No other suggestions to merge into.</p>
    );
  }
  return (
    <form action={formAction} className="flex flex-col gap-sp-2">
      <input type="hidden" name="source_id" value={sourceId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="target_id">Merge into</Label>
        <Select name="target_id">
          <SelectTrigger id="target_id">
            <SelectValue placeholder="Choose the canonical idea" />
          </SelectTrigger>
          <SelectContent>
            {candidates.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-sp-2">
        <Submit>
          <GitMerge className="size-4" /> Merge &amp; archive
        </Submit>
        <Feedback state={state} />
      </div>
    </form>
  );
}
