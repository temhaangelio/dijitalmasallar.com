alter table public.posts
  add column if not exists show_title boolean not null default true,
  add column if not exists show_excerpt boolean not null default true;
