"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/forms";
import { Button, type ButtonProps } from "@/components/ui/button";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function SubmitButton({
  label,
  variant,
  disabled,
}: {
  label: string;
  variant: ButtonProps["variant"];
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending || disabled}>
      {pending ? "Working…" : label}
    </Button>
  );
}

/**
 * Register/cancel control. Bind the event id to the action with
 * `registerForEvent.bind(null, eventId)`.
 */
export function RegisterButton({
  action,
  label,
  variant = "primary",
  disabled,
  disabledReason,
}: {
  action: Action;
  label: string;
  variant?: ButtonProps["variant"];
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  return (
    <div className="flex flex-col gap-1">
      <form action={formAction}>
        <SubmitButton label={label} variant={variant} disabled={disabled} />
      </form>
      {disabled && disabledReason ? (
        <p className="text-caption text-soft">{disabledReason}</p>
      ) : null}
      {state.error ? (
        <p className="flex items-center gap-1 text-caption text-danger">
          <AlertCircle className="size-3.5" /> {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="flex items-center gap-1 text-caption text-emerald-700">
          <CheckCircle2 className="size-3.5" /> {state.message}
        </p>
      ) : null}
    </div>
  );
}
