-- Indexes for the query shapes the application actually runs.
--
-- Additive and idempotent: no column, constraint, policy or row is touched, so rolling back means
-- dropping the four indexes (see the block at the end of this file).
--
-- Context: `posts_language_created_at_idx` from 20260822123820 was dropped together with the
-- `language` column in 20260822191348, which left the public feed's
-- `created_at <= now() order by created_at desc limit N` without a supporting index.
--
-- Locking: `create index` (without `concurrently`) takes a SHARE lock and blocks writes to the
-- table while it builds. Supabase runs migrations inside a transaction, where `concurrently` is not
-- allowed. On a large table, run the `concurrently` variants from the SQL editor instead and skip
-- this migration with `supabase migration repair`.

do $$
begin
  if to_regclass('public.posts') is not null then
    -- Public feed, article "next post" lookup, dashboard counters and the scheduled-post tab.
    create index if not exists posts_created_at_desc_idx
      on public.posts (created_at desc);

    -- "Kategori A–Z" sort in the admin posts table.
    create index if not exists posts_category_created_at_idx
      on public.posts (category, created_at desc);
  end if;

  if to_regclass('public.newsletter_subscribers') is not null then
    -- Double opt-in confirmation looks the row up by token.
    create index if not exists newsletter_subscribers_confirmation_token_idx
      on public.newsletter_subscribers (confirmation_token)
      where confirmation_token is not null;

    -- Active / pending / unsubscribed counters on the newsletter dashboard.
    create index if not exists newsletter_subscribers_status_created_idx
      on public.newsletter_subscribers (status, created_at desc);
  end if;
end $$;

-- Rollback
-- ---------
-- drop index if exists public.posts_created_at_desc_idx;
-- drop index if exists public.posts_category_created_at_idx;
-- drop index if exists public.newsletter_subscribers_confirmation_token_idx;
-- drop index if exists public.newsletter_subscribers_status_created_idx;
