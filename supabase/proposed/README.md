# Proposed migrations — review before applying

Files in this folder are **not** in `supabase/migrations/` on purpose: `supabase db push` must not
pick them up automatically.

`posts`, `site_settings`, `ad_units`, `newsletter_subscribers` and `admin_users` belong to the
schema shared with the `dijitalmasallar.com` project (see the README). This repository has no
`create table` migration for any of them, so their current RLS policies cannot be read from source
control — and a policy added here would sit *alongside* whatever already exists, because Postgres
combines permissive policies with `OR`. Applying a lockdown blindly can therefore either break the
other application or fail to close the hole it was meant to close.

## Order of work

1. Run `supabase/audit/rls-audit.sql` in the SQL editor and read the output.
2. Compare it with `20260823211500_rls_lockdown.sql` in this folder.
3. Delete the statements that are already satisfied, and keep the ones that are not.
4. Test what is left on a staging project (or a branch database), including the
   `dijitalmasallar.com` application if it shares the project.
5. Move the reduced file into `supabase/migrations/` with a fresh timestamp and push it.

## What the audit must confirm

| Check | Expected result |
|---|---|
| `posts`, `ad_units`, `site_settings`, `newsletter_subscribers`, `admin_users` | `rls_enabled = true` |
| `anon` grants | `SELECT` only, and only on `posts` and `ad_units` |
| `anon` policy on `posts` | restricted to `created_at <= now()` — otherwise scheduled posts are publicly readable through PostgREST |
| `anon` policy on `ad_units` | restricted to `active = true and placement = 'home_feed'` |
| `newsletter_subscribers`, `admin_users` | no `anon` or `authenticated` grants at all — the app only reaches them with `service_role` |
| `is_admin()` | `security_definer = true` **and** `proconfig` contains `search_path=` |
| `diji-post-media`, `ad-images` buckets | `public = true` is expected (URLs are public), but `insert`/`update`/`delete` policies must be restricted |
