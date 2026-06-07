"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, AlertCircle } from "lucide-react";
import { updatePassword, type AuthFormState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full">
      <KeyRound className="size-4" />
      {pending ? "Updating…" : "Update password"}
    </Button>
  );
}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    updatePassword,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-sp-3" noValidate>
      <div className="flex flex-col gap-1">
        <h1 className="text-h2 font-bold text-ink">Set a new password</h1>
        <p className="text-body text-soft">
          Choose a strong password you don&apos;t use elsewhere.
        </p>
      </div>

      {state.error ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger-bg/50 px-3 py-2 text-caption text-danger"
        >
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={
            state.fieldErrors?.password ? "password-error" : undefined
          }
        />
        {state.fieldErrors?.password ? (
          <p id="password-error" className="text-caption text-danger">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          aria-invalid={Boolean(state.fieldErrors?.confirm)}
          aria-describedby={
            state.fieldErrors?.confirm ? "confirm-error" : undefined
          }
        />
        {state.fieldErrors?.confirm ? (
          <p id="confirm-error" className="text-caption text-danger">
            {state.fieldErrors.confirm}
          </p>
        ) : null}
      </div>

      <SubmitButton />
    </form>
  );
}
