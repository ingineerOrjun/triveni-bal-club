import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import type { ImportModeValue, RowIssue } from "./types";
import type { UserRole } from "@/types/database";

export interface ImporterResult {
  imported: number;
  skipped: number;
  failed: number;
  issues: RowIssue[];
}

export interface ImporterContext {
  mode: ImportModeValue;
  validRowNumbers: Set<number>;
}

export type Importer = (
  rows: Record<string, string>[],
  ctx: ImporterContext
) => Promise<ImporterResult>;

const VALID_ROLES: UserRole[] = ["member", "moderator", "admin"];

/* ------------------------------- members --------------------------------- */
const importMembers: Importer = async (rows, { mode, validRowNumbers }) => {
  const res: ImporterResult = { imported: 0, skipped: 0, failed: 0, issues: [] };
  const supabase = await createClient();
  const admin = createAdminClient();

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 1;
    if (!validRowNumbers.has(rowNumber)) {
      res.failed++;
      continue;
    }
    const r = rows[i];
    const email = r.email.toLowerCase();
    const role: UserRole = VALID_ROLES.includes(r.role as UserRole)
      ? (r.role as UserRole)
      : "member";

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    const existingId = (existing as { id: string } | null)?.id ?? null;

    if (mode === "dry_run") {
      res.imported++; // would-import
      continue;
    }

    if (existingId) {
      if (mode === "insert" || mode === "ignore_duplicates") {
        res.skipped++;
        continue;
      }
      // upsert → update
      await supabase.from("users").update({ full_name: r.full_name, role }).eq("id", existingId);
      await supabase
        .from("member_profiles")
        .upsert(
          { user_id: existingId, class_level: r.class_level || null, section: r.section || null },
          { onConflict: "user_id" }
        );
      res.imported++;
      continue;
    }

    // create new account
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { full_name: r.full_name, role },
    });
    if (error || !created.user) {
      res.failed++;
      res.issues.push({ row: rowNumber, field: "email", value: email, rule: "create", message: error?.message ?? "Could not create account." });
      continue;
    }
    await supabase.from("users").update({ full_name: r.full_name, role }).eq("id", created.user.id);
    await supabase
      .from("member_profiles")
      .upsert(
        { user_id: created.user.id, class_level: r.class_level || null, section: r.section || null, membership_status: "active" },
        { onConflict: "user_id" }
      );
    res.imported++;
  }
  return res;
};

/* ------------------------------ activities ------------------------------- */
const importActivities: Importer = async (rows, { mode, validRowNumbers }) => {
  const res: ImporterResult = { imported: 0, skipped: 0, failed: 0, issues: [] };
  const supabase = await createClient();

  const { data: cats } = await supabase.from("activity_categories").select("id, slug");
  const catBySlug = new Map(
    ((cats as { id: string; slug: string }[] | null) ?? []).map((c) => [c.slug, c.id])
  );

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 1;
    if (!validRowNumbers.has(rowNumber)) {
      res.failed++;
      continue;
    }
    const r = rows[i];
    const status = ["draft", "published", "archived"].includes(r.status) ? r.status : "draft";
    const categoryId = r.category ? catBySlug.get(r.category) ?? null : null;

    const { data: existing } = await supabase
      .from("activities")
      .select("id")
      .eq("title", r.title)
      .maybeSingle();
    const existingId = (existing as { id: string } | null)?.id ?? null;

    if (mode === "dry_run") {
      res.imported++;
      continue;
    }
    if (existingId) {
      if (mode === "insert" || mode === "ignore_duplicates") {
        res.skipped++;
        continue;
      }
      await supabase
        .from("activities")
        .update({ description: r.description || null, category_id: categoryId, status: status as "draft" })
        .eq("id", existingId);
      res.imported++;
      continue;
    }

    const { error } = await supabase.from("activities").insert({
      slug: `${slugify(r.title)}-${crypto.randomUUID().slice(0, 6)}`,
      title: r.title,
      description: r.description || null,
      category_id: categoryId,
      status: status as "draft",
    });
    if (error) {
      res.failed++;
      res.issues.push({ row: rowNumber, field: "title", value: r.title, rule: "insert", message: error.message });
    } else {
      res.imported++;
    }
  }
  return res;
};

export const IMPORTERS: Record<string, Importer> = {
  members: importMembers,
  activities: importActivities,
};
