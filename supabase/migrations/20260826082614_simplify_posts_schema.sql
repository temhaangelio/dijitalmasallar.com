drop index if exists public.posts_category_created_at_idx;

alter table public.posts
  drop column if exists category,
  drop column if exists source_name,
  drop column if exists show_title,
  drop column if exists show_excerpt;
