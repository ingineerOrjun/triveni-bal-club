"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/supabase/audit";
import { slugify } from "@/lib/utils";
import { type FormState, zodFieldErrors } from "@/lib/forms";
import type { ContributorType, ContributorUpdate } from "@/types/database";

const CONTRIBUTOR_TYPES: ContributorType[] = ["student", "teacher", "staff", "alumni", "guest", "club_member"];

const profileSchema = z.object({
  display_name: z.string().trim().min(2, "Tell us your name").max(120),
  type: z.enum(["student", "teacher", "staff", "alumni", "guest", "club_member"]),
  headline: z.string().trim().max(140).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  class_level: z.string().trim().max(40).optional().or(z.literal("")),
  section: z.string().trim().max(40).optional().or(z.literal("")),
  department: z.string().trim().max(80).optional().or(z.literal("")),
  graduation_year: z.coerce.number().int().min(1990).max(2100).optional(),
  organization: z.string().trim().max(120).optional().or(z.literal("")),
  designation: z.string().trim().max(120).optional().or(z.literal("")),
  website: z.string().trim().url().optional().or(z.literal("")),
  profile_photo: z.string().trim().url().optional().or(z.literal("")),
  cover_photo: z.string().trim().url().optional().or(z.literal("")),
  instagram: z.string().trim().max(200).optional().or(z.literal("")),
  facebook: z.string().trim().max(200).optional().or(z.literal("")),
  linkedin: z.string().trim().max(200).optional().or(z.literal("")),
});

/** Create or update the signed-in member's own public author profile. */
export async function upsertMyContributorProfile(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const parsed = profileSchema.safeParse({
    display_name: formData.get("display_name"),
    type: formData.get("type"),
    headline: formData.get("headline") ?? "",
    bio: formData.get("bio") ?? "",
    class_level: formData.get("class_level") ?? "",
    section: formData.get("section") ?? "",
    department: formData.get("department") ?? "",
    graduation_year: formData.get("graduation_year") || undefined,
    organization: formData.get("organization") ?? "",
    designation: formData.get("designation") ?? "",
    website: formData.get("website") ?? "",
    profile_photo: formData.get("profile_photo") ?? "",
    cover_photo: formData.get("cover_photo") ?? "",
    instagram: formData.get("instagram") ?? "",
    facebook: formData.get("facebook") ?? "",
    linkedin: formData.get("linkedin") ?? "",
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };
  const d = parsed.data;

  const social_links: Record<string, string> = {};
  if (d.instagram) social_links.instagram = d.instagram;
  if (d.facebook) social_links.facebook = d.facebook;
  if (d.linkedin) social_links.linkedin = d.linkedin;

  const supabase = await createClient();
  const existing = await supabase.from("contributors").select("id, slug").eq("user_id", user.id).maybeSingle();
  const existingRow = existing.data as { id: string; slug: string } | null;

  const patch: ContributorUpdate = {
    display_name: d.display_name,
    type: d.type as ContributorType,
    headline: d.headline || null,
    bio: d.bio || null,
    class_level: d.class_level || null,
    section: d.section || null,
    department: d.department || null,
    graduation_year: d.graduation_year ?? null,
    organization: d.organization || null,
    designation: d.designation || null,
    website: d.website || null,
    profile_photo: d.profile_photo || null,
    cover_photo: d.cover_photo || null,
    social_links,
  };

  let slug = existingRow?.slug ?? "";
  if (existingRow) {
    const { error } = await supabase.from("contributors").update(patch).eq("id", existingRow.id);
    if (error) return { error: "Could not save your profile." };
  } else {
    slug = `${slugify(d.display_name)}-${crypto.randomUUID().slice(0, 5)}`;
    const { error } = await supabase
      .from("contributors")
      .insert({ ...patch, display_name: d.display_name, user_id: user.id, slug });
    if (error) return { error: "Could not create your profile." };
  }

  await logAudit(supabase, "contributor.profile_save", "contributor", user.id);
  revalidatePath("/portal/magazine/profile");
  if (slug) revalidatePath(`/authors/${slug}`);
  return { message: "Profile saved." };
}

export { CONTRIBUTOR_TYPES };
