"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Mail, CheckCircle2 } from "lucide-react";
import { requestPasswordReset, type AuthFormState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full">
      <Mail className="size-4" />
      {pending ? "Sending…" : "Send reset link"}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    requestPasswordReset,
    {}
  );

  if (state.message) {
    return (
      <div className="flex flex-col items-center gap-sp-2 text-center">
        <CheckCircle2 className="size-12 text-emerald-700" />
        <h1 className="text-h2 font-bold text-ink">Check your inbox</h1>
        <p className="text-body text-soft">{state.message}</p>
        <Button asChild variant="ghost">
          <Link href="/auth/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-sp-3" noValidate>
      <div className="flex flex-col gap-1">
        <h1 className="text-h2 font-bold text-ink">Forgot password?</h1>
        <p className="text-body text-soft">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@school.edu.np"
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
        />
        {state.fieldErrors?.email ? (
          <p id="email-error" className="text-caption text-danger">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <SubmitButton />

      <p className="text-center text-caption text-soft">
        Remembered it?{" "}
        <Link
          href="/auth/login"
          className="rounded-sm font-semibold text-primary-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
