-- =============================================================================
-- 0016 — Seed suggestion categories, tags, and Student-Voice badges/rules
-- Idempotent.
-- =============================================================================

insert into public.suggestion_categories (slug, name, name_ne, sort_order) values
  ('activity-ideas',     'Activity Ideas',     'गतिविधि सुझाव',    1),
  ('community-service',  'Community Service',  'सामुदायिक सेवा',    2),
  ('environment',        'Environment',        'वातावरण',          3),
  ('school-improvement', 'School Improvement', 'विद्यालय सुधार',    4),
  ('club-improvement',   'Club Improvement',   'क्लब सुधार',        5),
  ('events',             'Events',             'कार्यक्रम',         6),
  ('sports',             'Sports',             'खेलकुद',           7),
  ('technology',         'Technology',         'प्रविधि',          8),
  ('culture',            'Culture',            'संस्कृति',          9),
  ('innovation',         'Innovation',         'नवप्रवर्तन',        10),
  ('leadership',         'Leadership',         'नेतृत्व',           11),
  ('general',            'General',            'सामान्य',          12)
on conflict (slug) do nothing;

insert into public.tags (slug, name) values
  ('environment', 'Environment'),
  ('stem',        'STEM'),
  ('sports',      'Sports'),
  ('festival',    'Festival'),
  ('community',   'Community'),
  ('volunteer',   'Volunteer'),
  ('education',   'Education'),
  ('leadership',  'Leadership'),
  ('innovation',  'Innovation')
on conflict (slug) do nothing;

-- Student-Voice badges (reuse Phase-6 catalog + engine).
insert into public.badges (slug, name, description, icon, category_id, criteria) values
  ('first-suggestion',    'First Suggestion',    'Submitted your first idea to the club.',     'Lightbulb',
     (select id from public.achievement_categories where slug = 'innovation'),         'Submit 1 suggestion'),
  ('community-builder',   'Community Builder',   'Submitted 5 ideas to improve the club.',     'HeartHandshake',
     (select id from public.achievement_categories where slug = 'community-service'),  'Submit 5 suggestions'),
  ('top-contributor',     'Top Contributor',     'Submitted 10 ideas — a true changemaker.',   'Star',
     (select id from public.achievement_categories where slug = 'special-recognition'),'Submit 10 suggestions'),
  ('innovation-champion', 'Innovation Champion', 'An idea you submitted was implemented!',      'Rocket',
     (select id from public.achievement_categories where slug = 'innovation'),         'Have a suggestion implemented'),
  ('helpful-contributor', 'Helpful Contributor', 'Supported 10 ideas from fellow members.',     'ThumbsUp',
     (select id from public.achievement_categories where slug = 'participation'),      'Support 10 suggestions')
on conflict (slug) do nothing;

insert into public.badge_rules (badge_id, metric, threshold)
select b.id, v.metric, v.threshold
from (values
  ('first-suggestion',    'suggestions_submitted',   1),
  ('community-builder',   'suggestions_submitted',   5),
  ('top-contributor',     'suggestions_submitted',   10),
  ('innovation-champion', 'suggestions_implemented', 1),
  ('helpful-contributor', 'suggestions_supported',   10)
) as v(slug, metric, threshold)
join public.badges b on b.slug = v.slug
where not exists (
  select 1 from public.badge_rules br where br.badge_id = b.id and br.metric = v.metric
);
