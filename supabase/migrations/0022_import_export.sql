-- =============================================================================
-- 0022 — Import / Export engine
-- Tables: import_jobs, import_rows, import_templates, export_jobs,
--         export_templates, import_logs, export_logs, column_mappings,
--         validation_errors
-- Admin-only (is_admin) throughout.
-- =============================================================================

do $$ begin
  create type public.io_status as enum (
    'queued', 'validating', 'ready', 'processing', 'completed', 'failed', 'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.import_mode as enum (
    'insert', 'upsert', 'update', 'ignore_duplicates', 'dry_run'
  );
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- import_templates (saved column mappings)
-- ----------------------------------------------------------------------------
create table if not exists public.import_templates (
  id          uuid primary key default gen_random_uuid(),
  module      text not null,
  name        text not null,
  mapping     jsonb not null default '{}'::jsonb,
  is_default  boolean not null default false,
  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);
create index if not exists import_templates_module_idx on public.import_templates (module);

-- ----------------------------------------------------------------------------
-- import_jobs
-- ----------------------------------------------------------------------------
create table if not exists public.import_jobs (
  id                 uuid primary key default gen_random_uuid(),
  module             text not null,
  status             public.io_status not null default 'queued',
  mode               public.import_mode not null default 'insert',
  file_name          text,
  total_rows         int not null default 0,
  valid_rows         int not null default 0,
  error_rows         int not null default 0,
  imported_rows      int not null default 0,
  skipped_rows       int not null default 0,
  template_id        uuid references public.import_templates (id) on delete set null,
  error_summary      text,
  rollback_available boolean not null default false,
  created_by         uuid references public.users (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz,
  finished_at        timestamptz
);
create index if not exists import_jobs_module_idx  on public.import_jobs (module, created_at desc);
create index if not exists import_jobs_status_idx  on public.import_jobs (status);
create index if not exists import_jobs_creator_idx on public.import_jobs (created_by);

-- ----------------------------------------------------------------------------
-- import_rows (stored selectively — invalid rows + a capped sample)
-- ----------------------------------------------------------------------------
create table if not exists public.import_rows (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references public.import_jobs (id) on delete cascade,
  row_number int not null,
  data       jsonb not null default '{}'::jsonb,
  status     text not null default 'valid',
  created_at timestamptz not null default now()
);
create index if not exists import_rows_job_idx on public.import_rows (job_id, row_number);

-- ----------------------------------------------------------------------------
-- validation_errors
-- ----------------------------------------------------------------------------
create table if not exists public.validation_errors (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references public.import_jobs (id) on delete cascade,
  row_number int not null,
  field      text,
  value      text,
  rule       text,
  message    text not null,
  suggestion text,
  created_at timestamptz not null default now()
);
create index if not exists validation_errors_job_idx on public.validation_errors (job_id, row_number);

-- ----------------------------------------------------------------------------
-- column_mappings (normalized mapping rows — optional companion to templates)
-- ----------------------------------------------------------------------------
create table if not exists public.column_mappings (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.import_templates (id) on delete cascade,
  source      text not null,
  target      text not null
);
create index if not exists column_mappings_template_idx on public.column_mappings (template_id);

-- ----------------------------------------------------------------------------
-- export_templates / export_jobs
-- ----------------------------------------------------------------------------
create table if not exists public.export_templates (
  id          uuid primary key default gen_random_uuid(),
  module      text not null,
  name        text not null,
  filters     jsonb not null default '{}'::jsonb,
  format      text not null default 'csv',
  is_default  boolean not null default false,
  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create table if not exists public.export_jobs (
  id             uuid primary key default gen_random_uuid(),
  module         text not null,
  status         public.io_status not null default 'completed',
  format         text not null default 'csv',
  filters        jsonb not null default '{}'::jsonb,
  row_count      int not null default 0,
  download_count int not null default 0,
  created_by     uuid references public.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  finished_at    timestamptz
);
create index if not exists export_jobs_module_idx on public.export_jobs (module, created_at desc);

-- ----------------------------------------------------------------------------
-- logs
-- ----------------------------------------------------------------------------
create table if not exists public.import_logs (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references public.import_jobs (id) on delete cascade,
  level      text not null default 'info',
  message    text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.export_logs (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references public.export_jobs (id) on delete cascade,
  level      text not null default 'info',
  message    text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
drop trigger if exists set_import_jobs_updated_at on public.import_jobs;
create trigger set_import_jobs_updated_at before update on public.import_jobs
  for each row execute function public.set_updated_at();
drop trigger if exists set_import_templates_updated_at on public.import_templates;
create trigger set_import_templates_updated_at before update on public.import_templates
  for each row execute function public.set_updated_at();
drop trigger if exists set_export_templates_updated_at on public.export_templates;
create trigger set_export_templates_updated_at before update on public.export_templates
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS — admin only
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'import_jobs','import_rows','import_templates','export_jobs','export_templates',
    'import_logs','export_logs','column_mappings','validation_errors'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists io_admin_all on public.%I', t);
    execute format(
      'create policy io_admin_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t
    );
  end loop;
end $$;
