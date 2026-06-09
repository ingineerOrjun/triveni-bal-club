# Supabase — setup

## Apply migrations

```bash
# with the Supabase CLI linked to your project
supabase db push          # applies supabase/migrations/*.sql in order
supabase gen types typescript --linked > src/types/database.ts
```

Migrations (run in order):
1. `0001_init_auth_schema.sql` — enums, `users`, `member_profiles`, `audit_logs`, triggers, `handle_new_user`.
2. `0002_functions.sql` — `current_user_role()`, `is_admin()`, access-token hook, `log_audit()`.
3. `0003_rls_policies.sql` — Row Level Security policies (auth tables).
4. `0004_activities_events_schema.sql` — `activity_categories`, `activities`, `activity_participants`, `events`, `event_registrations`, `attendance_records` (+ enums).
5. `0005_participation_functions.sql` — capacity/deadline/publish enforcement trigger, cancel-stamp trigger, `event_registered_count()`.
6. `0006_activities_events_rls.sql` — `is_staff()` + RLS for all participation tables.
7. `0007_seed_categories.sql` — default activity categories.
8. `0008_audit_fixes.sql` — Phase-5 audit fixes: sort-key indexes, capacity-race row lock in the registration trigger, defense-in-depth RLS (members may only register for published events).
9. `0009_recognition_schema.sql` — `achievement_categories`, `badges`, `badge_rules`, `member_achievements`, `member_badges`, `certificates`, `recognition_programs`, `recognition_awards` (+ enums).
10. `0010_recognition_functions.sql` — `evaluate_member_badges()` (data-driven badge engine) and public `verify_certificate()`.
11. `0011_recognition_rls.sql` — RLS for all recognition tables (admins award/issue; moderators recommend only).
12. `0012_seed_recognition.sql` — seed categories, badges, and automatic badge rules.
13. `0013_student_voice_schema.sql` — `suggestion_categories`, `tags`, `suggestions`, `suggestion_status_history`, `suggestion_votes`, `moderator_feedback`, `suggestion_tags` (+ enums).
14. `0014_student_voice_functions.sql` — support-count trigger, delete guard + status-history safety net, and recognition-engine extension (suggestion metrics).
15. `0015_student_voice_rls.sql` — RLS for all Student-Voice tables (members edit drafts only; anonymity preserved; staff review).
16. `0016_seed_student_voice.sql` — seed suggestion categories, tags, and Student-Voice badges/rules.
17. `0017_app_settings.sql` — admin-managed CMS settings store (`app_settings`) + RLS + seed defaults.
18. `0018_media_schema.sql` — Media Library: `media_folders`, `media_files`, `media_tags`, `media_file_tags`, `media_usage`, `media_versions`, `media_favorites`, `media_collections`, `media_collection_items` (+ enums, checksum dedupe).
19. `0019_media_storage.sql` — Storage buckets (media-public/private, gallery, avatars, certificates, documents) + storage RLS + `media_in_use()` delete-guard.
20. `0020_media_rls.sql` — RLS for all media tables (members none; moderators upload/edit; admins full).
21. `0021_gallery_cms.sql` — `gallery_albums` + `gallery_photos` (Media-Library-backed) + RLS.
22. `0022_import_export.sql` — Import/Export engine: `import_jobs`, `import_rows`, `import_templates`, `export_jobs`, `export_templates`, `import_logs`, `export_logs`, `column_mappings`, `validation_errors` (+ enums, admin-only RLS).
23. `0023_cms.sql` — Visual CMS: `cms_pages`, `cms_page_versions`, `cms_menus`, `cms_menu_items` (+ `cms_page_status` enum; published pages public, staff manage).
24. `0024_elections.sql` — Elections: `election_terms`, `elections`, `positions`, `candidate_nominations`, `votes` (anonymous), `vote_receipts`, `result_snapshots`, `committee_assignments` (+ enums).
25. `0025_election_functions.sql` — secret-ballot `cast_vote()`, `get_election_results()`, `election_turnout()`, `has_voted()` (SECURITY DEFINER) + RLS (votes table has NO direct access).

## Enable the access-token hook (one-time, dashboard)

Authentication → **Hooks** → *Customize Access Token (JWT) Claims* →
select `public.custom_access_token_hook`. This injects `user_role` into the JWT.

## Auth settings

- Authentication → **URL Configuration**:
  - Site URL: your deployed origin (e.g. `http://localhost:3000` in dev)
  - Redirect URLs: add `<origin>/auth/callback`
- Email templates: the default reset-password email works with the
  `resetPasswordForEmail` redirect used by the app.

## Roles

`public | member | moderator | admin`. New signups default to `member`
(via `handle_new_user`). To create staff, set `role` in the invite's
`user_metadata`, or update `public.users.role` with the service role.

## Members are admin-provisioned

Students don't self-register. Admins create accounts (later phase) using the
service-role client; the trigger creates the matching `users` +
`member_profiles` rows automatically.
