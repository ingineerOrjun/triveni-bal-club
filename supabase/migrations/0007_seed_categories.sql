-- =============================================================================
-- 0007 — Seed activity categories (idempotent)
-- =============================================================================
insert into public.activity_categories (slug, name, name_ne, sort_order) values
  ('leadership',  'Leadership',        'नेतृत्व',            1),
  ('environment', 'Environment',       'वातावरण',           2),
  ('arts',        'Arts & Culture',    'कला र संस्कृति',     3),
  ('sports',      'Sports',            'खेलकुद',            4),
  ('literary',    'Literary',          'साहित्यिक',          5),
  ('service',     'Community Service', 'सामुदायिक सेवा',     6),
  ('science',     'Science & Tech',    'विज्ञान र प्रविधि',   7)
on conflict (slug) do nothing;
