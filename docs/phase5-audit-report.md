# Phase 5 Audit Report — Activities & Event Participation

**Scope:** activities, events, registrations, attendance (DB, RLS, server actions, UI).
**Method:** multi-agent review (one auditor per dimension) + adversarial verification, then manual completion. Every finding was confirmed against the actual code before reporting.
**Build status after fixes:** ✅ `next build` green (all routes compile, type-check + lint clean).

Legend — **Status:** ✅ Applied · 📋 Recommended (needs judgement / broader change).

---

## Summary by severity

| Severity | Count | Applied | Recommended |
|----------|:--:|:--:|:--:|
| High | 1 | 1 | 0 |
| Medium | 7 | 5 | 2 |
| Low | 6 | 0 | 6 |
| Info / Good | 4 | — | — |

All LOW and MEDIUM fixes that are mechanically safe were applied automatically. The one HIGH finding (capacity race) had a safe, self-contained fix, so it was applied too. Remaining items are deferred because they need a toast/UX layer, pagination strategy, or an architectural call.

---

## 1. Database indexes

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1.1 | `activities.created_at` is the sole sort key of `listActivities()` (`order by created_at desc`, no filter) but had no index — full scan + sort as the table grows. | Medium | ✅ |
| 1.2 | `listRegistrationsForEvent()` does `eq(event_id) + order(registered_at asc)`; existing `(event_id, status)` index doesn't cover the sort. | Medium | ✅ |
| 1.3 | `attendance_member_idx` is **not** redundant — `listParticipation()` filters `member_id`. `activity_categories.sort_order` unindexed but the table is 7 static rows. | Info | — |

**Fix applied** (`0008_audit_fixes.sql`):
```sql
create index if not exists activities_created_idx on public.activities (created_at desc);
create index if not exists event_registrations_event_registered_idx on public.event_registrations (event_id, registered_at);
```

## 2. N+1 query risks

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 2.1 | No per-row N+1: related rows are batched with `.in()` (`listMemberActivities`, `listParticipation`, `registeredCounts`). Good. | Good | — |
| 2.2 | `getActivityById()` / `listActivities()` fetch **all** categories to resolve names. Negligible (7 static rows); revisit with an embedded join only if categories grow. | Low | 📋 |

## 3. Large event registration performance

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 3.1 | `registeredCounts()` loads every `registered` row into JS to count. Fine at school scale; for very large events use a grouped-count SQL view / `event_registered_count()` RPC instead of materializing rows. | Medium | 📋 |
| 3.2 | `listRegistrationsForEvent()` / `getAttendanceMap()` load the full roster with no pagination. Acceptable for typical events; add pagination beyond ~500 registrations. | Low | 📋 |

> The capacity-check trigger's `count(*)` is backed by the `(event_id, status)` index, so per-insert cost is bounded.

## 4. Transaction safety

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 4.1 | **Capacity overbooking race.** `enforce_event_registration()` counted then inserted without locking the event, so two concurrent registrations could both observe `count < capacity` and overbook. | High | ✅ |
| 4.2 | Status change + audit log aren't atomic — by design, audit is best-effort and must never block the action. | Low | 📋 |
| 4.3 | `markAttendance` bulk upsert is a single statement → already atomic. | Good | — |

**Fix applied** (`0008`): take a row lock on the event before counting, serializing concurrent registrations per event:
```sql
select * into v_event from public.events where id = new.event_id for update;
```

## 5. Audit log coverage

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 5.1 | **Complete.** All 13 mutating actions call `logAudit` — activity & event create/update/publish/archive/draft/delete, join/leave, register/cancel, attendance. | Good | — |
| 5.2 | Failed operations aren't audited (logging runs after success). Acceptable; revisit if a security audit trail of *attempts* is required. | Info | 📋 |

## 6. RLS policy gaps

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 6.1 | `reg_insert` allowed inserting a registration row for a **draft/unpublished** event — publish was enforced only by the trigger. Added a defense-in-depth `WITH CHECK` requiring the event be published. | Medium | ✅ |
| 6.2 | Member spoofing already blocked: `member_id = auth.uid()` on insert & update `WITH CHECK`; attendance is staff-write / own-or-staff-read; participants own-or-staff. Solid. | Good | — |

**Fix applied** (`0008`): `reg_insert WITH CHECK (member_id = auth.uid() AND EXISTS (published event))`.

## 7. Duplicate business logic

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 7.1 | `requireStaff()` was defined identically in both `activities/actions.ts` and `events/actions.ts`. | Medium | ✅ |
| 7.2 | `/admin/registrations` and `/admin/attendance` index pages are near-identical event pickers; `parseForm`/`toRow` and the status-change action shape repeat per entity. Small, entity-specific differences — left as-is to avoid premature abstraction. | Low | 📋 |

**Fix applied:** extracted `requireStaffUser()` → `src/lib/auth/guards.ts`; both action files import it.

## 8. Admin workflow usability

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 8.1 | Void status/delete actions show no success/error feedback (rely on revalidation). Needs a toast provider to do well. | Medium | 📋 |
| 8.2 | No pagination on admin lists; delete uses native `window.confirm` (functional, unbranded). | Low | 📋 |

## 9. Mobile usability

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 9.1 | Admin row action clusters can crowd on small screens — mitigated: `Table` wraps in `overflow-x-auto` and actions use `flex-wrap justify-end`; `AttendanceTable` scrolls horizontally. Consider a per-row overflow menu at <360px. | Low | 📋 |

## 10. Error handling consistency

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 10.1 | `registerForEvent` returned the raw `error.message`, which could leak non-trigger Postgres errors. Now whitelists the trigger's safe messages and falls back to a generic message. | Medium | ✅ |
| 10.2 | Void actions (`setActivityStatus`, `deleteActivity`, `join/leaveActivity`, `setEventStatus`) swallow errors silently. Convert to `FormState` + surface via `ActionButton`, or wrap with logging. Broader UX change. | Medium | 📋 |

**Fix applied:** `src/lib/events/errors.ts` `friendlyRegistrationError()`, used in `registerForEvent`.

---

## Changes applied in this pass

| File | Change |
|------|--------|
| `supabase/migrations/0008_audit_fixes.sql` | **New.** 2 sort-key indexes; `FOR UPDATE` lock in `enforce_event_registration` (capacity race); `reg_insert` published-event RLS check. |
| `src/lib/auth/guards.ts` | **New.** Shared `requireStaffUser()`. |
| `src/lib/events/errors.ts` | **New.** `friendlyRegistrationError()` whitelist. |
| `src/lib/activities/actions.ts` | Use shared `requireStaffUser`; drop duplicate guard. |
| `src/lib/events/actions.ts` | Use shared `requireStaffUser`; sanitize registration errors. |
| `supabase/README.md` | Document migration `0008`. |

## Recommended follow-ups (not auto-applied)

1. **Toast/feedback layer** → resolves 8.1 and 10.2 (surface void-action results).
2. **Grouped-count SQL view or RPC** for `registeredCounts` and **roster pagination** → 3.1, 3.2.
3. **Shared `EventPickerList` component** for the two admin index pages → 7.2.
4. **Audit failed attempts** if a stricter security trail is needed → 5.2.

> Apply `0008` with `supabase db push` (and regenerate `src/types/database.ts`) in any configured environment.
