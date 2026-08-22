alter table public.ad_units
  add column if not exists language text not null default 'tr';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ad_units_language_check'
      and conrelid = 'public.ad_units'::regclass
  ) then
    alter table public.ad_units
      add constraint ad_units_language_check check (language in ('tr', 'en'));
  end if;
end $$;

create index if not exists ad_units_active_language_created_idx
  on public.ad_units (language, created_at desc)
  where active = true and placement = 'home_feed';
