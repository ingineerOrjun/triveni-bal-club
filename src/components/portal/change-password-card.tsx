"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { requestPasswordReset, type AuthFormState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      <KeyRound className="size-4" />
      {pending ? "Sending…" : "Email me a reset link"}
    </Button>
  );
}

/** Triggers the standard password-reset email flow for the current account. */
export function ChangePasswordCard({ email }: { email: string }) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    requestPasswordReset,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-sp-2">
      <input type="hidden" name="email" value={email} />
      {state.message ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md border border-success/40 bg-success-bg/50 px-3 py-2 text-caption text-emerald-700"
        >
          <CheckCircle2 className="size-4 shrink-0" /> {state.message}
        </div>
      ) : (
        <p className="text-body text-soft">
          We&apos;ll send a secure link to <strong>{email}</strong> to set a new
          password.
        </p>
      )}
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
