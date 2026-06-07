"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { logAudit } from "@/lib/supabase/audit";
import { getCurrentUser } from "@/lib/auth/session";

export interface ProfileFormState {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };
  if (!isSupabaseConfigured()) {
    return { error: "Saving is not available until the backend is configured." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const classLevel = String(formData.get("class_level") ?? "").trim();
  const section = String(formData.get("section") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();
  const interestsRaw = String(formData.get("interests") ?? "");
  const interests = interestsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);

  const fieldErrors: Record<string, string> = {};
  if (!fullName) fieldErrors.full_name = "Name is required.";
  if (fullName.length > 80) fieldErrors.full_name = "Name is too long.";
  if (bio.length > 500) fieldErrors.bio = "Bio must be 500 characters or fewer.";
  if (avatarUrl && !/^https?:\/\/.+/.test(avatarUrl))
    fieldErrors.avatar_url = "Enter a valid http(s) URL.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();

  const { error: userErr } = await supabase
    .from("users")
    .update({ full_name: fullName, avatar_url: avatarUrl || null })
    .eq("id", user.id);

  if (userErr) return { error: "Could not save your name. Please try again." };

  const { error: profileErr } = await supabase
    .from("member_profiles")
    .upsert(
      {
        user_id: user.id,
        class_level: classLevel || null,
        section: section || null,
        bio: bio || null,
        interests,
      },
      { onConflict: "user_id" }
    );

  if (profileErr) {
    return { error: "Could not save your profile. Please try again." };
  }

  await logAudit(supabase, "profile.update", "member_profile", user.id);

  revalidatePath("/portal/profile");
  revalidatePath("/portal");

  return { message: "Your profile has been updated." };
}
