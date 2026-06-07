-- =============================================================================
-- 0012 — Seed achievement categories, badges, and automatic badge rules
-- Idempotent (on-conflict-do-nothing on slugs).
-- =============================================================================

insert into public.achievement_categories (slug, name, name_ne, sort_order) values
  ('leadership',          'Leadership',          'नेतृत्व',              1),
  ('participation',       'Participation',       'सहभागिता',            2),
  ('volunteer-service',   'Volunteer Service',   'स्वयंसेवा',            3),
  ('community-service',   'Community Service',   'सामुदायिक सेवा',       4),
  ('academic-excellence', 'Academic Excellence', 'शैक्षिक उत्कृष्टता',    5),
  ('sports-excellence',   'Sports Excellence',   'खेलकुद उत्कृष्टता',     6),
  ('cultural-excellence', 'Cultural Excellence', 'सांस्कृतिक उत्कृष्टता', 7),
  ('creative-arts',       'Creative Arts',       'सिर्जनात्मक कला',       8),
  ('innovation',          'Innovation',          'नवप्रवर्तन',           9),
  ('special-recognition', 'Special Recognition', 'विशेष सम्मान',         10)
on conflict (slug) do nothing;

-- Badges (icon = lucide name). Category linked by slug lookup.
insert into public.badges (slug, name, description, icon, category_id, criteria) values
  ('first-event',       'First Event',       'Attended your first club event.',          'PartyPopper',
     (select id from public.achievement_categories where slug = 'participation'),     'Attend 1 event'),
  ('team-player',       'Team Player',       'Attended 5 or more events.',               'Users',
     (select id from public.achievement_categories where slug = 'participation'),     'Attend 5 events'),
  ('outstanding-member','Outstanding Member','Attended 10 or more events.',              'Star',
     (select id from public.achievement_categories where slug = 'special-recognition'),'Attend 10 events'),
  ('volunteer',         'Volunteer',         'Joined a club activity as a volunteer.',   'HandHeart',
     (select id from public.achievement_categories where slug = 'volunteer-service'),  'Join 1 activity'),
  ('community-helper',  'Community Helper',  'Joined 5 or more activities.',             'HeartHandshake',
     (select id from public.achievement_categories where slug = 'community-service'),  'Join 5 activities'),
  ('leader',            'Leader',            'Recognised for leadership in the club.',   'Crown',
     (select id from public.achievement_categories where slug = 'leadership'),         'Awarded by admins'),
  ('debater',           'Debater',           'Excelled in debate & public speaking.',    'MessageSquare',
     (select id from public.achievement_categories where slug = 'cultural-excellence'),'Awarded by admins'),
  ('organizer',         'Organizer',         'Helped organise a club event.',            'ClipboardList',
     (select id from public.achievement_categories where slug = 'leadership'),         'Awarded by admins')
on conflict (slug) do nothing;

-- Automatic award rules (data-driven). Manual badges (leader/debater/organizer)
-- intentionally have no rule.
insert into public.badge_rules (badge_id, metric, threshold)
select b.id, v.metric, v.threshold
from (values
  ('first-event',       'events_attended',   1),
  ('team-player',       'events_attended',   5),
  ('outstanding-member','events_attended',   10),
  ('volunteer',         'activities_joined', 1),
  ('community-helper',  'activities_joined', 5)
) as v(slug, metric, threshold)
join public.badges b on b.slug = v.slug
where not exists (
  select 1 from public.badge_rules br where br.badge_id = b.id and br.metric = v.metric
);
