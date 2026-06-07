import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AuditLogsRow, UsersRow } from "@/types/database";

export interface AuditEntry extends AuditLogsRow {
  actorName: string | null;
}

export interface AuditFilters {
  action?: string;
  entity?: string;
  page?: number;
  pageSize?: number;
}

const PAGE_SIZE = 25;

export async function listAuditLogs(
  filters: AuditFilters
): Promise<{ items: AuditEntry[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? PAGE_SIZE;
  if (!isSupabaseConfigured()) return { items: [], total: 0, page, pageSize };
  const supabase = await createClient();

  let q = supabase.from("audit_logs").select("*", { count: "exact" });
  if (filters.action) q = q.ilike("action", `%${filters.action}%`);
  if (filters.entity) q = q.eq("entity_type", filters.entity);

  const { data, count } = await q
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const rows = (data as AuditLogsRow[] | null) ?? [];
  const actorIds = Array.from(
    new Set(rows.map((r) => r.actor_id).filter((x): x is string => Boolean(x)))
  );
  const names = new Map<string, string>();
  if (actorIds.length) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", actorIds);
    for (const u of (users as Pick<UsersRow, "id" | "full_name">[] | null) ?? [])
      names.set(u.id, u.full_name);
  }

  return {
    items: rows.map((r) => ({
      ...r,
      actorName: r.actor_id ? names.get(r.actor_id) ?? null : null,
    })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

/** Entity types present in the log (for the filter dropdown). */
export const AUDIT_ENTITY_TYPES = [
  "user",
  "member_profile",
  "activity",
  "event",
  "achievement",
  "badge",
  "certificate",
  "program",
  "recognition_award",
  "suggestion",
  "suggestion_category",
] as const;
