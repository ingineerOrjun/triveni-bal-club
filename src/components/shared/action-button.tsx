"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

function Inner({
  children,
  variant,
  size,
  confirmMessage,
}: {
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={pending}
      onClick={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </Button>
  );
}

/**
 * A button that invokes a no-argument server action via a <form>, with a
 * pending state and optional confirm prompt. Bind args with `action.bind(...)`.
 */
export function ActionButton({
  action,
  children,
  variant = "outline",
  size = "sm",
  confirmMessage,
}: {
  action: () => void | Promise<void>;
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  confirmMessage?: string;
}) {
  return (
    <form action={action} className="inline">
      <Inner variant={variant} size={size} confirmMessage={confirmMessage}>
        {children}
      </Inner>
    </form>
  );
}
