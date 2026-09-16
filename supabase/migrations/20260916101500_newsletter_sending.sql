-- Sending the e-bulletin: one unsubscribe key per reader, one record per issue sent.
--
-- The list itself (20260912090000_newsletter_subscribers.sql) collected addresses and nothing more.
-- This migration adds the two things a send needs and nothing else.
--
-- `unsubscribe_token` is what the "listeden çık" link in every message carries. A token rather than
-- the address itself: the link travels through mail servers, spam filters and forwarded copies, and
-- a random key only ever unsubscribes the one row it belongs to, where an address in a URL is a
-- guessable way to unsubscribe somebody else. It is filled in for the rows already in the list and
-- generated for every new one, so no send has to check whether a reader has a key yet.
--
-- `newsletter_issues` is the send log: one row per day and language. Its primary key is what stops
-- a day going out twice — the panel reads it to say "gönderildi", and the send writes it after the
-- provider has accepted the messages, so a row means mail actually left.

alter table public.newsletter_subscribers
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists newsletter_subscribers_unsubscribe_token_idx
  on public.newsletter_subscribers (unsubscribe_token);

create table if not exists public.newsletter_issues (
  day date not null,
  language text not null,
  subject text not null,
  post_count integer not null default 0,
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  sent_at timestamptz not null default now(),
  primary key (day, language),
  constraint newsletter_issues_language_check check (language in ('tr', 'en'))
);

-- Same posture as the subscriber table: RLS on with no policies, every read and write through the
-- service-role client. Who was sent what is not something the anon key should be able to read.
alter table public.newsletter_issues enable row level security;
revoke all on table public.newsletter_issues from anon, authenticated;
grant select, insert, update, delete on table public.newsletter_issues to service_role;

-- The panel asks for the most recent issues, newest first.
create index if not exists newsletter_issues_sent_at_idx
  on public.newsletter_issues (sent_at desc);

-- Rollback
-- ---------
-- drop index if exists public.newsletter_issues_sent_at_idx;
-- drop table if exists public.newsletter_issues;
-- drop index if exists public.newsletter_subscribers_unsubscribe_token_idx;
-- alter table public.newsletter_subscribers drop column if exists unsubscribe_token;
