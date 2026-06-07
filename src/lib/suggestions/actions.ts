"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth/session";
import { requireStaffUser, requireAdminUser } from "@/lib/auth/guards";
import { logAudit } from "@/lib/supabase/audit";
import { runBadgeEngine } from "@/lib/recognition/engine";
import { slugify } from "@/lib/utils";
import { type FormState, zodFieldErrors } from "@/lib/forms";
import {
  suggestionInputSchema,
  statusChangeSchema,
  triageSchema,
  feedbackSchema,
  categorySchema,
} from "./schema";
import type { SuggestionStatus } from "@/types/database";

function parseSuggestion(formData: FormData) {
  return suggestionInputSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category_id: formData.get("category_id") ?? "",
    visibility: formData.get("visibility") ?? "members",
    is_anonymous: formData.get("is_anonymous") === "on",
    tags: formData.getAll("tags").map(String).filter(Boolean),
  });
}

async function replaceTags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  suggestionId: string,
  tagIds: string[]
) {
  await supabase.from("suggestion_tags").delete().eq("suggestion_id", suggestionId);
  if (tagIds.length > 0) {
    await supabase
      .from("suggestion_tags")
      .insert(tagIds.map((tag_id) => ({ suggestion_id: suggestionId, tag_id })));
  }
}

/* ============================== submit / edit ============================= */
export async function submitSuggestion(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to share an idea." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = parseSuggestion(formData);
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const asDraft = formData.get("intent") === "draft";
  const status: SuggestionStatus = asDraft ? "draft" : "submitted";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suggestions")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      category_id: parsed.data.category_id || null,
      visibility: parsed.data.visibility,
      is_anonymous: parsed.data.is_anonymous ?? false,
      author_id: user.id,
      status,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not save your suggestion." };

  const id = (data as { id: string }).id;
  await replaceTags(supabase, id, parsed.data.tags ?? []);

  if (!asDraft) {
    await supabase.from("suggestion_status_history").insert({
      suggestion_id: id,
      old_status: "draft",
      new_status: "submitted",
      changed_by: user.id,
      reason: "Submitted",
    });
    await runBadgeEngine(user.id); // "First Suggestion" etc.
  }

  await logAudit(
    supabase,
    asDraft ? "suggestion.draft" : "suggestion.submit",
    "suggestion",
    id,
    { anonymous: parsed.data.is_anonymous ?? false }
  );

  revalidatePath("/portal/my-suggestions");
  revalidatePath("/portal/suggestions");
  redirect(`/portal/suggestions/${id}`);
}

export async function updateSuggestion(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = parseSuggestion(formData);
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const submit = formData.get("intent") === "submit";
  const supabase = await createClient();

  // RLS allows the author to update only while status = 'draft'.
  const { error } = await supabase
    .from("suggestions")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      category_id: parsed.data.category_id || null,
      visibility: parsed.data.visibility,
      is_anonymous: parsed.data.is_anonymous ?? false,
      ...(submit ? { status: "submitted" as SuggestionStatus } : {}),
    })
    .eq("id", id);
  if (error) {
    return { error: "Could not update — drafts can only be edited before review." };
  }

  await replaceTags(supabase, id, parsed.data.tags ?? []);

  if (submit) {
    await supabase.from("suggestion_status_history").insert({
      suggestion_id: id,
      old_status: "draft",
      new_status: "submitted",
      changed_by: user.id,
      reason: "Submitted",
    });
    await runBadgeEngine(user.id);
  }

  await logAudit(supabase, submit ? "suggestion.submit" : "suggestion.edit", "suggestion", id);
  revalidatePath("/portal/my-suggestions");
  revalidatePath(`/portal/suggestions/${id}`);
  redirect(`/portal/suggestions/${id}`);
}

export async function deleteDraft(id: string) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  // RLS + delete-guard trigger ensure only drafts are removed.
  const { error } = await supabase.from("suggestions").delete().eq("id", id);
  if (!error) await logAudit(supabase, "suggestion.delete", "suggestion", id);
  revalidatePath("/portal/my-suggestions");
}

/* ================================ support ================================ */
export async function supportSuggestion(id: string) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase
    .from("suggestion_votes")
    .upsert(
      { suggestion_id: id, member_id: user.id },
      { onConflict: "suggestion_id,member_id", ignoreDuplicates: true }
    );
  await logAudit(supabase, "suggestion.support", "suggestion", id);
  await runBadgeEngine(user.id); // "Helpful Contributor"
  revalidatePath("/portal/suggestions");
  revalidatePath(`/portal/suggestions/${id}`);
  revalidatePath("/student-voice");
}

export async function removeSupport(id: string) {
  const user = await getCurrentUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase
    .from("suggestion_votes")
    .delete()
    .eq("suggestion_id", id)
    .eq("member_id", user.id);
  await logAudit(supabase, "suggestion.unsupport", "suggestion", id);
  revalidatePath("/portal/suggestions");
  revalidatePath(`/portal/suggestions/${id}`);
  revalidatePath("/student-voice");
}

/* ============================ staff workflow ============================= */
export async function changeStatus(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "You don't have permission to do that." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = statusChangeSchema.safeParse({
    status: formData.get("status"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("suggestions")
    .select("status, author_id")
    .eq("id", id)
    .maybeSingle();
  const cur = current as { status: SuggestionStatus; author_id: string } | null;

  const { error } = await supabase
    .from("suggestions")
    .update({ status: parsed.data.status })
    .eq("id", id);
  if (error) return { error: "Could not change the status." };

  await supabase.from("suggestion_status_history").insert({
    suggestion_id: id,
    old_status: cur?.status ?? null,
    new_status: parsed.data.status,
    changed_by: user.id,
    reason: parsed.data.reason || null,
  });

  if (parsed.data.status === "implemented" && cur?.author_id) {
    await runBadgeEngine(cur.author_id); // "Innovation Champion"
  }

  await logAudit(supabase, "suggestion.status", "suggestion", id, {
    from: cur?.status,
    to: parsed.data.status,
  });
  revalidatePath(`/admin/suggestions/${id}`);
  revalidatePath("/admin/suggestions");
  revalidatePath("/student-voice");
  return { message: `Status updated to “${parsed.data.status.replace(/_/g, " ")}”.` };
}

export async function triageSuggestion(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "You don't have permission to do that." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = triageSchema.safeParse({
    priority: formData.get("priority"),
    assigned_to: formData.get("assigned_to") ?? "",
    estimated_completion: formData.get("estimated_completion") ?? "",
    moderator_notes: formData.get("moderator_notes") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("suggestions")
    .update({
      priority: parsed.data.priority,
      assigned_to: parsed.data.assigned_to || null,
      estimated_completion: parsed.data.estimated_completion || null,
      moderator_notes: parsed.data.moderator_notes || null,
    })
    .eq("id", id);
  if (error) return { error: "Could not save triage details." };

  await logAudit(supabase, "suggestion.triage", "suggestion", id);
  revalidatePath(`/admin/suggestions/${id}`);
  return { message: "Triage details saved." };
}

export async function leaveModeratorFeedback(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "You don't have permission to do that." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = feedbackSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("moderator_feedback").insert({
    suggestion_id: id,
    moderator_id: user.id,
    body: parsed.data.body,
  });
  if (error) return { error: "Could not save your feedback." };

  await logAudit(supabase, "suggestion.feedback", "suggestion", id);
  revalidatePath(`/admin/suggestions/${id}`);
  revalidatePath(`/portal/suggestions/${id}`);
  return { message: "Feedback added." };
}

export async function archiveSuggestion(id: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("suggestions").update({ status: "archived" }).eq("id", id);
  await supabase.from("suggestion_status_history").insert({
    suggestion_id: id,
    new_status: "archived",
    changed_by: user.id,
    reason: "Archived",
  });
  await logAudit(supabase, "suggestion.archive", "suggestion", id);
  revalidatePath("/admin/suggestions");
  revalidatePath(`/admin/suggestions/${id}`);
}

export async function mergeSuggestions(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireAdminUser();
  if (!user) return { error: "Admins only." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const sourceId = String(formData.get("source_id") ?? "");
  const targetId = String(formData.get("target_id") ?? "");
  if (!sourceId || !targetId || sourceId === targetId) {
    return { error: "Choose a different target suggestion to merge into." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("suggestions")
    .update({ merged_into: targetId, status: "archived" })
    .eq("id", sourceId);
  if (error) return { error: "Could not merge the suggestions." };

  await supabase.from("suggestion_status_history").insert({
    suggestion_id: sourceId,
    new_status: "archived",
    changed_by: user.id,
    reason: `Merged into ${targetId}`,
  });
  await logAudit(supabase, "suggestion.merge", "suggestion", sourceId, {
    target: targetId,
  });
  revalidatePath("/admin/suggestions");
  return { message: "Suggestion merged and archived." };
}

/* =========================== category management ========================= */
export async function createCategory(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireAdminUser();
  if (!user) return { error: "Admins only." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    name_ne: formData.get("name_ne") ?? "",
    description: formData.get("description") ?? "",
    is_active: formData.get("is_active") === "on",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const supabase = await createClient();
  const slug = `${slugify(parsed.data.name)}-${crypto.randomUUID().slice(0, 4)}`;
  const { error } = await supabase.from("suggestion_categories").insert({
    slug,
    name: parsed.data.name,
    name_ne: parsed.data.name_ne || null,
    description: parsed.data.description || null,
    is_active: parsed.data.is_active ?? true,
  });
  if (error) return { error: "Could not create the category." };

  await logAudit(supabase, "suggestion_category.create", "suggestion_category", null);
  revalidatePath("/admin/suggestions/categories");
  return { message: "Category created." };
}

export async function setCategoryActive(id: string, active: boolean) {
  const user = await requireAdminUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase
    .from("suggestion_categories")
    .update({ is_active: active })
    .eq("id", id);
  await logAudit(supabase, "suggestion_category.update", "suggestion_category", id, {
    is_active: active,
  });
  revalidatePath("/admin/suggestions/categories");
}
