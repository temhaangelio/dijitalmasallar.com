-- Read-only RLS / privilege audit. Run this in the Supabase SQL editor before applying anything
-- from supabase/proposed/. Nothing here writes.
--
-- The repository cannot answer these questions on its own: `posts`, `site_settings`, `ad_units`,
-- `admin_users` and the `is_admin()` function have no `create` migration
-- in this repo — they live in the schema shared with the dijitalmasallar.com project.

\echo '== 1. Is RLS enabled and forced on every table the app touches? =='
select
  c.relname                     as table_name,
  c.relrowsecurity              as rls_enabled,
  c.relforcerowsecurity         as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'posts', 'site_settings', 'ad_units', 'admin_users', 'pages'
  )
order by c.relname;

\echo '== 2. Every policy on those tables, with the roles it applies to =='
select
  tablename,
  policyname,
  cmd,
  roles,
  qual        as using_expression,
  with_check  as check_expression
from pg_policies
where schemaname = 'public'
  and tablename in (
    'posts', 'site_settings', 'ad_units', 'admin_users', 'pages'
  )
order by tablename, cmd, policyname;

\echo '== 3. Table privileges granted to anon / authenticated =='
-- Anything beyond SELECT for `anon` on posts / ad_units should be justified.
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
group by table_name, grantee
order by table_name, grantee;

\echo '== 4. SECURITY DEFINER functions without a pinned search_path =='
-- A SECURITY DEFINER function with a mutable search_path is a privilege-escalation vector.
-- `is_admin()` must appear with a `search_path=...` entry in proconfig.
select
  n.nspname                as schema,
  p.proname                as function_name,
  p.prosecdef              as security_definer,
  p.proconfig              as settings,
  pg_get_userbyid(p.proowner) as owner
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
  and p.prosecdef
order by n.nspname, p.proname;

\echo '== 5. Who may execute is_admin()? =='
select
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments,
  coalesce(array_to_string(p.proacl, E'\n'), 'default (public)') as execute_grants
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'is_admin';

\echo '== 6. Storage buckets and their public flag =='
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;

\echo '== 7. Storage policies =='
select policyname, cmd, roles, qual as using_expression, with_check as check_expression
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
