# Phase 7 — Student Voice & Suggestion System

Extends the existing architecture (auth, RBAC, RLS, audit, recognition engine) — nothing was rewritten.

## Data model (migrations 0013–0016)
- **`suggestion_categories`** (admin-managed), **`tags`** + **`suggestion_tags`** (join), **`suggestions`**, **`suggestion_status_history`**, **`suggestion_votes`** (support only), **`moderator_feedback`**.
- Enums: `suggestion_status` (draft → submitted → under_review → accepted → planned → in_progress → implemented; + rejected, archived), `suggestion_visibility` (private/members/public), `suggestion_priority` (low/medium/high/critical).
- Indexes on every filter/sort column (status, category, priority, author, assigned_to, visibility+status, created_at, updated_at, support_count, tag joins).

## Database guarantees (defense in depth)
- **One support per member**: `unique(suggestion_id, member_id)`.
- **`support_count`** kept accurate by an after-insert/delete trigger (no N+1 counting).
- **Cannot delete accepted/implemented** suggestions: `prevent_locked_delete` trigger + RLS delete policy restricted to `status='draft'`.
- **Edit lock**: author RLS update policy only matches `status='draft'` (and may move draft→submitted). After review only staff can edit.
- **Status history safety net**: `record_status_change` trigger logs any status change even if the app path is bypassed; the server action additionally records a *reason*.
- **Anonymity with accountability**: anonymous suggestions are hidden from members and the public via RLS (`not is_anonymous` in the public/members read branches), but `author_id` is always stored and `audit_logs` always records the real actor.

## RLS summary
- Members: read own + approved members/public; create own; edit/delete own drafts; support members/public ideas.
- Moderators (`is_staff`): read all; change status; triage; leave feedback.
- Admins: everything incl. categories, merge, archive.
- Public (anon): only `visibility='public'` + approved statuses, non-anonymous.

## Recognition integration (reuses Phase-6 engine — no duplicate logic)
- Extended `badge_rules` metric vocabulary + `evaluate_member_badges()` with `suggestions_submitted`, `suggestions_implemented`, `suggestions_supported`.
- Seeded badges: First Suggestion, Community Builder, Top Contributor, Innovation Champion, Helpful Contributor.
- `runBadgeEngine()` is invoked after submit, after support, and when a suggestion is marked implemented (awards the author).

## Server actions (`src/lib/suggestions/actions.ts`)
`submitSuggestion`, `updateSuggestion`, `deleteDraft`, `supportSuggestion`, `removeSupport`, `changeStatus`, `triageSuggestion`, `leaveModeratorFeedback`, `archiveSuggestion`, `mergeSuggestions`, `createCategory`, `setCategoryActive`. All: Zod-validated, role-guarded (`requireStaffUser`/`requireAdminUser`/`getCurrentUser`), audit-logged, friendly errors.

## Routes
- **Public**: `/student-voice` (implemented + in-progress approved ideas, impact stats).
- **Member**: `/portal/suggestions` (browse + support + filters/search), `/portal/suggestions/new`, `/portal/suggestions/[id]` (+ `/edit`), `/portal/my-suggestions`.
- **Admin/Moderator**: `/admin/suggestions` (filterable, paginated table), `/admin/suggestions/[id]` (status, triage, feedback, history, merge — merge admin-only), `/admin/suggestions/categories` (admin-only).

## Components
SuggestionCard, SuggestionForm, SuggestionTimeline, ProgressTimeline, SuggestionStatusBadge (+ priority), SuggestionVoteButton, SuggestionFilters, SuggestionSearch, SuggestionTable, ModeratorFeedbackCard, plus staff workflow forms and a category form.

## Performance
Batched related-data fetches (categories/tags/members resolved once per list, never per row), denormalized `support_count`, indexed filters, and server-side pagination on the admin table (`range()` + exact count).

## Search & filters
URL-driven (`category`, `status`, `priority`, `tag`, `sort`, `q`, `page`) so views are shareable and server-rendered. Sorts: newest, most supported, recently updated.

## Future-ready
Status history + audit logs provide the hooks Notifications will subscribe to; `merged_into`, `assigned_to`, and `estimated_completion` support richer Analytics later. No election-style voting was introduced (support-only, no downvotes).
