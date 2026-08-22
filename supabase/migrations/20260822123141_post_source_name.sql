alter table public.posts add column if not exists source_name text;

update public.posts
set source_name = split_part(regexp_replace(source_url, '^https?://(www\.)?', '', 'i'), '/', 1)
where source_name is null and source_url is not null;
