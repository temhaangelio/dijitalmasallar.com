-- Web push subscriptions, and the panel switch that turns notifications on and off.
--
-- Additive: one new table, one new index and one new `site_settings` row. Nothing existing is
-- touched, so rolling back means dropping what this file creates (see the block at the end).
--
-- The endpoint is the primary key because that is what the browser gives out and what identifies a
-- subscription everywhere else: re-subscribing the same browser upserts its own row instead of
-- leaving a duplicate behind, and a push that comes back 404/410 is deleted by endpoint.
--
-- RLS is enabled with no policies at all, on purpose. Every read and write goes through the
-- service-role client in `src/services/push.ts`, which bypasses RLS; the anon key therefore cannot
-- read the subscription list, which is a list of the site's readers.

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  language text not null default 'tr',
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint push_subscriptions_language_check check (language in ('tr', 'en'))
);

alter table public.push_subscriptions enable row level security;

-- Notifications go out per language, so that is the column the send query filters on.
create index if not exists push_subscriptions_language_idx
  on public.push_subscriptions (language);

insert into public.site_settings (key, value) values ('module_push', 'true'::jsonb)
on conflict (key) do nothing;

-- Rollback
-- ---------
-- drop index if exists public.push_subscriptions_language_idx;
-- drop table if exists public.push_subscriptions;
-- delete from public.site_settings where key = 'module_push';
