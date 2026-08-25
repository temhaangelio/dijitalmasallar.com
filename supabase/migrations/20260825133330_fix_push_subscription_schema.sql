-- The production project already had an older push_subscriptions table. `create table if not
-- exists` in the original migration therefore left its newer columns absent. Bring that table up
-- to the shape expected by src/services/push.ts without replacing it or losing subscriptions.

alter table public.push_subscriptions
  add column if not exists language text,
  add column if not exists last_seen_at timestamptz;

update public.push_subscriptions
set language = 'tr'
where language is null;

update public.push_subscriptions
set last_seen_at = coalesce(updated_at, created_at, now())
where last_seen_at is null;

alter table public.push_subscriptions
  alter column language set default 'tr',
  alter column language set not null,
  alter column last_seen_at set default now(),
  alter column last_seen_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'push_subscriptions_language_check'
      and conrelid = 'public.push_subscriptions'::regclass
  ) then
    alter table public.push_subscriptions
      add constraint push_subscriptions_language_check check (language in ('tr', 'en'));
  end if;
end
$$;

create index if not exists push_subscriptions_language_idx
  on public.push_subscriptions (language);

alter table public.push_subscriptions enable row level security;
revoke all on table public.push_subscriptions from anon, authenticated;
grant select, insert, update, delete on table public.push_subscriptions to service_role;

insert into public.site_settings (key, value)
values ('module_push', 'true'::jsonb)
on conflict (key) do nothing;
