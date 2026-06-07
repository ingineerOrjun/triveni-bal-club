"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/auth/guards";
import { logAudit } from "@/lib/supabase/audit";
import { type FormState } from "@/lib/forms";
import type { UserRole } from "@/types/database";

/* ============================== settings (CMS) =========================== */
async function saveSetting(
  key: string,
  value: Record<string, unknown>
): Promise<FormState> {
  const user = await requireAdminUser();
  if (!user) return { error: "Admins only." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .upsert(
      { key, value, updated_by: user.id, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
  if (error) return { error: "Could not save settings." };

  await logAudit(supabase, "settings.update", "settings", null, { key });
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout"); // public pages may read public settings
  return { message: "Settings saved." };
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const bool = (fd: FormData, k: string) => fd.get(k) === "on";

export async function saveGeneral(_p: FormState, fd: FormData): Promise<FormState> {
  return saveSetting("general", {
    clubName: str(fd, "clubName"),
    schoolName: str(fd, "schoolName"),
    academicYear: str(fd, "academicYear"),
    timezone: str(fd, "timezone"),
    language: str(fd, "language"),
  });
}

export async function saveContact(_p: FormState, fd: FormData): Promise<FormState> {
  return saveSetting("contact", {
    email: str(fd, "email"),
    phone: str(fd, "phone"),
    address: str(fd, "address"),
    officeHours: str(fd, "officeHours"),
  });
}

export async function saveSocial(_p: FormState, fd: FormData): Promise<FormState> {
  return saveSetting("social", {
    facebook: str(fd, "facebook"),
    instagram: str(fd, "instagram"),
    youtube: str(fd, "youtube"),
  });
}

export async function saveHomepage(_p: FormState, fd: FormData): Promise<FormState> {
  return saveSetting("homepage", {
    heroTitle: str(fd, "heroTitle"),
    heroSubtitle: str(fd, "heroSubtitle"),
    heroCtaLabel: str(fd, "heroCtaLabel"),
    heroCtaHref: str(fd, "heroCtaHref"),
  });
}

export async function saveSeo(_p: FormState, fd: FormData): Promise<FormState> {
  return saveSetting("seo", {
    defaultTitle: str(fd, "defaultTitle"),
    defaultDescription: str(fd, "defaultDescription"),
    ogImage: str(fd, "ogImage"),
  });
}

export async function saveFeatures(_p: FormState, fd: FormData): Promise<FormState> {
  return saveSetting("features", {
    studentVoice: bool(fd, "studentVoice"),
    recognition: bool(fd, "recognition"),
    maintenanceMode: bool(fd, "maintenanceMode"),
  });
}

/* ========================== member administration ======================== */
const VALID_ROLES: UserRole[] = ["member", "moderator", "admin"];

export async function setMemberRole(id: string, role: UserRole) {
  const user = await requireAdminUser();
  if (!user || !isSupabaseConfigured()) return;
  if (!VALID_ROLES.includes(role)) return;
  const supabase = await createClient();
  await supabase.from("users").update({ role }).eq("id", id);
  await logAudit(supabase, "member.role", "user", id, { role });
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
}

export async function setMemberActive(id: string, active: boolean) {
  const user = await requireAdminUser();
  if (!user || !isSupabaseConfigured()) return;
  const supabase = await createClient();
  await supabase.from("users").update({ is_active: active }).eq("id", id);
  await logAudit(supabase, active ? "member.activate" : "member.deactivate", "user", id);
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
}

/** Bulk role / active actions from a selection of ids (admin only). */
export async function bulkMemberAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireAdminUser();
  if (!user) return { error: "Admins only." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const ids = formData.getAll("ids").map(String).filter(Boolean);
  const op = String(formData.get("op") ?? "");
  if (ids.length === 0) return { error: "Select at least one member." };

  const supabase = await createClient();
  // Never let an admin change their own row in a bulk op (avoid self-lockout).
  const targets = ids.filter((id) => id !== user.id);
  if (targets.length === 0) return { error: "No eligible members selected." };

  if (op.startsWith("role:")) {
    const role = op.slice(5) as UserRole;
    if (!VALID_ROLES.includes(role)) return { error: "Invalid role." };
    await supabase.from("users").update({ role }).in("id", targets);
    await logAudit(supabase, "member.bulk_role", "user", null, { count: targets.length, role });
    revalidatePath("/admin/members");
    return { message: `Updated role for ${targets.length} member(s).` };
  }
  if (op === "activate" || op === "deactivate") {
    await supabase.from("users").update({ is_active: op === "activate" }).in("id", targets);
    await logAudit(supabase, `member.bulk_${op}`, "user", null, { count: targets.length });
    revalidatePath("/admin/members");
    return { message: `${op === "activate" ? "Activated" : "Deactivated"} ${targets.length} member(s).` };
  }
  return { error: "Unknown bulk action." };
}
