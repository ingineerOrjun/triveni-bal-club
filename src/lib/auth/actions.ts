"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { logAudit } from "@/lib/supabase/audit";

export interface AuthFormState {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

function sanitizeNext(next: string | null): string {
  // Only allow same-origin, in-app paths (prevent open redirect).
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/portal";
  return next;
}

/* -------------------------------------------------------------------------- */
/* Sign in                                                                     */
/* -------------------------------------------------------------------------- */
export async function signIn(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeNext(String(formData.get("next") ?? "/portal"));

  const fieldErrors: Record<string, string> = {};
  if (!email) fieldErrors.email = "Email is required.";
  else if (!EMAIL_RE.test(email)) fieldErrors.email = "Enter a valid email.";
  if (!password) fieldErrors.password = "Password is required.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  if (!isSupabaseConfigured()) {
    return { error: "Authentication is not configured yet. Please try later." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Invalid email or password." };
  }

  // Best-effort audit log (won't block login if it fails).
  await logAudit(supabase, "auth.login", "user");

  revalidatePath("/", "layout");
  redirect(next);
}

/* -------------------------------------------------------------------------- */
/* Sign out                                                                    */
/* -------------------------------------------------------------------------- */
export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await logAudit(supabase, "auth.logout", "user");
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/auth/login");
}

/* -------------------------------------------------------------------------- */
/* Forgot password — send reset email                                          */
/* -------------------------------------------------------------------------- */
export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email || !EMAIL_RE.test(email)) {
    return { fieldErrors: { email: "Enter a valid email." } };
  }

  // Always respond the same way to avoid leaking which emails exist.
  const genericMessage =
    "If an account exists for that email, a reset link is on its way.";

  if (!isSupabaseConfigured()) {
    return { message: genericMessage };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/auth/reset-password`,
  });

  return { message: genericMessage };
}

/* -------------------------------------------------------------------------- */
/* Reset password — set a new password (requires recovery session)             */
/* -------------------------------------------------------------------------- */
export async function updatePassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const fieldErrors: Record<string, string> = {};
  if (password.length < 8)
    fieldErrors.password = "Use at least 8 characters.";
  if (password !== confirm)
    fieldErrors.confirm = "Passwords do not match.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  if (!isSupabaseConfigured()) {
    return { error: "Authentication is not configured yet." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error:
        "Your reset link has expired or is invalid. Please request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Could not update password. Please try again." };
  }

  await logAudit(supabase, "auth.password_reset", "user");

  redirect("/portal?message=password-updated");
}
