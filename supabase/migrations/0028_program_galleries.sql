-- =============================================================================
-- 0028 — Program photo galleries
-- Adds an ordered image-URL list to activities and events so a finished program
-- can show multiple photos (images flow through the existing Media Library).
-- Backfills to an empty array; existing RLS policies already cover these rows.
-- =============================================================================

alter table public.activities add column if not exists gallery text[] not null default '{}';
alter table public.events     add column if not exists gallery text[] not null default '{}';
