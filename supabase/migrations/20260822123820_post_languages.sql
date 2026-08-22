alter table public.posts
  add column if not exists language text not null default 'tr'
  check (language in ('tr', 'en'));

create index if not exists posts_language_created_at_idx
  on public.posts (language, created_at desc);
