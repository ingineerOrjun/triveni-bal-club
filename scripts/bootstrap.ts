/* eslint-disable no-console */
/**
 * Development bootstrap — creates the first admin, demo users, and sample data.
 *
 *   npm run bootstrap
 *
 * Safe to run repeatedly (idempotent). Refuses to run in production and never
 * overwrites an existing admin or resets passwords.
 */
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

// Load .env.local first (Next.js convention), then .env as a fallback.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

type Role = "admin" | "moderator" | "member";
type DB = SupabaseClient<Database>;

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};
const log = {
  step: (m: string) => console.log(`${c.cyan}▸${c.reset} ${m}`),
  ok: (m: string) => console.log(`  ${c.green}✓${c.reset} ${m}`),
  skip: (m: string) => console.log(`  ${c.dim}•${c.reset} ${c.dim}${m}${c.reset}`),
  warn: (m: string) => console.log(`  ${c.yellow}!${c.reset} ${m}`),
  err: (m: string) => console.error(`${c.red}✗ ${m}${c.reset}`),
};

function die(message: string): never {
  log.err(message);
  process.exit(1);
}

/* --------------------------------- config -------------------------------- */
const ADMIN = {
  email: process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@triveni.local",
  password: process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "Admin#12345",
  name: process.env.BOOTSTRAP_ADMIN_NAME ?? "Club Admin",
};
const DEMO_PASSWORD = process.env.BOOTSTRAP_DEMO_PASSWORD ?? "Demo#12345";
const DEMO_USERS: {
  email: string;
  name: string;
  role: Role;
  classLevel?: string;
  section?: string;
}[] = [
  { email: "moderator@triveni.local", name: "Maya Moderator", role: "moderator" },
  { email: "member1@triveni.local", name: "Aarav Member", role: "member", classLevel: "Grade 9", section: "A" },
  { email: "member2@triveni.local", name: "Priya Member", role: "member", classLevel: "Grade 8", section: "B" },
  { email: "member3@triveni.local", name: "Sita Member", role: "member", classLevel: "Grade 10", section: "A" },
];

interface Created {
  email: string;
  password: string;
  role: Role;
  status: "created" | "exists";
}

/* ------------------------------ user helpers ----------------------------- */
async function findUserByEmail(db: DB, email: string) {
  const { data } = await db
    .from("users")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();
  return data as { id: string; role: Role } | null;
}

async function ensureUser(
  db: DB,
  opts: { email: string; password: string; name: string; role: Role; classLevel?: string; section?: string }
): Promise<{ id: string; status: "created" | "exists" }> {
  const existing = await findUserByEmail(db, opts.email);
  if (existing) {
    // Never reset passwords or change roles of an existing account here.
    return { id: existing.id, status: "exists" };
  }

  const { data, error } = await db.auth.admin.createUser({
    email: opts.email,
    password: opts.password,
    email_confirm: true,
    user_metadata: { full_name: opts.name, role: opts.role },
  });
  if (error || !data.user) {
    throw new Error(`Could not create ${opts.email}: ${error?.message ?? "unknown error"}`);
  }
  const id = data.user.id;

  // The handle_new_user trigger creates public.users (+ profile for members).
  // Ensure the role + display name are correct regardless of trigger behaviour.
  await db.from("users").update({ role: opts.role, full_name: opts.name }).eq("id", id);

  // Ensure a profile row exists for everyone (idempotent).
  await db
    .from("member_profiles")
    .upsert(
      {
        user_id: id,
        class_level: opts.classLevel ?? null,
        section: opts.section ?? null,
        membership_status: "active",
      },
      { onConflict: "user_id", ignoreDuplicates: true }
    );

  return { id, status: "created" };
}

/* ------------------------------- seed data ------------------------------- */
async function upsertCategories(db: DB) {
  // These are also created by SQL migrations; upsert here so bootstrap works
  // even on a minimally-migrated DB. on-conflict by slug = idempotent.
  const suggestion = [
    ["activity-ideas", "Activity Ideas", 1],
    ["community-service", "Community Service", 2],
    ["environment", "Environment", 3],
    ["school-improvement", "School Improvement", 4],
    ["club-improvement", "Club Improvement", 5],
    ["events", "Events", 6],
    ["general", "General", 12],
  ] as const;
  for (const [slug, name, sort_order] of suggestion) {
    await db
      .from("suggestion_categories")
      .upsert({ slug, name, sort_order }, { onConflict: "slug", ignoreDuplicates: true });
  }

  const activity = [
    ["leadership", "Leadership", 1],
    ["environment", "Environment", 2],
    ["arts", "Arts & Culture", 3],
    ["sports", "Sports", 4],
    ["service", "Community Service", 6],
    ["science", "Science & Tech", 7],
  ] as const;
  for (const [slug, name, sort_order] of activity) {
    await db
      .from("activity_categories")
      .upsert({ slug, name, sort_order }, { onConflict: "slug", ignoreDuplicates: true });
  }

  const achievement = [
    ["leadership", "Leadership", 1],
    ["participation", "Participation", 2],
    ["community-service", "Community Service", 4],
    ["innovation", "Innovation", 9],
    ["special-recognition", "Special Recognition", 10],
  ] as const;
  for (const [slug, name, sort_order] of achievement) {
    await db
      .from("achievement_categories")
      .upsert({ slug, name, sort_order }, { onConflict: "slug", ignoreDuplicates: true });
  }
}

async function categoryId(db: DB, table: "activity_categories" | "achievement_categories" | "suggestion_categories", slug: string) {
  const { data } = await db.from(table).select("id").eq("slug", slug).maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

async function seedActivities(db: DB, adminId: string): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  const items = [
    { slug: "demo-tree-plantation", title: "Tree Plantation Drive", category: "environment", desc: "Plant and care for trees around the campus." },
    { slug: "demo-art-club", title: "Weekly Art Club", category: "arts", desc: "Hands-on painting, craft, and design sessions." },
    { slug: "demo-debate-club", title: "Debate & Public Speaking", category: "leadership", desc: "Build confidence through structured debate." },
  ];
  for (const it of items) {
    const existing = await db.from("activities").select("id").eq("slug", it.slug).maybeSingle();
    if ((existing.data as { id: string } | null)?.id) {
      ids.set(it.slug, (existing.data as { id: string }).id);
      continue;
    }
    const cat = await categoryId(db, "activity_categories", it.category);
    const { data } = await db
      .from("activities")
      .insert({
        slug: it.slug,
        title: it.title,
        description: it.desc,
        category_id: cat,
        status: "published",
        published_at: new Date().toISOString(),
        created_by: adminId,
      })
      .select("id")
      .single();
    if (data) ids.set(it.slug, (data as { id: string }).id);
  }
  return ids;
}

async function seedEvents(db: DB, adminId: string): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  const soon = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
  const items = [
    { slug: "demo-agm", title: "Annual General Meeting", venue: "Assembly Hall", capacity: 200 },
    { slug: "demo-science-fair", title: "Science & Innovation Fair", venue: "Courtyard", capacity: 80 },
  ];
  for (const it of items) {
    const existing = await db.from("events").select("id").eq("slug", it.slug).maybeSingle();
    if ((existing.data as { id: string } | null)?.id) {
      ids.set(it.slug, (existing.data as { id: string }).id);
      continue;
    }
    const { data } = await db
      .from("events")
      .insert({
        slug: it.slug,
        title: it.title,
        description: `${it.title} — a sample event created by bootstrap.`,
        venue: it.venue,
        starts_at: soon,
        capacity: it.capacity,
        status: "published",
        published_at: new Date().toISOString(),
        created_by: adminId,
      })
      .select("id")
      .single();
    if (data) ids.set(it.slug, (data as { id: string }).id);
  }
  return ids;
}

async function seedParticipation(
  db: DB,
  memberIds: string[],
  activityIds: Map<string, string>,
  eventIds: Map<string, string>
) {
  const activityId = activityIds.get("demo-tree-plantation");
  const eventId = eventIds.get("demo-agm");

  for (const memberId of memberIds) {
    if (activityId) {
      await db
        .from("activity_participants")
        .upsert(
          { activity_id: activityId, member_id: memberId },
          { onConflict: "activity_id,member_id", ignoreDuplicates: true }
        );
    }
    if (eventId) {
      await db
        .from("event_registrations")
        .upsert(
          { event_id: eventId, member_id: memberId, status: "registered" },
          { onConflict: "event_id,member_id", ignoreDuplicates: true }
        );
      await db
        .from("attendance_records")
        .upsert(
          { event_id: eventId, member_id: memberId, status: "present" },
          { onConflict: "event_id,member_id", ignoreDuplicates: true }
        );
    }
  }
}

async function seedAchievements(db: DB, memberId: string, adminId: string) {
  const exists = await db
    .from("member_achievements")
    .select("id")
    .eq("member_id", memberId)
    .eq("title", "Outstanding Volunteer")
    .maybeSingle();
  if ((exists.data as { id: string } | null)?.id) return;

  const cat = await categoryId(db, "achievement_categories", "community-service");
  await db.from("member_achievements").insert({
    member_id: memberId,
    title: "Outstanding Volunteer",
    description: "Recognised for outstanding contribution to community service.",
    category_id: cat,
    visibility: "public",
    status: "awarded",
    source: "manual",
    awarded_by: adminId,
  });
}

async function seedSuggestion(db: DB, memberId: string) {
  const exists = await db
    .from("suggestions")
    .select("id")
    .eq("title", "Add a recycling station in every classroom")
    .maybeSingle();
  if ((exists.data as { id: string } | null)?.id) return;

  const cat = await categoryId(db, "suggestion_categories", "environment");
  const { data } = await db
    .from("suggestions")
    .insert({
      title: "Add a recycling station in every classroom",
      description:
        "Place clearly labelled recycling bins in each classroom to reduce waste and build green habits.",
      category_id: cat,
      author_id: memberId,
      status: "implemented",
      visibility: "public",
    })
    .select("id")
    .single();
  if (data) {
    await db.from("suggestion_status_history").insert({
      suggestion_id: (data as { id: string }).id,
      new_status: "implemented",
      changed_by: memberId,
      reason: "Seeded sample success story",
    });
  }
}

async function runBadgeEngine(db: DB, memberId: string) {
  const rpc = db.rpc.bind(db) as (
    fn: string,
    args: Record<string, unknown>
  ) => PromiseLike<{ error: unknown }>;
  await rpc("evaluate_member_badges", { p_member: memberId });
}

/* --------------------------------- main ---------------------------------- */
async function main() {
  console.log(`\n${c.bold}Triveni Child Club — bootstrap${c.reset}\n`);

  // 1. Production safety
  if (process.env.NODE_ENV === "production") {
    die("Refusing to run: NODE_ENV=production. Bootstrap is for development only.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    die(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
        "  Add them to .env.local (see .env.example), then re-run."
    );
  }

  const db = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 2. Verify connection
  log.step("Verifying Supabase connection…");
  const ping = await db.from("users").select("id", { count: "exact", head: true });
  if (ping.error) {
    die(
      `Could not query the database: ${ping.error.message}\n` +
        "  Did you run `supabase db push` first?"
    );
  }
  log.ok("Connected.");

  const credentials: Created[] = [];

  // 3. Admin (idempotent, never overwrites)
  log.step("Ensuring an admin account…");
  const { data: anyAdmin } = await db
    .from("users")
    .select("email")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();
  let adminId: string;
  if (anyAdmin) {
    const adminEmail = (anyAdmin as { email: string }).email;
    log.skip(`Admin already exists (${adminEmail}) — leaving it untouched.`);
    const row = await findUserByEmail(db, adminEmail);
    adminId = row!.id;
  } else {
    const res = await ensureUser(db, { ...ADMIN, role: "admin" });
    adminId = res.id;
    log.ok(`Created admin ${ADMIN.email}`);
    credentials.push({ email: ADMIN.email, password: ADMIN.password, role: "admin", status: "created" });
  }

  // 4. Demo users
  log.step("Ensuring demo accounts…");
  const memberIds: string[] = [];
  for (const u of DEMO_USERS) {
    const res = await ensureUser(db, { ...u, password: DEMO_PASSWORD });
    if (u.role === "member") memberIds.push(res.id);
    credentials.push({ email: u.email, password: DEMO_PASSWORD, role: u.role, status: res.status });
    if (res.status === "created") log.ok(`Created ${u.role}: ${u.email}`);
    else log.skip(`${u.email} already exists — unchanged.`);
  }

  // 5. Seed data (idempotent)
  log.step("Seeding categories…");
  await upsertCategories(db);
  log.ok("Categories ready.");

  log.step("Seeding sample activities & events…");
  const activityIds = await seedActivities(db, adminId);
  const eventIds = await seedEvents(db, adminId);
  log.ok(`${activityIds.size} activities, ${eventIds.size} events.`);

  if (memberIds.length > 0) {
    log.step("Seeding participation, achievements & a sample idea…");
    await seedParticipation(db, memberIds, activityIds, eventIds);
    await seedAchievements(db, memberIds[0], adminId);
    await seedSuggestion(db, memberIds[0]);
    for (const id of memberIds) await runBadgeEngine(db, id);
    log.ok("Sample data ready (badges auto-awarded from participation).");
  }

  // 6. Print credentials
  printCredentials(credentials);
}

function printCredentials(credentials: Created[]) {
  console.log(`\n${c.bold}Login credentials${c.reset} ${c.dim}(local development)${c.reset}`);
  console.log(`${c.dim}Sign in at http://localhost:3000/auth/login${c.reset}\n`);
  const pad = (s: string, n: number) => s.padEnd(n);
  console.log(
    `  ${c.bold}${pad("ROLE", 11)}${pad("EMAIL", 28)}${pad("PASSWORD", 16)}STATUS${c.reset}`
  );
  for (const cr of credentials) {
    const status =
      cr.status === "created" ? `${c.green}created${c.reset}` : `${c.dim}existing${c.reset}`;
    console.log(
      `  ${pad(cr.role, 11)}${pad(cr.email, 28)}${pad(cr.password, 16)}${status}`
    );
  }
  console.log(
    `\n${c.yellow}!${c.reset} These are development credentials. Change them before any real deployment.\n`
  );
}

main().catch((e) => {
  die(e instanceof Error ? e.message : String(e));
});
