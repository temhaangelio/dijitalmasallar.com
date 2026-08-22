create function pg_temp.strip_markdown(input text)
returns text
language sql
immutable
strict
as $$
  select trim(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(
                    regexp_replace(input, '!\[([^]]*)\]\([^)]+\)', '\1', 'g'),
                    '\[([^]]+)\]\([^)]+\)', '\1', 'g'
                  ),
                  '==([^=]+)==', '\1', 'g'
                ),
                '\*\*([^*]+)\*\*', '\1', 'g'
              ),
              '__([^_]+)__', '\1', 'g'
            ),
            '~~([^~]+)~~', '\1', 'g'
          ),
          '`([^`]+)`', '\1', 'g'
        ),
        E'(^|\n)#{1,6}[[:space:]]+', '\1', 'g'
      ),
      E'(^|\n)>[[:space:]]+', '\1', 'g'
    )
  );
$$;

update public.posts
set content_tr = pg_temp.strip_markdown(content_tr)
where content_tr is distinct from pg_temp.strip_markdown(content_tr);
