-- The AI desk: official technology and science sources are scanned on a schedule, each new story is
-- rewritten as a short original summary, and nothing reaches the site until an editor approves it.
--
-- Additive: three new tables, their indexes, one new `site_settings` row. Nothing existing is
-- touched — approval writes a normal row into `public.posts` through the same path the editor uses.
--
-- RLS is enabled with no policies at all, following `push_subscriptions`: every read and write goes
-- through the service-role client in `src/services/ai-desk.ts`, so the anon key can reach none of
-- it. The queue is unpublished editorial material and has no business being readable by visitors.

-- A followed publisher. `kind` records how its stories are actually read, which is resolved once
-- when the source is added rather than guessed on every run: a real feed when one exists, the
-- sitemap when it does not, and scraping the listing page as the last resort.
create table if not exists public.ai_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  site_url text not null,
  -- The address actually fetched: the feed, the sitemap, or the listing page.
  source_url text not null unique,
  kind text not null default 'feed' check (kind in ('feed', 'sitemap', 'page')),
  category text not null default 'Teknoloji' check (char_length(category) between 1 and 60),
  -- Every story link must sit under one of these hosts. This is what makes "official sources only"
  -- a property of the system rather than a promise: a feed that syndicates someone else's article
  -- cannot smuggle it in.
  allowed_hosts text[] not null default '{}',
  active boolean not null default true,
  last_fetched_at timestamptz,
  last_item_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

-- One story, from `new` (collected) through `summarized` (Claude has written it) to the editor's
-- verdict. Rejected rows are kept: they are what stops a story reappearing on the next run.
create table if not exists public.ai_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.ai_sources(id) on delete cascade,
  url text not null,
  -- SHA-256 of the normalised URL. Deduplication has to survive tracking parameters and trailing
  -- slashes, so the raw URL is not the key.
  url_hash text not null unique,
  original_title text not null default '',
  original_excerpt text not null default '',
  original_published_at timestamptz,
  title_tr text,
  title_en text,
  summary_tr text check (summary_tr is null or char_length(summary_tr) <= 400),
  summary_en text check (summary_en is null or char_length(summary_en) <= 400),
  category text,
  -- 1-5. Claude's read on how much this matters, used to sort the queue so the editor sees the
  -- stories worth publishing first rather than whatever arrived last.
  importance smallint check (importance is null or importance between 1 and 5),
  status text not null default 'new'
    check (status in ('new', 'summarized', 'approved', 'rejected', 'skipped', 'failed')),
  post_id uuid references public.posts(id) on delete set null,
  model text,
  input_tokens integer,
  output_tokens integer,
  error text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

-- The queue view: everything waiting on the editor, best story first.
create index if not exists ai_items_queue_idx
  on public.ai_items (status, importance desc nulls last, original_published_at desc nulls last);

-- What the summariser picks up on each run.
create index if not exists ai_items_pending_idx
  on public.ai_items (created_at)
  where status = 'new';

create index if not exists ai_items_source_idx on public.ai_items (source_id);

-- One row per cron firing. Without this a scheduler that quietly stopped looks exactly like a slow
-- news day, which is the failure mode worth engineering against.
create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('collect', 'summarize')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  checked integer not null default 0,
  added integer not null default 0,
  processed integer not null default 0,
  failed integer not null default 0,
  error text
);

create index if not exists ai_runs_recent_idx on public.ai_runs (started_at desc);

alter table public.ai_sources enable row level security;
alter table public.ai_items enable row level security;
alter table public.ai_runs enable row level security;

insert into public.site_settings (key, value) values ('module_ai', 'true'::jsonb)
on conflict (key) do nothing;

-- Rollback
-- ---------
-- drop table if exists public.ai_runs;
-- drop table if exists public.ai_items;
-- drop table if exists public.ai_sources;
-- delete from public.site_settings where key = 'module_ai';
