"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Award, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/forms";
import type { MemberRef } from "@/lib/recognition/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending}>
      <Award className="size-4" /> {pending ? "Issuing…" : "Issue certificate"}
    </Button>
  );
}

export function CertificateForm({
  action,
  members,
}: {
  action: Action;
  members: MemberRef[];
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
          <Label htmlFor="recipient_id">Recipient</Label>
          <Select name="recipient_id">
            <SelectTrigger id="recipient_id" aria-invalid={Boolean(state.fieldErrors?.recipient_id)}>
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
          <FieldError id="recipient_id" message={state.fieldErrors?.recipient_id} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="issued_date">Issued date</Label>
          <Input id="issued_date" name="issued_date" type="date" />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g. Certificate of Outstanding Leadership"
            aria-invalid={Boolean(state.fieldErrors?.title)}
          />
          <FieldError id="title" message={state.fieldErrors?.title} />
        </div>
      </div>

      <p className="text-caption text-soft">
        A unique certificate number and verification code are generated
        automatically.
      </p>

      <div className="flex items-center gap-sp-2">
        <SubmitButton />
        <Button asChild variant="ghost">
          <Link href="/admin/certificates">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
