import type { ZodError } from "zod";

/** Shared shape returned by form server actions (used with useActionState). */
export interface FormState {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

/** Flatten a ZodError into a { field: message } map (first error per field). */
export function zodFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
