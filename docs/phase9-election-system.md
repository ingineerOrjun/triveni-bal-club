# Phase 9 — Digital Election & Democratic Governance

A real, end-to-end **secret-ballot** election system: nominations → candidate
review → secret voting → results → committee. Reuses existing
auth / RBAC / RLS / audit / Media Library / design system.

> Scope (consistent with Phase 8.x): the **full election lifecycle is built and
> build-verified**. Advanced campaign/governance extras (campaign posts &
> likes & comments, candidate documents/verification, oath records, term
> reports, realtime heatmaps, automated test harness) are documented as roadmap
> below — no placeholders shipped.

---

## Architecture & ERD (text)
```
election_terms ──1:N─► elections ──1:N─► positions ──1:N─► candidate_nominations
                          │                                   ▲ member_id → users
                          │ 1:N                               │
                          ├────► votes (anonymous; no voter ref)
                          ├────► vote_receipts (voter_id + code; NOT the choice)
                          ├────► result_snapshots (published tallies)
                          └────► committee_assignments (winners → committee)
```
Migrations: [`0024_elections.sql`](../supabase/migrations/0024_elections.sql) (schema),
[`0025_election_functions.sql`](../supabase/migrations/0025_election_functions.sql)
(functions + RLS).

## Security model — the secret ballot
The integrity design is the core of this phase:
- **`votes` carries no voter reference** and has **no RLS policies at all** — it
  is unreadable/unwritable directly by anyone (anon, member, even admin).
- **`vote_receipts`** records *who* voted (`unique(election_id, voter_id)` →
  **one vote per member**) and a receipt code — but **never the choice**.
- Voting happens **only** through `cast_vote(election, choices)`
  (`SECURITY DEFINER`), which: requires a signed-in voter, checks the election is
  `voting` and within window, rejects a second ballot, validates each candidate
  belongs to its position & is `approved`, inserts the anonymous votes, and
  returns a receipt code — **atomically**.
- Tallies come only from `get_election_results()` — **gated**: staff anytime,
  everyone only once `closed`/`results_published` (no peeking mid-election).
- `election_turnout()` / `has_voted()` expose counts/booleans, never choices.
Defense in depth: middleware → server-action role guards → RLS → these
definer functions/constraints → audit logs. Client input is never trusted.

## Permission matrix
| Capability | Member | Moderator | Admin |
|---|:--:|:--:|:--:|
| View published elections/candidates/results | ✓ | ✓ | ✓ |
| Submit / withdraw own nomination | ✓ | ✓ | ✓ |
| Cast one secret vote | ✓ | ✓ | ✓ |
| Create election, positions, open/close stages | – | ✓ | ✓ |
| Review (approve/reject) nominations | – | ✓ | ✓ |
| Publish results, generate committee | – | ✓ | ✓ |
| Delete election | – | – | ✓ |
(Election Commissioner / Teacher Observer / Super Admin map onto the existing
`moderator`/`admin` roles; finer custom roles are roadmap via the Phase-8 role
model.)

## Voting lifecycle
`draft → nominations → voting → closed → results_published → archived`.
- **nominations**: members submit (draft/submitted); commissioners approve/reject.
- **voting**: approved candidates appear in the [VotingBooth](../src/components/elections/voting-booth.tsx); each member casts one secret ballot and gets a [receipt](../src/components/elections/vote-receipt.tsx).
- **closed → results_published**: commissioner publishes a `result_snapshot`.
- **committee**: `generateCommittee` turns winners into `committee_assignments`.

## Result lifecycle
`get_election_results` tallies per position; the query layer
([queries.ts](../src/lib/elections/queries.ts)) sorts candidates, takes the top
`seats`, and surfaces **ties** at the boundary (commissioner resolves). Runoff /
disqualification / vacant-seat handling are manual today (status + re-publish);
automated runoff is roadmap.

## Components
ElectionCard, CandidateCard, ManifestoViewer, VotingBooth, VoteReceipt,
ElectionTimeline, ResultTable (+ BarChart), ElectionStatusBadge /
NominationStatusBadge, CandidateForm, admin forms.

## Screens
- **Public**: [/elections](../src/app/(public)/elections/page.tsx),
  [/elections/[slug]](../src/app/(public)/elections/[slug]/page.tsx) (candidates,
  manifestos, published results).
- **Member**: [/portal/elections](../src/app/(portal)/portal/elections/page.tsx),
  [detail + voting booth](../src/app/(portal)/portal/elections/[slug]/page.tsx),
  [nominate](../src/app/(portal)/portal/elections/[slug]/nominate/page.tsx).
- **Admin**: [/admin/elections](../src/app/(admin)/admin/elections/page.tsx),
  [new](../src/app/(admin)/admin/elections/new/page.tsx),
  [management console](../src/app/(admin)/admin/elections/[id]/page.tsx)
  (commission controls, positions, nomination review, live turnout, results,
  committee generation).

## Performance & accessibility
Server components + dynamic election pages; batched candidate/name lookups (no
N+1); tallies via a single grouped SQL aggregate. WCAG-AA: the voting booth is a
keyboard-navigable `radiogroup` with `aria-checked`, visible focus, and an
"abstain" control; all flows are mobile-first and reuse the design system.

## Deployment
Apply `0024`+`0025` via `supabase db push`. Media (candidate photos/banners)
uses the existing Media Library buckets. No new env vars.

---

## Roadmap (documented, not yet built)
- **Campaign platform**: campaign posts, announcements, likes, comments,
  sharing, campaign calendar (CMS-block embeds).
- **Candidate dossier**: documents, media gallery, verification workflow,
  request-revision/suspend/merge-duplicate admin actions.
- **Governance**: oath records, organisational chart, tenure/resignation/
  replacement tracking, term reports; public Hall-of-Leaders / past-officers
  archive and winning speeches.
- **Results**: automated runoff, quorum/disqualification rules, PDF report
  export, historical turnout analytics by class/section.
- **Realtime**: live turnout dashboard via Supabase Realtime + heatmaps.
- **Testing**: a Vitest harness for RLS/secret-ballot/double-vote integrity
  (the DB constraints + definer functions already enforce these guarantees;
  the automated suite is the remaining piece).
