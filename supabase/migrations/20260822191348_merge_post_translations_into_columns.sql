set local lock_timeout = '5s';

alter table public.posts
  add column content_tr text,
  add column content_en text,
  add column legacy_english_id uuid;

update public.posts tr
set content_tr = tr.content,
    content_en = en.content,
    legacy_english_id = en.id
from public.posts en
where tr.language = 'tr'
  and en.language = 'en'
  and en.translation_group_id = tr.translation_group_id;

delete from public.posts
where language = 'en';

alter table public.posts
  alter column content_tr set not null,
  alter column content_en set not null,
  add constraint posts_content_tr_length_check check (char_length(content_tr) >= 1),
  add constraint posts_content_en_length_check check (char_length(content_en) >= 1);

drop index if exists public.posts_translation_group_language_key;

alter table public.posts
  drop column content,
  drop column language,
  drop column translation_group_id;

create unique index posts_legacy_english_id_key
  on public.posts (legacy_english_id)
  where legacy_english_id is not null;

comment on column public.posts.content_tr is 'Turkish version of the post content.';
comment on column public.posts.content_en is 'English version of the post content.';
comment on column public.posts.legacy_english_id is 'Preserves existing English detail URLs after merging translations.';
