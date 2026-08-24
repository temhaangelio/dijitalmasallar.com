-- The RSS reader's own data lives in a local SQLite file, never in Supabase. Only the panel toggle
-- belongs here, alongside the other module switches.
insert into public.site_settings (key, value) values ('module_rss', 'true'::jsonb)
on conflict (key) do nothing;
