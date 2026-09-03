insert into public.site_settings (key, value)
values
  ('diji_site_name', to_jsonb('dijitalmasallar.com'::text)),
  ('diji_domain', to_jsonb('dijitalmasallar.com'::text)),
  ('diji_language', to_jsonb('tr'::text)),
  ('diji_description', to_jsonb('Teknoloji, yapay zekâ, bilim ve dijital kültür yoğunluklu kısa ve güncel paylaşımlar.'::text)),
  ('home_title', to_jsonb('Kısa ve özgün teknoloji notları'::text)),
  ('home_section_label', to_jsonb('KISA KISA GÜNDEM'::text)),
  ('diji_feed_layout', to_jsonb('short'::text)),
  ('home_posts_per_page', to_jsonb(7)),
  ('newsletter_enabled', to_jsonb(true)),
  ('newsletter_title', to_jsonb('Haftalık bülten'::text)),
  ('newsletter_description', to_jsonb('Haftanın kısa teknoloji notları, tek e-postada.'::text)),
  ('show_subscriber_count', to_jsonb(true)),
  ('contact_email', to_jsonb('merhaba@dijitalmasallar.com'::text)),
  ('maintenance_mode', to_jsonb(false))
on conflict (key) do nothing;
