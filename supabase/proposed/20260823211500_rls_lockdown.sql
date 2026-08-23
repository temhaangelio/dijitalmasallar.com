-- PROPOSED — do not apply without reading supabase/proposed/README.md first.
--
-- Brings the tables the browser can reach to "RLS on, closed by default, one narrow read policy".
-- Every statement is idempotent (`drop policy if exists` then `create policy`) and none of them
-- drops a column or a row. A rollback section is at the bottom.
--
-- IMPORTANT: `drop policy if exists` only removes the policies named here. If the shared schema
-- already carries a *broader* permissive policy under a different name, it keeps granting access —
-- permissive policies combine with OR. Run supabase/audit/rls-audit.sql, list what exists, and drop
-- the redundant ones explicitly before relying on this file.

begin;

-- ---------------------------------------------------------------------------
-- posts — the public feed reads this with the anon key
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.posts') is null then return; end if;

  alter table public.posts enable row level security;

  revoke all on table public.posts from anon;
  grant select on table public.posts to anon;

  -- Scheduled rows carry a future `created_at`. Without this predicate anyone holding the anon key
  -- can read unpublished posts straight from PostgREST, regardless of what the app queries.
  drop policy if exists "Visitors read published posts" on public.posts;
  create policy "Visitors read published posts"
    on public.posts for select to anon
    using (created_at <= now());

  drop policy if exists "Admins read every post" on public.posts;
  create policy "Admins read every post"
    on public.posts for select to authenticated
    using ((select public.is_admin()));

  drop policy if exists "Admins write posts" on public.posts;
  create policy "Admins write posts"
    on public.posts for all to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));
end $$;

-- ---------------------------------------------------------------------------
-- ad_units — the feed reads only the active home-feed units
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.ad_units') is null then return; end if;

  alter table public.ad_units enable row level security;

  revoke all on table public.ad_units from anon;
  grant select on table public.ad_units to anon;

  drop policy if exists "Visitors read active feed ads" on public.ad_units;
  create policy "Visitors read active feed ads"
    on public.ad_units for select to anon
    using (active = true and placement = 'home_feed');

  drop policy if exists "Admins manage ads" on public.ad_units;
  create policy "Admins manage ads"
    on public.ad_units for all to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));
end $$;

-- ---------------------------------------------------------------------------
-- site_settings — read on the server with service_role only
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.site_settings') is null then return; end if;

  alter table public.site_settings enable row level security;
  revoke all on table public.site_settings from anon;

  drop policy if exists "Admins manage site settings" on public.site_settings;
  create policy "Admins manage site settings"
    on public.site_settings for all to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));
end $$;

-- ---------------------------------------------------------------------------
-- newsletter_subscribers — subscriber e-mail addresses, service_role only
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.newsletter_subscribers') is null then return; end if;

  alter table public.newsletter_subscribers enable row level security;
  revoke all on table public.newsletter_subscribers from anon, authenticated;
  -- Subscribing goes through the `subscribeAction` server action, which uses service_role and
  -- applies its own rate limit and validation, so anon needs no insert grant of its own.
end $$;

-- ---------------------------------------------------------------------------
-- admin_users — the role table the whole authorisation model rests on
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.admin_users') is null then return; end if;

  alter table public.admin_users enable row level security;
  revoke all on table public.admin_users from anon, authenticated;
end $$;

-- ---------------------------------------------------------------------------
-- is_admin() — pin the search_path
-- ---------------------------------------------------------------------------
-- A SECURITY DEFINER function without a fixed search_path can be tricked into resolving a table or
-- operator from a schema the caller controls. This only sets the config; it does not touch the body.
do $$
declare
  fn record;
begin
  for fn in
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'is_admin'
      and p.prosecdef
      and (p.proconfig is null or not exists (
        select 1 from unnest(p.proconfig) as c where c like 'search_path=%'
      ))
  loop
    execute format('alter function public.%I(%s) set search_path = pg_catalog, public', fn.proname, fn.args);
    raise notice 'Pinned search_path on public.%(%)', fn.proname, fn.args;
  end loop;
end $$;

commit;

-- ===========================================================================
-- Rollback
-- ===========================================================================
-- begin;
--   drop policy if exists "Visitors read published posts" on public.posts;
--   drop policy if exists "Admins read every post"        on public.posts;
--   drop policy if exists "Admins write posts"            on public.posts;
--   drop policy if exists "Visitors read active feed ads" on public.ad_units;
--   drop policy if exists "Admins manage ads"             on public.ad_units;
--   drop policy if exists "Admins manage site settings"   on public.site_settings;
--   alter table public.posts          disable row level security;
--   alter table public.ad_units       disable row level security;
--   alter table public.site_settings  disable row level security;
--   -- Re-grant only what the audit showed was there before:
--   -- grant select on public.posts, public.ad_units to anon;
-- commit;
