"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Send, Save, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/forms";
import type { PositionRow } from "@/types/database";
import { submitNomination } from "@/lib/elections/actions";
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

function Buttons() {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap items-center gap-sp-2">
      <Button type="submit" name="intent" value="submit" variant="primary" size="lg" disabled={pending}>
        <Send className="size-4" /> {pending ? "Submitting…" : "Submit nomination"}
      </Button>
      <Button type="submit" name="intent" value="draft" variant="outline" size="lg" disabled={pending}>
        <Save className="size-4" /> Save draft
      </Button>
      <Button asChild variant="ghost">
        <Link href="/portal/elections">Cancel</Link>
      </Button>
    </div>
  );
}

export function CandidateForm({
  electionId,
  positions,
}: {
  electionId: string;
  positions: PositionRow[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(submitNomination, {});

  return (
    <form action={formAction} className="flex flex-col gap-sp-3" noValidate>
      <input type="hidden" name="election_id" value={electionId} />
      {state.error ? (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger-bg/50 px-3 py-2 text-caption text-danger">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="position_id">Position</Label>
        <Select name="position_id">
          <SelectTrigger id="position_id" aria-invalid={Boolean(state.fieldErrors?.position_id)}>
            <SelectValue placeholder="Choose a position" />
          </SelectTrigger>
          <SelectContent>
            {positions.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError id="position_id" message={state.fieldErrors?.position_id} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slogan">Campaign slogan</Label>
        <Input id="slogan" name="slogan" placeholder="A short, memorable line" />
      </div>

      <div className="grid gap-sp-3 sm:grid-cols-2">
        <MediaField name="photo_url" label="Candidate photo" />
        <MediaField name="banner_url" label="Campaign banner" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="manifesto">Manifesto</Label>
        <Textarea id="manifesto" name="manifesto" rows={5} placeholder="Why you're standing, and what you'll do…" />
      </div>
      <div className="grid gap-sp-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="vision">Vision</Label>
          <Textarea id="vision" name="vision" rows={3} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goals">Goals</Label>
          <Textarea id="goals" name="goals" rows={3} />
        </div>
      </div>

      <Buttons />
    </form>
  );
}
