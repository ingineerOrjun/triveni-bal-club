# 03 — Feature Module Breakdown

Each module lists its **purpose**, **primary actors**, **key screens**, **data**, and **core operations**. Modules map 1:1 to folders in `features/`.

---

## A. PUBLIC WEBSITE

### 1. Home
- **Actors:** Public
- **Screens:** Landing with hero (mission), featured activities, upcoming events, latest achievements, magazine teaser, CTA to join/login.
- **Data:** `activities` (featured), `events` (upcoming), `achievements` (recent), `magazine_issues` (latest).
- **Ops:** Read-only, ISR-cached, revalidated when admins publish content.

### 2. About
- **Actors:** Public
- **Content:** Club story, mission/vision, school info, history — bilingual static + CMS-light fields.

### 3. Committee
- **Actors:** Public
- **Screens:** Current committee grid (photo, name, role, tenure), past committees archive.
- **Data:** `committee_members` joined to `users`/`student_profiles`.

### 4. Activities (public view)
- **Screens:** Grid/list with filters (category, term), detail page with gallery + participants count.
- **Data:** `activities` where `status = 'published'`.

### 5. Events (public view)
- **Screens:** Calendar + upcoming/past lists, detail with date/location/registration CTA.
- **Data:** `events`; public registration optional (else login-gated).

### 6. Gallery
- **Screens:** Album grid → lightbox. Filter by activity/event/year.
- **Data:** `gallery_items` (+ Supabase Storage public URLs).

### 7. Achievements
- **Screens:** Timeline / cards (student, club, competition awards) with badges.
- **Data:** `achievements`.

### 8. Contact
- **Screens:** School address, map, contact form (→ creates a record / sends email).
- **Data:** lightweight `contact_messages` (optional) or email only.

---

## B. STUDENT PORTAL (auth: student)

### 9. Dashboard
- **Screens:** Personalized: my upcoming events, open elections (vote CTA), my activity status, submission statuses, announcements, notifications.
- **Data:** aggregates across `events`, `elections`, `activities`, `articles`, `suggestions`, `notifications`.

### 10. Profile
- **Screens:** View/edit personal info, class/section, avatar upload, bio, interests.
- **Data:** `users` + `student_profiles`. Avatar → `avatars` bucket.

### 11. Activities (participate)
- **Screens:** Browse open activities, join/leave, view my participation history.
- **Data:** `activities`, `activity_participants` (join table).

### 12. Voting
- **Screens:** List of open elections → ballot (candidates with manifesto) → confirm → receipt. Results when election closed.
- **Data:** `elections`, `candidates`, `votes`. One vote per student per election (DB-enforced). Secret ballot (vote stores voter for integrity but results never expose who voted for whom).

### 13. Suggestions (Student Voice)
- **Screens:** Submit suggestion (category, body, optional anonymous), view own submissions + status/response.
- **Data:** `suggestions`.

### 14. Magazine (submit)
- **Screens:** Submit article (title, body, optional cover image), track moderation status, view published work.
- **Data:** `articles`, `magazine_issues`. Images → `magazine` bucket.

---

## C. ADMINISTRATION (auth: teacher / admin)

> Teacher = moderation + content for activities/events/magazine/suggestions.
> Admin = everything, plus members, elections, announcements, committee.

### 15. Members (admin)
- **Ops:** Invite/create users, assign roles, manage student profiles, deactivate accounts.
- **Data:** `users`, `student_profiles`. Uses service-role client for admin auth ops.

### 16. Activities (teacher/admin)
- **Ops:** CRUD activities, set categories/terms, feature on home, manage participants, publish/unpublish.

### 17. Events (teacher/admin)
- **Ops:** CRUD events, manage registrations, mark attendance, link gallery.
- **Data:** `events`, `event_registrations`.

### 18. Elections (admin)
- **Ops:** Create election, define positions, add/approve candidates, open/close voting window, publish results.
- **Data:** `elections`, `candidates`, `votes` (read aggregate only).

### 19. Magazine (teacher/admin)
- **Ops:** Create issues, review/approve/reject article submissions, assign articles to issues, publish issue.
- **Data:** `magazine_issues`, `articles`.

### 20. Announcements (admin)
- **Ops:** CRUD announcements, target audience (public/students/all), schedule publish, pin.
- **Data:** `announcements`; publishing fans out `notifications`.

### 21. Media (teacher/admin)
- **Ops:** Upload/manage gallery items & albums, organize by activity/event, set alt text, delete.
- **Data:** `gallery_items` + Storage buckets.

### 22. Suggestions moderation (teacher/admin)
- **Ops:** Triage queue, respond, change status (new → reviewing → addressed → archived).
- **Data:** `suggestions`.

---

## Cross-cutting modules

### Notifications
- In-app notification center + unread badge. Created by triggers/actions (new announcement, election opened, submission status change). Realtime updates via Supabase Realtime.
- **Data:** `notifications`.

### Audit Logs
- Every privileged write (role change, election open/close, content publish, vote integrity events) appends to `audit_logs`. Admin-only read.

### Search (Phase 2+)
- Postgres full-text search across activities, events, articles, achievements.
