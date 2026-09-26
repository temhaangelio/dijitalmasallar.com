-- When a note's push notification last went out, so the admin list can show which notes readers were
-- told about. Null means no notification has been sent for the note. Written only by the service-role
-- client in src/app/(dashboard)/yazilar/actions.ts; nothing public reads it.
alter table public.posts add column notified_at timestamptz;

-- Rollback: alter table public.posts drop column notified_at;
