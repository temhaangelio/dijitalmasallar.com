-- Run after creating at least one user through Supabase Auth.
-- Promote the first trusted account manually in the SQL editor:
-- update public.diji_profiles set role = 'admin' where id = '<trusted-user-uuid>';

insert into public.diji_site_settings (id, site_name, domain, description, language, feed_layout)
values (true, 'Mürekkep', 'murekkep.co', 'Teknoloji, tasarım ve dijital kültür üzerine kısa ve özgün notlar.', 'tr', 'short')
on conflict (id) do nothing;
