-- The day summary's published audio.
--
-- Additive: one table, nothing existing is touched. One row per day and language — the recording
-- itself is an object in the `diji-post-media` bucket, and this row is what says a day has one,
-- which file it is and how long it runs. Publishing the same day again replaces the row and the
-- object behind it.
--
-- The feed reads this with the anon key, so unlike the newsletter list it carries a read policy:
-- the audio is meant to be heard by visitors. Writing stays with the service role, which is what
-- the panel's publish action uses.

create table if not exists public.daily_summary_audio (
  day text not null,
  language text not null default 'tr',
  audio_url text not null,
  storage_path text not null,
  duration_seconds integer not null default 0,
  script text not null default '',
  published_at timestamptz not null default now(),
  primary key (day, language),
  constraint daily_summary_audio_day_check check (day ~ '^\d{4}-\d{2}-\d{2}$'),
  constraint daily_summary_audio_language_check check (language in ('tr', 'en')),
  constraint daily_summary_audio_duration_check check (duration_seconds >= 0)
);

alter table public.daily_summary_audio enable row level security;

-- The feed asks for the newest published day; this is the order it asks in.
create index if not exists daily_summary_audio_recent_idx
  on public.daily_summary_audio (language, day desc);

-- Visitors may read it; only the service role may write it.
drop policy if exists "daily summary audio is public" on public.daily_summary_audio;
create policy "daily summary audio is public"
  on public.daily_summary_audio for select
  to anon, authenticated
  using (true);

revoke all on table public.daily_summary_audio from anon, authenticated;
grant select on table public.daily_summary_audio to anon, authenticated;
grant select, insert, update, delete on table public.daily_summary_audio to service_role;

-- Rollback
-- ---------
-- drop index if exists public.daily_summary_audio_recent_idx;
-- drop table if exists public.daily_summary_audio;
