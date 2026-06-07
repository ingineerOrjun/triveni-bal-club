import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  EventRow,
  EventRegistrationRow,
  AttendanceRecordRow,
  UsersRow,
} from "@/types/database";

export type EventWithCount = EventRow & { registeredCount: number };

export type RegistrationWithMember = EventRegistrationRow & {
  member: Pick<UsersRow, "id" | "full_name" | "email"> | null;
};

export type MemberRegistration = EventRegistrationRow & { event: EventRow };

export type ParticipationEntry = {
  event: EventRow;
  registration: EventRegistrationRow | null;
  attendance: AttendanceRecordRow | null;
};

async function registeredCounts(
  eventIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (eventIds.length === 0) return counts;
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_registrations")
    .select("event_id, status")
    .in("event_id", eventIds)
    .eq("status", "registered");
  for (const row of (data as { event_id: string }[] | null) ?? []) {
    counts.set(row.event_id, (counts.get(row.event_id) ?? 0) + 1);
  }
  return counts;
}

/** List events (RLS controls draft visibility). Sorted soonest-first. */
export async function listEvents(): Promise<EventWithCount[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: true });
  const events = (data as EventRow[] | null) ?? [];
  const counts = await registeredCounts(events.map((e) => e.id));
  return events.map((e) => ({ ...e, registeredCount: counts.get(e.id) ?? 0 }));
}

export async function getEventById(
  id: string
): Promise<EventWithCount | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const event = data as EventRow | null;
  if (!event) return null;
  const counts = await registeredCounts([event.id]);
  return { ...event, registeredCount: counts.get(event.id) ?? 0 };
}

/** The member's active (registered) upcoming/all registrations with event. */
export async function listMemberRegistrations(
  memberId: string
): Promise<MemberRegistration[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data: regs } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("member_id", memberId);
  const registrations = (regs as EventRegistrationRow[] | null) ?? [];
  if (registrations.length === 0) return [];

  const { data: evs } = await supabase
    .from("events")
    .select("*")
    .in("id", registrations.map((r) => r.event_id));
  const byId = new Map(((evs as EventRow[] | null) ?? []).map((e) => [e.id, e]));

  return registrations
    .map((r) => {
      const event = byId.get(r.event_id);
      return event ? { ...r, event } : null;
    })
    .filter((x): x is MemberRegistration => x !== null);
}

/** Map of eventId -> the member's registration (any status). */
export async function getMemberRegistrationMap(
  memberId: string
): Promise<Map<string, EventRegistrationRow>> {
  const map = new Map<string, EventRegistrationRow>();
  if (!isSupabaseConfigured()) return map;
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("member_id", memberId);
  for (const r of (data as EventRegistrationRow[] | null) ?? []) {
    map.set(r.event_id, r);
  }
  return map;
}

/** Full participation history (registrations + attendance) for the timeline. */
export async function listParticipation(
  memberId: string
): Promise<ParticipationEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const [{ data: regs }, { data: atts }] = await Promise.all([
    supabase.from("event_registrations").select("*").eq("member_id", memberId),
    supabase.from("attendance_records").select("*").eq("member_id", memberId),
  ]);
  const registrations = (regs as EventRegistrationRow[] | null) ?? [];
  const attendance = (atts as AttendanceRecordRow[] | null) ?? [];

  const eventIds = Array.from(
    new Set([
      ...registrations.map((r) => r.event_id),
      ...attendance.map((a) => a.event_id),
    ])
  );
  if (eventIds.length === 0) return [];

  const { data: evs } = await supabase
    .from("events")
    .select("*")
    .in("id", eventIds);
  const events = (evs as EventRow[] | null) ?? [];
  const regByEvent = new Map(registrations.map((r) => [r.event_id, r]));
  const attByEvent = new Map(attendance.map((a) => [a.event_id, a]));

  return events
    .map((event) => ({
      event,
      registration: regByEvent.get(event.id) ?? null,
      attendance: attByEvent.get(event.id) ?? null,
    }))
    .sort(
      (a, b) =>
        new Date(b.event.starts_at).getTime() -
        new Date(a.event.starts_at).getTime()
    );
}

/* ------------------------------- staff views ------------------------------ */
export async function listRegistrationsForEvent(
  eventId: string
): Promise<RegistrationWithMember[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data: regs } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("event_id", eventId)
    .order("registered_at", { ascending: true });
  const registrations = (regs as EventRegistrationRow[] | null) ?? [];
  if (registrations.length === 0) return [];

  const { data: members } = await supabase
    .from("users")
    .select("id, full_name, email")
    .in("id", registrations.map((r) => r.member_id));
  const byId = new Map(
    ((members as Pick<UsersRow, "id" | "full_name" | "email">[] | null) ?? []).map(
      (m) => [m.id, m]
    )
  );

  return registrations.map((r) => ({ ...r, member: byId.get(r.member_id) ?? null }));
}

export async function getAttendanceMap(
  eventId: string
): Promise<Map<string, AttendanceRecordRow>> {
  const map = new Map<string, AttendanceRecordRow>();
  if (!isSupabaseConfigured()) return map;
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("event_id", eventId);
  for (const a of (data as AttendanceRecordRow[] | null) ?? []) {
    map.set(a.member_id, a);
  }
  return map;
}
