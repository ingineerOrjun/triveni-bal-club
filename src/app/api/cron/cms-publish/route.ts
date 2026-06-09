import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * GET /api/cron/cms-publish — publishes scheduled pages whose time has arrived.
 * Protect with CRON_SECRET (header `authorization: Bearer <secret>` or `?secret=`).
 * Wire to Vercel Cron (e.g. every 5 minutes).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.nextUrl.searchParams.get("secret") ??
    "";
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, published: 0, note: "not configured" });
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data } = await admin
    .from("cms_pages")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", nowIso);
  const due = (data as { id: string }[] | null) ?? [];

  for (const p of due) {
    await admin
      .from("cms_pages")
      .update({ status: "published", published_at: nowIso, scheduled_at: null })
      .eq("id", p.id);
  }

  return NextResponse.json({ ok: true, published: due.length });
}
