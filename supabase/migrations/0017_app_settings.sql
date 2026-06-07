-- =============================================================================
-- 0017 — App settings store (admin-managed CMS configuration)
-- A simple key → jsonb store so non-technical admins can manage club info,
-- contact details, social links, SEO defaults, homepage content, and feature
-- toggles without code changes.
-- =============================================================================

create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  is_public  boolean not null default false,  -- readable by anon (e.g. footer)
  updated_by uuid references public.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on table public.app_settings is 'Admin-editable site configuration (CMS).';

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS: public keys readable by anyone; everything readable by staff;
-- only admins may write.
-- ----------------------------------------------------------------------------
alter table public.app_settings enable row level security;

drop policy if exists settings_read on public.app_settings;
create policy settings_read on public.app_settings
  for select to anon, authenticated
  using (is_public or public.is_staff());

drop policy if exists settings_write on public.app_settings;
create policy settings_write on public.app_settings
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Seed default setting groups (idempotent).
-- ----------------------------------------------------------------------------
insert into public.app_settings (key, value, is_public) values
  ('general', jsonb_build_object(
      'clubName', 'Triveni Child Club',
      'schoolName', 'Triveni Barah Nanda Prasad Tripathee School',
      'academicYear', '2025–2026',
      'timezone', 'Asia/Kathmandu',
      'language', 'en'
    ), true),
  ('contact', jsonb_build_object(
      'email', 'club@triveni.edu.np',
      'phone', '+977 00-000000',
      'address', 'Triveni Barah Nanda Prasad Tripathee School, Nepal',
      'officeHours', 'Sunday – Friday, 10:00 AM – 4:00 PM'
    ), true),
  ('social', jsonb_build_object(
      'facebook', '', 'instagram', '', 'youtube', ''
    ), true),
  ('homepage', jsonb_build_object(
      'heroTitle', 'Where students lead, grow, and shine.',
      'heroSubtitle', 'The official portal of the Triveni Child Club.',
      'heroCtaLabel', 'Discover the Club',
      'heroCtaHref', '/about'
    ), true),
  ('seo', jsonb_build_object(
      'defaultTitle', 'Triveni Child Club',
      'defaultDescription', 'Student-led activities, elections, achievements, and voice.',
      'ogImage', '/gallery/triveni-05.jpeg'
    ), true),
  ('features', jsonb_build_object(
      'studentVoice', true,
      'recognition', true,
      'maintenanceMode', false
    ), true)
on conflict (key) do nothing;
