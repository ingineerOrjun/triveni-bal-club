"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth/session";
import { requireStaffUser } from "@/lib/auth/guards";
import { logAudit } from "@/lib/supabase/audit";
import { runBadgeEngine } from "@/lib/recognition/engine";
import { slugify } from "@/lib/utils";
import { type FormState, zodFieldErrors } from "@/lib/forms";
import { activityInputSchema } from "./schema";
import type { ContentStatus } from "@/types/database";

function parseForm(formData: FormData) {
  return activityInputSchema.safeParse({
    title: formData.get("title"),
    title_ne: formData.get("title_ne") ?? "",
    description: formData.get("description") ?? "",
    category_id: formData.get("category_id") ?? "",
    cover_url: formData.get("cover_url") ?? "",
    starts_on: formData.get("starts_on") ?? "",
    ends_on: formData.get("ends_on") ?? "",
  });
}

function toRow(input: ReturnType<typeof activityInputSchema.parse>) {
  return {
    title: input.title,
    title_ne: input.title_ne || null,
    description: input.description || null,
    category_id: input.category_id || null,
    cover_url: input.cover_url || null,
    starts_on: input.starts_on || null,
    ends_on: input.ends_on || null,
  };
}

export async function createActivity(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "You don't have permission to do that." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const supabase = await createClient();
  const slug = `${slugify(parsed.data.title)}-${crypto.randomUUID().slice(0, 6)}`;

  const { data, error } = await supabase
    .from("activities")
    .insert({ ...toRow(parsed.data), slug, created_by: user.id, status: "draft" })
    .select("id")
    .single();

  if (error) return { error: "Could not create the activity." };

  await logAudit(supabase, "activity.create", "activity", (data as { id: string }).id);
  revalidatePath("/admin/activities");
  redirect("/admin/activities");
}

export async function updateActivity(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "You don't have permission to do that." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("activities")
    .update(toRow(parsed.data))
    .eq("id", id);

  if (error) return { error: "Could not save changes." };

  await logAudit(supabase, "activity.update", "activity", id);
  revalidatePath("/admin/activities");
  revalidatePath(`/admin/activities/${id}/edit`);
  redirect("/admin/activities");
}

/** Change publish status (publish / archive / back to draft). */
export async function setActivityStatus(id: string, status: ContentStatus) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;

  const supabase = await createClient();
  const patch: { status: ContentStatus; published_at?: string } = { status };
  if (status === "published") patch.published_at = new Date().toISOString();

  await supabase.from("activities").update(patch).eq("id", id);
  await logAudit(supabase, `activity.${status}`, "activity", id);
  revalidatePath("/admin/activities");
  revalidatePath("/portal/activities");
}

export async function deleteActivity(id: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;

  const supabase = await createClient();
  await supabase.from("activities").delete().eq("id", id);
  await logAudit(supabase, "activity.delete", "activity", id);
  revalidatePath("/admin/activities");
}

/* ----------------------------- member actions ---------------------------- */
export async function joinActivity(activityId: string) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseConfigured()) return;

  const supabase = await createClient();
  await supabase
    .from("activity_participants")
    .upsert(
      { activity_id: activityId, member_id: user.id },
      { onConflict: "activity_id,member_id", ignoreDuplicates: true }
    );
  await logAudit(supabase, "activity.join", "activity", activityId);
  await runBadgeEngine(user.id); // award "volunteer" / "community helper" etc.
  revalidatePath("/portal/activities");
  revalidatePath("/portal/badges");
}

export async function leaveActivity(activityId: string) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseConfigured()) return;

  const supabase = await createClient();
  await supabase
    .from("activity_participants")
    .delete()
    .eq("activity_id", activityId)
    .eq("member_id", user.id);
  await logAudit(supabase, "activity.leave", "activity", activityId);
  revalidatePath("/portal/activities");
}
