import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface ExportData {
  headers: string[];
  rows: Record<string, unknown>[];
}
export type Exporter = () => Promise<ExportData>;

const exportMembers: Exporter = async () => {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, role, is_active, created_at")
    .order("created_at", { ascending: false });
  const list = (users as { id: string; full_name: string; email: string; role: string; is_active: boolean; created_at: string }[] | null) ?? [];
  const { data: profiles } = await supabase
    .from("member_profiles")
    .select("user_id, class_level, section, membership_status");
  const byId = new Map(
    ((profiles as { user_id: string; class_level: string | null; section: string | null; membership_status: string }[] | null) ?? []).map((p) => [p.user_id, p])
  );
  return {
    headers: ["Name", "Email", "Role", "Active", "Class", "Section", "Membership", "Joined"],
    rows: list.map((u) => {
      const p = byId.get(u.id);
      return {
        Name: u.full_name,
        Email: u.email,
        Role: u.role,
        Active: u.is_active ? "yes" : "no",
        Class: p?.class_level ?? "",
        Section: p?.section ?? "",
        Membership: p?.membership_status ?? "",
        Joined: u.created_at.slice(0, 10),
      };
    }),
  };
};

const exportActivities: Exporter = async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("title, status, starts_on, ends_on, created_at")
    .order("created_at", { ascending: false });
  const rows = (data as { title: string; status: string; starts_on: string | null; ends_on: string | null; created_at: string }[] | null) ?? [];
  return {
    headers: ["Title", "Status", "Starts", "Ends", "Created"],
    rows: rows.map((a) => ({
      Title: a.title,
      Status: a.status,
      Starts: a.starts_on ?? "",
      Ends: a.ends_on ?? "",
      Created: a.created_at.slice(0, 10),
    })),
  };
};

const exportEvents: Exporter = async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("title, venue, starts_at, capacity, status")
    .order("starts_at", { ascending: false });
  const rows = (data as { title: string; venue: string | null; starts_at: string; capacity: number | null; status: string }[] | null) ?? [];
  return {
    headers: ["Title", "Venue", "Starts", "Capacity", "Status"],
    rows: rows.map((e) => ({
      Title: e.title,
      Venue: e.venue ?? "",
      Starts: e.starts_at,
      Capacity: e.capacity ?? "",
      Status: e.status,
    })),
  };
};

const exportSuggestions: Exporter = async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("suggestions")
    .select("title, status, priority, support_count, created_at")
    .order("created_at", { ascending: false });
  const rows = (data as { title: string; status: string; priority: string; support_count: number; created_at: string }[] | null) ?? [];
  return {
    headers: ["Title", "Status", "Priority", "Support", "Created"],
    rows: rows.map((s) => ({
      Title: s.title,
      Status: s.status,
      Priority: s.priority,
      Support: s.support_count,
      Created: s.created_at.slice(0, 10),
    })),
  };
};

const exportAchievements: Exporter = async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("member_achievements")
    .select("title, visibility, status, award_date")
    .order("award_date", { ascending: false });
  const rows = (data as { title: string; visibility: string; status: string; award_date: string }[] | null) ?? [];
  return {
    headers: ["Title", "Visibility", "Status", "Award date"],
    rows: rows.map((a) => ({
      Title: a.title,
      Visibility: a.visibility,
      Status: a.status,
      "Award date": a.award_date,
    })),
  };
};

export const EXPORTERS: Record<string, Exporter> = {
  members: exportMembers,
  activities: exportActivities,
  events: exportEvents,
  suggestions: exportSuggestions,
  achievements: exportAchievements,
};
