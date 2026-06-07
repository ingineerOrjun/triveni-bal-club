"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Award, CheckCircle2, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/forms";
import type { BadgeRow } from "@/types/database";
import type { MemberRef } from "@/lib/recognition/queries";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      <Award className="size-4" /> {pending ? "Awarding…" : "Award badge"}
    </Button>
  );
}

/** Award (or recommend) an existing badge to a member. */
export function AwardBadgePicker({
  action,
  members,
  badges,
}: {
  action: Action;
  members: MemberRef[];
  badges: BadgeRow[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  return (
    <form
      action={formAction}
      className="flex flex-col gap-sp-3 sm:flex-row sm:items-end"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="award_member">Member</Label>
        <Select name="member_id">
          <SelectTrigger id="award_member">
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
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="award_badge">Badge</Label>
        <Select name="badge_id">
          <SelectTrigger id="award_badge">
            <SelectValue placeholder="Choose a badge" />
          </SelectTrigger>
          <SelectContent>
            {badges.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <SubmitButton />

      {state.error ? (
        <p className="flex items-center gap-1 text-caption text-danger sm:basis-full">
          <AlertCircle className="size-3.5" /> {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="flex items-center gap-1 text-caption text-emerald-700 sm:basis-full">
          <CheckCircle2 className="size-3.5" /> {state.message}
        </p>
      ) : null}
    </form>
  );
}
