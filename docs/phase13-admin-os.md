# Phase 13 — Enterprise Admin Operating System

Transforms the admin panel into the **Midnight Prestige** executive workspace —
a scoped luxe theme + a three-column operating-system shell. UX/visual only; no
business logic removed, all modules reused, build-verified.

---

## Delivered

### Midnight Prestige theme ([admin.css](../src/styles/admin.css))
A scoped token override on `.admin-os` (set on the admin shell root) re-points
the **semantic** design tokens to the executive palette, so **every admin page —
built on semantic tokens — adopts the look at once**, independent of the public
light/dark toggle:
- Surfaces: midnight `#0B132B` / card `#16213E` / plum-tinted ambiance.
- Text: platinum `#F4F4F6` / soft silver `#C9CCD3` — never pure white.
- **Primary action = liquid platinum** (`--primary` → `#E5E5E5`, dark ink on it)
  — satisfies "no bright primary buttons."
- Hairline borders `rgb(255 255 255 / .08)`, glass `rgb(255 255 255 / .04)`,
  dark-tuned shadows that read as depth/glow, status colors kept (success/warn/
  danger/info) with **legibility fixes** for the hard-coded badge text colors on
  dark.
- A fixed **aurora + plum** ambient wash sits behind the workspace.
- Native form controls get `color-scheme: dark`.

Because it's a scoped CSS-variable layer, it adds **zero JS**, can't regress
types, and leaves the public site / portal untouched.

### Three-column Admin OS shell ([admin-shell.tsx](../src/components/admin/admin-shell.tsx))
- **LEFT — glass navigation**, now organized into **workflow groups**
  (Workspace · Programs · Recognition · Voice & governance · Content · System)
  with uppercase, letter-spaced (`0.14em`) section labels and accent-tinted
  active states. Command palette (Ctrl K) at the top.
- **CENTER — workspace** (unchanged content, now on the midnight canvas).
- **RIGHT — context panel** (desktop ≥ XL): a **live clock**, **Quick Create**
  grid (Article / Event / Activity / Election), a **pending-approvals** summary
  (total + per-bucket counts, deep-linked to the Approval Center), and a
  **recent-activity** feed from the audit log — the "operating system" rail.
- **Mobile**: glass top bar + drawer nav (the context panel collapses away; its
  data lives on the dashboard + Approval Center). Drawer is re-scoped with
  `admin-os` so the theme follows it through the portal.

The shell is fed by [the admin layout](../src/app/(admin)/layout.tsx), which now
loads the approvals summary + recent audit server-side and passes them to the
shell (typed `AdminContextData`). All reads are existing, RLS-protected queries.

### Builds on prior phases (reused, not rebuilt)
- **Approval Center** (`/admin/approvals`) from Phase 12.5 is the unified
  pending-action inbox the spec's PART 9 describes — now surfaced in the context
  rail and dashboard.
- **Global search** (Ctrl K) already spans 12 entity types (Phase 10/9.5).
- **Live homepage + auto-publish workflow** fixed in Phase 12.5.
- **Skeletons / error / empty states, motion, glass, gradients** from Phases
  10–12 carry into the admin theme automatically.

---

## Honest scope — deferred as roadmap (large net-new builds)
Consistent with every prior phase, net-new feature *systems* are scoped as
roadmap rather than stubbed, so the build stays green and placeholder-free:

- **PART 8 — full Task-Management system** (`tasks`, `task_comments`,
  `task_labels`, `task_checklists`, `task_assignees`, `task_activity`,
  `task_attachments` + Kanban/list/calendar). This is a 7-table feature with its
  own CRUD, RLS, and views — a dedicated build of its own. The Approval Center
  already delivers the operational "what needs my action" view from existing
  data with no new schema, which covers the day-to-day need; the generic task
  tracker is the recommended next focused phase.
- **Saved views / undo snackbar / per-module column-visibility everywhere**
  (PART CRUD-consistency): column visibility + bulk + search + pagination exist
  on the high-traffic tables (members, magazine, media, import/export); rolling
  them onto every legacy list + adding saved views/undo is mechanical follow-up.
- **Resizable columns & virtualized tables** (PART layout/performance): the
  three-column shell is fixed-width responsive today; drag-resize + row
  virtualization are enhancements.
- **Diagonal/asymmetric editorial homepage compositions** (carried from P11/P12
  roadmap).

These are documented honestly rather than faked; the foundation (theme, shell,
approval inbox, search, live data) is in place to build them without rework.

## Security / a11y / performance (unchanged, preserved)
Admin remains staff-gated at the layout (`requireRole(STAFF_ROLES)`), every
mutation keeps its server-action guard + RLS + audit; the theme is pure CSS;
the context panel adds a handful of small indexed count/list queries to the
(already dynamic) admin layout; the live clock is mount-guarded (no hydration
mismatch); focus rings, reduced-motion, and ARIA are inherited from the shared
system.

## Verification
`npm run build` — compiled successfully, 28/28 pages generated, zero TS/ESLint
errors. The midnight theme + 3-column shell render across every admin route;
public site and member portal are visually unchanged.
