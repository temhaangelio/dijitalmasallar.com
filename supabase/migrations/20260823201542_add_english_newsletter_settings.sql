insert into public.site_settings (key, value) values
  ('newsletter_title_en', to_jsonb('Weekly newsletter'::text)),
  ('newsletter_description_en', to_jsonb('The week’s concise technology notes in one email.'::text))
on conflict (key) do nothing;
