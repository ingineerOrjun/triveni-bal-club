"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth/session";
import { requireStaffUser } from "@/lib/auth/guards";
import { logAudit } from "@/lib/supabase/audit";
import { runBadgeEngine } from "@/lib/recognition/engine";
import { friendlyRegistrationError } from "@/lib/events/errors";
import { slugify } from "@/lib/utils";
import { type FormState, zodFieldErrors } from "@/lib/forms";
import { eventInputSchema } from "./schema";
import type { AttendanceStatus, ContentStatus } from "@/types/database";

function parseForm(formData: FormData) {
  return eventInputSchema.safeParse({
    title: formData.get("title"),
    title_ne: formData.get("title_ne") ?? "",
    description: formData.get("description") ?? "",
    venue: formData.get("venue") ?? "",
    starts_at: formData.get("starts_at") ?? "",
    ends_at: formData.get("ends_at") ?? "",
    capacity: formData.get("capacity") ?? "",
    registration_deadline: formData.get("registration_deadline") ?? "",
  });
}

function toRow(input: ReturnType<typeof eventInputSchema.parse>) {
  return {
    title: input.title,
    title_ne: input.title_ne || null,
    description: input.description || null,
    venue: input.venue || null,
    starts_at: input.starts_at,
    ends_at: input.ends_at || null,
    capacity: input.capacity ?? null,
    registration_deadline: input.registration_deadline || null,
  };
}

/* ------------------------------- staff CRUD ------------------------------- */
export async function createEvent(
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
    .from("events")
    .insert({ ...toRow(parsed.data), slug, created_by: user.id, status: "draft" })
    .select("id")
    .single();

  if (error) return { error: "Could not create the event." };

  await logAudit(supabase, "event.create", "event", (data as { id: string }).id);
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function updateEvent(
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
  const { error } = await supabase.from("events").update(toRow(parsed.data)).eq("id", id);
  if (error) return { error: "Could not save changes." };

  await logAudit(supabase, "event.update", "event", id);
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}/edit`);
  redirect("/admin/events");
}

export async function setEventStatus(id: string, status: ContentStatus) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;

  const supabase = await createClient();
  const patch: { status: ContentStatus; published_at?: string } = { status };
  if (status === "published") patch.published_at = new Date().toISOString();

  await supabase.from("events").update(patch).eq("id", id);
  await logAudit(supabase, `event.${status}`, "event", id);
  revalidatePath("/admin/events");
  revalidatePath("/portal/events");
}

export async function deleteEvent(id: string) {
  const user = await requireStaffUser();
  if (!user || !isSupabaseConfigured()) return;

  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id);
  await logAudit(supabase, "event.delete", "event", id);
  revalidatePath("/admin/events");
}

/* --------------------------- member registration -------------------------- */
export async function registerForEvent(
  eventId: string,
  _prev: FormState,
  _formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to register." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const supabase = await createClient();
  // Trigger enforces publish/deadline/capacity and returns a friendly message.
  const { error } = await supabase
    .from("event_registrations")
    .upsert(
      { event_id: eventId, member_id: user.id, status: "registered" },
      { onConflict: "event_id,member_id" }
    );

  if (error) {
    return { error: friendlyRegistrationError(error.message) };
  }

  await logAudit(supabase, "event.register", "event", eventId);
  await runBadgeEngine(user.id); // award "first event" etc. automatically
  revalidatePath("/portal/events");
  revalidatePath("/portal/participation");
  revalidatePath("/portal/badges");
  return { message: "You're registered!" };
}

export async function cancelRegistration(
  eventId: string,
  _prev: FormState,
  _formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("event_registrations")
    .update({ status: "cancelled" })
    .eq("event_id", eventId)
    .eq("member_id", user.id);

  if (error) return { error: "Could not cancel your registration." };

  await logAudit(supabase, "event.cancel", "event", eventId);
  revalidatePath("/portal/events");
  revalidatePath("/portal/participation");
  return { message: "Your registration was cancelled." };
}

/* ------------------------------- attendance ------------------------------- */
export async function markAttendance(
  eventId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireStaffUser();
  if (!user) return { error: "You don't have permission to do that." };
  if (!isSupabaseConfigured()) return { error: "Backend not configured." };

  // Inputs are named `att:<memberId>` with value present | absent | "".
  const rows: {
    event_id: string;
    member_id: string;
    status: AttendanceStatus;
    marked_by: string;
  }[] = [];

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("att:")) continue;
    const memberId = key.slice(4);
    const v = String(value);
    if (v === "present" || v === "absent") {
      rows.push({
        event_id: eventId,
        member_id: memberId,
        status: v,
        marked_by: user.id,
      });
    }
  }

  if (rows.length === 0) return { message: "No changes to save." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("attendance_records")
    .upsert(rows, { onConflict: "event_id,member_id" });

  if (error) return { error: "Could not save attendance." };

  await logAudit(supabase, "attendance.mark", "event", eventId, {
    count: rows.length,
  });
  // Award attendance-based badges to members marked present.
  await Promise.all(
    rows
      .filter((r) => r.status === "present")
      .map((r) => runBadgeEngine(r.member_id))
  );
  revalidatePath(`/admin/attendance/${eventId}`);
  return { message: `Attendance saved for ${rows.length} member(s).` };
}
