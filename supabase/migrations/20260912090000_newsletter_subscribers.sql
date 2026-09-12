-- The e-bulletin's subscriber list.
--
-- Additive: one table and one index, nothing existing is touched. An earlier newsletter module was
-- removed on 2026-08-26 (20260826073940_remove_newsletter_module.sql) along with its tables; this
-- is a fresh, much smaller shape — addresses only. There is no campaign table and nothing here
-- sends mail: collecting the list is the whole of this step.
--
-- The address is the primary key, for the same reason the push endpoint is: it is what identifies a
-- subscriber everywhere else, so signing up twice upserts one row instead of leaving a duplicate.
-- It is stored folded to lower case and the check enforces that, so "Ali@x.com" and "ali@x.com"
-- cannot both be in the list.
--
-- RLS is enabled with no policies at all, on purpose. Every read and write goes through the
-- service-role client in `src/services/newsletter.ts`, which bypasses RLS; the anon key therefore
-- cannot read the list, which is a list of the site's readers' e-mail addresses.

create table if not exists public.newsletter_subscribers (
  email text primary key,
  language text not null default 'tr',
  status text not null default 'subscribed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_check
    check (email = lower(email) and char_length(email) between 5 and 254 and position('@' in email) > 1),
  constraint newsletter_subscribers_language_check check (language in ('tr', 'en')),
  constraint newsletter_subscribers_status_check check (status in ('subscribed', 'unsubscribed'))
);

alter table public.newsletter_subscribers enable row level security;
revoke all on table public.newsletter_subscribers from anon, authenticated;
grant select, insert, update, delete on table public.newsletter_subscribers to service_role;

-- The panel lists newest first and counts by status; both read this index.
create index if not exists newsletter_subscribers_status_created_idx
  on public.newsletter_subscribers (status, created_at desc);

-- Rollback
-- ---------
-- drop index if exists public.newsletter_subscribers_status_created_idx;
-- drop table if exists public.newsletter_subscribers;
