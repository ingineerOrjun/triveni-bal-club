# Phase 8.1 — Media Library (DAM) & Gallery CMS

The centralized digital-asset foundation. Every module consumes this library
via the **Media Picker** rather than implementing its own upload field.
Extends existing auth/RBAC/RLS/audit/design-system — nothing rewritten.

> Scope note (consistent with Phase 8): this delivers the **production-quality
> DAM core** — schema, storage, security, upload pipeline, library UI, reusable
> picker, usage tracking, gallery CMS, analytics. Heavy extras (in-browser image
> editor, AVIF/variant generation, ZIP/resume import, version-compare UI,
> masonry virtualization) are documented as roadmap below.

---

## 1. Media architecture
```
Browser (RLS-bound client)
  │  1. compute SHA-256 checksum + read image dimensions
  │  2. upload bytes directly to Supabase Storage  (staff-only via storage RLS)
  ▼
recordUpload() server action
  │  validate mime/size · checksum de-dup (cleans up dup object)
  │  insert media_files (public_url + transform thumbnail_url) · audit
  ▼
media_files (RLS) ── single source of truth
  ▲
  │ registerUsage(fileId, {module, entityType, entityId, field})
consuming modules (gallery, badges, settings, …) — never upload directly
```

Tables (migrations `0018`–`0021`): `media_folders`, `media_files`, `media_tags`,
`media_file_tags`, `media_usage`, `media_versions`, `media_favorites`,
`media_collections`, `media_collection_items`, `gallery_albums`,
`gallery_photos`. Indexes on folder/status/visibility/mime/created/uploader;
`updated_at` triggers; checksum unique index for de-duplication.

## 2. Storage architecture
Buckets (created in `0019`): **public** (`media-public`, `gallery`, `avatars`) →
CDN-friendly URLs; **private** (`media-private`, `certificates`, `documents`) →
signed URLs. Storage `objects` policies: public buckets world-readable, private
buckets staff-readable, **staff** insert/update, **admin** delete. Helpers in
[`storage.ts`](../src/lib/media/storage.ts): `buildPublicUrl`, `buildThumbUrl`
(Supabase on-the-fly render endpoint), MIME/size allow-lists, `humanSize`.

## 3. Image pipeline
- **Dimensions** read in-browser before upload; **checksum** (SHA-256) computed
  client-side and enforced server-side for duplicate prevention.
- **Thumbnails / responsive sizes** are produced on demand by Supabase's image
  **render/transform** endpoint (`buildThumbUrl`) — no variant files to store or
  keep in sync. `<img loading="lazy">` everywhere.
- `width`, `height`, `size`, `mime_type`, `extension` stored. `blur_hash` and
  `dominant_color` columns exist (nullable) — population is roadmap (needs a
  server image lib such as sharp/plaiceholder).

## 4. Security layer
MIME + extension + size validation (client and server); only safe image/PDF
types allowed (no executables); path built from a server UUID (no traversal);
private assets via signed URLs; **audit** on upload/metadata/archive/delete;
RLS is the enforcement floor (members have no access). A `virusScanHook` slot is
documented for future integration in `recordUpload`.

## 5. Media Library UI ([/admin/media](../src/app/(admin)/admin/media/page.tsx))
Analytics strip (total assets, storage used, unused, recent), drag-&-drop
[uploader](../src/components/media/media-uploader.tsx) (multi-file, progress,
duplicate/error states), search, kind + folder filters, paginated selectable
[grid](../src/components/media/media-grid.tsx) with a sticky **bulk-archive**
bar. [File detail](../src/app/(admin)/admin/media/[id]/page.tsx): preview,
metadata form (alt/caption/description/folder), **usage list**, copy/open public
URL, archive/restore, admin delete (blocked by the `media_in_use` trigger).

## 6. Media Picker guide ([media-picker.tsx](../src/components/media/media-picker.tsx))
A reusable modal: search the library or upload inline, then select. Consume it
two ways:
- **`<MediaField name="…" label="…" defaultValue={url} />`** — a drop-in form
  field that stores the chosen public URL in a hidden input. *Already wired into
  the badge form's image.*
- **`<MediaPicker open onOpenChange onSelect={(file) => …} />`** — direct control
  (used by the gallery album editor for cover + photos).

To adopt in any module: replace the upload/URL input with `<MediaField>`, and on
save call `registerUsage(fileId, {...})` so the asset shows usage and is
delete-protected.

## 7. Usage tracking
`media_usage` records every reference (`module`, `entity_type`, `entity_id`,
`field`, `label`). `registerUsage`/`unregisterUsage` ([actions](../src/lib/media/actions.ts))
are called by consumers (the Gallery CMS does this for covers & photos). The
`prevent_media_delete_in_use` trigger blocks hard-deletion of referenced files;
the detail page shows the usage list and count.

## 8. Gallery CMS
[Admin](../src/app/(admin)/admin/gallery/page.tsx): albums with draft/published/
archived workflow, cover + photo management via the Media Picker
([album editor](../src/components/gallery/album-editor.tsx)), SEO description,
featured flag, delete (admin). [Public](../src/app/(public)/gallery/page.tsx):
published albums surface on `/gallery`, each with an SEO-friendly
[`/gallery/[slug]`](../src/app/(public)/gallery/[slug]/page.tsx) page; the
existing static "recent moments" grid (with lightbox) remains.

## 9. Folder, tag, collection & favorite guide
Folders are nested with a materialized `path` for breadcrumbs (admin-managed).
Tags: `addTagToFile` creates-or-attaches; file-tag table powers tag search/filter
(public-readable for gallery). Favorites are per-staff-user. Collections group
files for reuse (admin-managed). Data + actions are complete; richer management
UIs (drag-move, color labels, merge tags, collection editor) are roadmap.

## 10. Permissions
Members: **no access**. Moderators: view / upload / edit metadata / archive.
Admins: full control (delete, folders, tags, collections, visibility). Enforced
in storage RLS, table RLS, and `requireStaffUser`/`requireAdminUser` guards.

## Developer guide
1. Never add a raw upload field. Use `<MediaField>` (URL value) or `<MediaPicker>`.
2. After persisting an entity that references a file, `registerUsage(...)`; on
   removal, `unregisterUsage(...)`.
3. New buckets → add to `0019` + `storage.ts` + RLS arrays.
4. Reads: filter/paginate server-side; thumbnails via `buildThumbUrl`; never N+1
   (batch with `.in()` as in [`gallery/queries.ts`](../src/lib/gallery/queries.ts)).

## Administrator guide
Open **Media** to upload (drag-and-drop), search, filter, and organise assets;
click a file to edit alt text/caption, see where it's used, archive, or delete.
Open **Gallery** to create albums, set a cover and add photos from the library,
then **Publish** so they appear on the public site. Files in use can't be deleted
— remove them from albums/modules first.

---

## Roadmap (documented, not yet built)
- **In-browser image editor** (crop/rotate/flip/resize/filters → save as new
  version) and **versioning UI** (compare/restore) — `media_versions` table is
  ready.
- **AVIF/WebP variant generation, blur-hash & dominant-color** at upload (server
  image lib).
- **ZIP/folder import** with resume, conflict resolution, import history; **ZIP
  export / usage report**.
- **Masonry + virtualized** grids and **infinite scroll**; **fullscreen lightbox
  with keyboard/touch** on public albums.
- **Tag merge/rename UI, collections editor, favorites quick-access**, and
  **drag-and-drop folder move**.
- **Most-downloaded / storage-growth / upload-trend** analytics (needs download
  logging + time-series).
