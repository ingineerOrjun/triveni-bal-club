"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireStaffUser, requireAdminUser } from "@/lib/auth/guards";
import { logAudit } from "@/lib/supabase/audit";
import { slugify } from "@/lib/utils";
import { type FormState, zodFieldErrors } from "@/lib/forms";
import {
  badgeInputSchema,
  achievementInputSchema,
  certificateInputSchema,
  programInputSchema,
  awardInputSchema,
} from "./schema";
import type { AwardStatus, ContentStatus } from "@/types/database";

/* ============================ Badge catalog (admin) ======================== */
export async function createBadge(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireAdminUser();
  if (!user) return { error: "Admins only." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = badgeInputSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    icon: formData.get("icon") ?? "",
    category_id: formData.get("category_id") ?? "",
    criteria: formData.get("criteria") ?? "",
    image_url: formData.get("image_url") ?? "",
    is_active: formData.get("is_active") === "on",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const supabase = await createClient();
  const slug = `${slugify(parsed.data.name)}-${crypto.randomUUID().slice(0, 5)}`;
  const { data, error } = await supabase
    .from("badges")
    .insert({
      slug,
      name: parsed.data.name,
      description: parsed.data.description || null,
      icon: parsed.data.icon || null,
      category_id: parsed.data.category_id || null,
      criteria: parsed.data.criteria || null,
      image_url: parsed.data.image_url || null,
      is_active: parsed.data.is_active ?? true,
    })
    .select("id")
    .single();
  if (error) return { error: "Could not create the badge." };

  await logAudit(supabase, "badge.create", "badge", (data as { id: string }).id);
  revalidatePath("/admin/badges");
  redirect("/admin/badges");
}

export async function updateBadge(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireAdminUser();
  if (!user) return { error: "Admins only." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = badgeInputSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    icon: formData.get("icon") ?? "",
    category_id: formData.get("category_id") ?? "",
    criteria: formData.get("criteria") ?? "",
    image_url: formData.get("image_url") ?? "",
    is_active: formData.get("is_active") === "on",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("badges")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      icon: parsed.data.icon || null,
      category_id: parsed.data.category_id || null,
      criteria: parsed.data.criteria || null,
      image_url: parsed.data.image_url || null,
      is_active: parsed.data.is_active ?? true,
    })
    .eq("id", id);
  if (error) return { error: "Could not save changes." };

  await logAudit(supabase, "badge.update", "badge", id);
  revalidatePath("/admin/badges");
  redirect("/admin/badges");
}

export async function deleteBadge(id: string) {
  const user = await requireAdminUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("badges").delete().eq("id", id);
  await logAudit(supabase, "badge.delete", "badge", id);
  revalidatePath("/admin/badges");
}

/* ========================= Member achievements ============================ */
export async function createAchievement(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "You don't have permission to do that." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = achievementInputSchema.safeParse({
    member_id: formData.get("member_id"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    category_id: formData.get("category_id") ?? "",
    award_date: formData.get("award_date") ?? "",
    evidence: formData.get("evidence") ?? "",
    visibility: formData.get("visibility") ?? "members",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  // Moderators may only recommend; admins award directly.
  const status: AwardStatus = user.role === "admin" ? "awarded" : "recommended";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_achievements")
    .insert({
      member_id: parsed.data.member_id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      category_id: parsed.data.category_id || null,
      award_date: parsed.data.award_date || undefined,
      evidence: parsed.data.evidence || null,
      visibility: parsed.data.visibility,
      awarded_by: user.id,
      source: "manual",
      status,
    })
    .select("id")
    .single();
  if (error) return { error: "Could not save the achievement." };

  await logAudit(
    supabase,
    status === "awarded" ? "achievement.award" : "achievement.recommend",
    "achievement",
    (data as { id: string }).id
  );
  revalidatePath("/admin/achievements");
  redirect("/admin/achievements");
}

export async function approveAchievement(id: string) {
  const user = await requireAdminUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase
    .from("member_achievements")
    .update({ status: "awarded" })
    .eq("id", id);
  await logAudit(supabase, "achievement.approve", "achievement", id);
  revalidatePath("/admin/achievements");
}

export async function deleteAchievement(id: string) {
  const user = await requireAdminUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("member_achievements").delete().eq("id", id);
  await logAudit(supabase, "achievement.delete", "achievement", id);
  revalidatePath("/admin/achievements");
}

/* ============================ Member badges =============================== */
export async function awardBadgeToMember(memberId: string, badgeId: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;
  const status: AwardStatus = user.role === "admin" ? "awarded" : "recommended";

  const supabase = await createClient();
  await supabase
    .from("member_badges")
    .upsert(
      {
        member_id: memberId,
        badge_id: badgeId,
        awarded_by: user.id,
        source: "manual",
        status,
      },
      { onConflict: "member_id,badge_id", ignoreDuplicates: true }
    );
  await logAudit(
    supabase,
    status === "awarded" ? "badge.award" : "badge.recommend",
    "badge",
    badgeId,
    { member_id: memberId }
  );
  revalidatePath("/admin/badges");
}

/** Form wrapper: award/recommend a badge to a member (used by the picker UI). */
export async function awardBadgeForm(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const memberId = String(formData.get("member_id") ?? "");
  const badgeId = String(formData.get("badge_id") ?? "");
  if (!memberId || !badgeId) {
    return { error: "Choose both a member and a badge." };
  }
  await awardBadgeToMember(memberId, badgeId);
  return { message: "Badge awarded to the member." };
}

export async function approveMemberBadge(id: string) {
  const user = await requireAdminUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("member_badges").update({ status: "awarded" }).eq("id", id);
  await logAudit(supabase, "badge.approve", "badge", id);
  revalidatePath("/admin/badges");
}

export async function removeMemberBadge(id: string) {
  const user = await requireAdminUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("member_badges").delete().eq("id", id);
  await logAudit(supabase, "badge.remove", "badge", id);
  revalidatePath("/admin/badges");
}

/* ============================== Certificates ============================== */
export async function issueCertificate(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireAdminUser();
  if (!user) return { error: "Only admins can issue certificates." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = certificateInputSchema.safeParse({
    recipient_id: formData.get("recipient_id"),
    title: formData.get("title"),
    achievement_id: formData.get("achievement_id") ?? "",
    issued_date: formData.get("issued_date") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const year = (parsed.data.issued_date ?? "").slice(0, 4) || "2026";
  const certificateNumber = `TCC-${year}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const verificationCode = crypto.randomUUID().replace(/-/g, "");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certificates")
    .insert({
      certificate_number: certificateNumber,
      title: parsed.data.title,
      recipient_id: parsed.data.recipient_id,
      achievement_id: parsed.data.achievement_id || null,
      issued_date: parsed.data.issued_date || undefined,
      verification_code: verificationCode,
      issued_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: "Could not issue the certificate." };

  await logAudit(
    supabase,
    "certificate.issue",
    "certificate",
    (data as { id: string }).id,
    { recipient_id: parsed.data.recipient_id }
  );
  revalidatePath("/admin/certificates");
  redirect("/admin/certificates");
}

export async function deleteCertificate(id: string) {
  const user = await requireAdminUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("certificates").delete().eq("id", id);
  await logAudit(supabase, "certificate.delete", "certificate", id);
  revalidatePath("/admin/certificates");
}

/* ========================= Recognition programs =========================== */
export async function createProgram(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireAdminUser();
  if (!user) return { error: "Admins only." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = programInputSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    criteria: formData.get("criteria") ?? "",
    starts_on: formData.get("starts_on") ?? "",
    ends_on: formData.get("ends_on") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const supabase = await createClient();
  const slug = `${slugify(parsed.data.name)}-${crypto.randomUUID().slice(0, 5)}`;
  const { data, error } = await supabase
    .from("recognition_programs")
    .insert({
      slug,
      name: parsed.data.name,
      description: parsed.data.description || null,
      criteria: parsed.data.criteria || null,
      starts_on: parsed.data.starts_on || null,
      ends_on: parsed.data.ends_on || null,
      created_by: user.id,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) return { error: "Could not create the program." };

  await logAudit(supabase, "program.create", "program", (data as { id: string }).id);
  revalidatePath("/admin/recognition");
  redirect("/admin/recognition");
}

export async function setProgramStatus(id: string, status: ContentStatus) {
  const user = await requireAdminUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("recognition_programs").update({ status }).eq("id", id);
  await logAudit(supabase, `program.${status}`, "program", id);
  revalidatePath("/admin/recognition");
  revalidatePath("/hall-of-fame");
}

export async function deleteProgram(id: string) {
  const user = await requireAdminUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("recognition_programs").delete().eq("id", id);
  await logAudit(supabase, "program.delete", "program", id);
  revalidatePath("/admin/recognition");
}

/* ========================== Recognition awards ============================ */
export async function giveRecognitionAward(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireAdminUser();
  if (!user) return { error: "Admins only." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = awardInputSchema.safeParse({
    program_id: formData.get("program_id"),
    member_id: formData.get("member_id"),
    title: formData.get("title"),
    period_label: formData.get("period_label") ?? "",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recognition_awards")
    .insert({
      program_id: parsed.data.program_id,
      member_id: parsed.data.member_id,
      title: parsed.data.title,
      period_label: parsed.data.period_label || null,
      note: parsed.data.note || null,
      awarded_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: "Could not record the award." };

  await logAudit(
    supabase,
    "recognition.award",
    "recognition_award",
    (data as { id: string }).id,
    { program_id: parsed.data.program_id, member_id: parsed.data.member_id }
  );
  revalidatePath("/admin/recognition");
  revalidatePath("/hall-of-fame");
  redirect(`/admin/recognition/${parsed.data.program_id}`);
}
