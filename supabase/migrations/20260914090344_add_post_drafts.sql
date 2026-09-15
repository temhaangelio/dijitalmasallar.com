alter table public.posts add column is_draft boolean not null default false;
alter table public.posts drop constraint posts_content_tr_length_check;
alter table public.posts drop constraint posts_content_en_length_check;
alter table public.posts add constraint posts_content_tr_length_check check (is_draft or char_length(content_tr) >= 1);
alter table public.posts add constraint posts_content_en_length_check check (is_draft or char_length(content_en) >= 1);
alter policy "Published posts are publicly readable" on public.posts using (not is_draft and created_at <= now());
