insert into public.site_settings (key,value) values
  ('module_posts','true'::jsonb),
  ('module_newsletter','true'::jsonb),
  ('module_ads','true'::jsonb),
  ('module_analytics','true'::jsonb)
on conflict (key) do nothing;
