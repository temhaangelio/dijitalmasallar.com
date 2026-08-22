alter table public.posts
  add column translation_group_id uuid;

-- Imported translations already share their source and publication time.
-- Use the Turkish row id as a stable group id for every existing pair.
with translation_pairs as (
  select tr.id as group_id, tr.id as tr_id, en.id as en_id
  from public.posts tr
  join public.posts en
    on en.language = 'en'
   and en.created_at = tr.created_at
   and en.source_url is not distinct from tr.source_url
  where tr.language = 'tr'
)
update public.posts post
set translation_group_id = pairs.group_id
from (
  select group_id, tr_id as post_id from translation_pairs
  union all
  select group_id, en_id as post_id from translation_pairs
) pairs
where post.id = pairs.post_id;

-- Keep any unmatched legacy row independently editable.
update public.posts
set translation_group_id = id
where translation_group_id is null;

alter table public.posts
  alter column translation_group_id set default gen_random_uuid(),
  alter column translation_group_id set not null;

create unique index posts_translation_group_language_key
  on public.posts (translation_group_id, language);

comment on column public.posts.translation_group_id is
  'Links the Turkish and English variants of the same post.';
