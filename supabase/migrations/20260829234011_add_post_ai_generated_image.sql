alter table public.posts
  add column if not exists ai_generated_image boolean not null default false;
