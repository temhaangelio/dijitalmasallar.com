-- Run as a database owner. Everything, including fixture rows, is rolled back.
begin;
insert into public.posts (content_tr, content_en, is_draft) values ('Draft RLS test', '', true);
set local role anon;
do $$ begin
  if exists (select 1 from public.posts where is_draft) then
    raise exception 'Anonymous readers can see drafts';
  end if;
end $$;
reset role;
set local role authenticated;
do $$ begin
  if exists (select 1 from public.posts where is_draft) then
    raise exception 'Readers without an admin session can see drafts';
  end if;
end $$;
rollback;
