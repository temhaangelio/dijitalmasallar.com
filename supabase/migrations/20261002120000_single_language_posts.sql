-- A note may now be published in one language only. A published note needs text in at least one
-- language (a draft may still be empty); the empty language is '' and the visitor queries filter it.
alter table public.posts drop constraint if exists posts_content_tr_length_check;
alter table public.posts drop constraint if exists posts_content_en_length_check;
alter table public.posts add constraint posts_content_one_language_check
  check (is_draft or char_length(content_tr) >= 1 or char_length(content_en) >= 1);
