create extension if not exists pgcrypto;
create schema if not exists private;

create type public.diji_profile_role as enum ('admin', 'editor', 'writer');
create type public.diji_post_status as enum ('draft', 'scheduled', 'published', 'archived');
create type public.diji_newsletter_status as enum ('draft', 'scheduled', 'sent', 'cancelled');

create table public.diji_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_path text,
  role public.diji_profile_role not null default 'writer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.diji_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.diji_profiles(id) on delete restrict,
  title text not null check (char_length(title) between 4 and 160),
  slug text not null unique,
  excerpt text not null check (char_length(excerpt) between 20 and 500),
  body text not null,
  category text not null,
  status public.diji_post_status not null default 'draft',
  cover_path text,
  published_at timestamptz,
  scheduled_at timestamptz,
  reads bigint not null default 0 check (reads >= 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.diji_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  status text not null default 'pending' check (status in ('pending','active','unsubscribed','bounced')),
  confirmation_token_hash text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.diji_newsletters (
  id uuid primary key default gen_random_uuid(),
  issue_number integer not null unique check (issue_number > 0),
  subject text not null check (char_length(subject) between 4 and 160),
  content text not null,
  status public.diji_newsletter_status not null default 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid not null references public.diji_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.diji_post_analytics (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.diji_posts(id) on delete cascade,
  viewed_on date not null default current_date,
  views integer not null default 0 check (views >= 0),
  unique_readers integer not null default 0 check (unique_readers >= 0),
  avg_read_seconds integer not null default 0 check (avg_read_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, viewed_on)
);

create table public.diji_site_settings (
  id boolean primary key default true check (id),
  site_name text not null default 'dijitalmasallar.com',
  domain text not null default 'dijitalmasallar.com',
  description text not null default '',
  language text not null default 'tr' check (language in ('tr','en')),
  feed_layout text not null default 'short' check (feed_layout in ('short','card','classic')),
  updated_by uuid references public.diji_profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index diji_posts_author_created_idx on public.diji_posts(author_id, created_at desc) where deleted_at is null;
create index diji_posts_status_published_idx on public.diji_posts(status, published_at desc) where deleted_at is null;
create index diji_posts_scheduled_idx on public.diji_posts(scheduled_at) where status = 'scheduled' and deleted_at is null;
create index diji_newsletters_status_schedule_idx on public.diji_newsletters(status, scheduled_at);
create index diji_post_analytics_date_idx on public.diji_post_analytics(viewed_on desc, post_id);

create or replace function private.diji_current_role()
returns public.diji_profile_role
language sql
stable
security definer
set search_path = ''
as $$ select role from public.diji_profiles where id = (select auth.uid()) $$;

revoke all on function private.diji_current_role() from public;
grant usage on schema private to authenticated;
grant execute on function private.diji_current_role() to authenticated;

create or replace function private.diji_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$ begin new.updated_at = now(); return new; end $$;

create or replace function private.diji_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.diji_profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'writer');
  return new;
end;
$$;

revoke all on function private.diji_handle_new_user() from public;
create trigger diji_on_auth_user_created after insert on auth.users for each row execute function private.diji_handle_new_user();
create trigger diji_profiles_updated_at before update on public.diji_profiles for each row execute function private.diji_set_updated_at();
create trigger diji_posts_updated_at before update on public.diji_posts for each row execute function private.diji_set_updated_at();
create trigger diji_subscribers_updated_at before update on public.diji_subscribers for each row execute function private.diji_set_updated_at();
create trigger diji_newsletters_updated_at before update on public.diji_newsletters for each row execute function private.diji_set_updated_at();
create trigger diji_analytics_updated_at before update on public.diji_post_analytics for each row execute function private.diji_set_updated_at();
create trigger diji_settings_updated_at before update on public.diji_site_settings for each row execute function private.diji_set_updated_at();

insert into public.diji_profiles (id, full_name)
select id, coalesce(raw_user_meta_data ->> 'full_name', '') from auth.users
on conflict (id) do nothing;

alter table public.diji_profiles enable row level security;
alter table public.diji_posts enable row level security;
alter table public.diji_subscribers enable row level security;
alter table public.diji_newsletters enable row level security;
alter table public.diji_post_analytics enable row level security;
alter table public.diji_site_settings enable row level security;

create policy "Authenticated users view team profiles" on public.diji_profiles for select to authenticated using (true);
create policy "Users update their own profile" on public.diji_profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Public reads published posts" on public.diji_posts for select to anon, authenticated using (status = 'published' and published_at <= now() and deleted_at is null);
create policy "Authors and editors read private posts" on public.diji_posts for select to authenticated using ((select auth.uid()) = author_id or (select private.diji_current_role()) in ('admin','editor'));
create policy "Authors create posts" on public.diji_posts for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "Authors and editors update posts" on public.diji_posts for update to authenticated using ((select auth.uid()) = author_id or (select private.diji_current_role()) in ('admin','editor')) with check ((select auth.uid()) = author_id or (select private.diji_current_role()) in ('admin','editor'));
create policy "Authors and admins delete posts" on public.diji_posts for delete to authenticated using ((select auth.uid()) = author_id or (select private.diji_current_role()) = 'admin');

create policy "Visitors subscribe" on public.diji_subscribers for insert to anon, authenticated with check (status = 'pending' and confirmed_at is null);
create policy "Admins manage subscribers" on public.diji_subscribers for all to authenticated using ((select private.diji_current_role()) = 'admin') with check ((select private.diji_current_role()) = 'admin');
create policy "Editors manage newsletters" on public.diji_newsletters for all to authenticated using ((select private.diji_current_role()) in ('admin','editor')) with check ((select private.diji_current_role()) in ('admin','editor'));
create policy "Editors view analytics" on public.diji_post_analytics for select to authenticated using ((select private.diji_current_role()) in ('admin','editor'));
create policy "Admins manage settings" on public.diji_site_settings for all to authenticated using ((select private.diji_current_role()) = 'admin') with check ((select private.diji_current_role()) = 'admin');
create policy "Public reads settings" on public.diji_site_settings for select to anon, authenticated using (true);

grant usage on schema public to anon, authenticated;
grant select on public.diji_posts, public.diji_site_settings to anon;
grant insert on public.diji_subscribers to anon, authenticated;
grant select, insert, update, delete on public.diji_posts to authenticated;
grant select on public.diji_profiles to authenticated;
grant update (full_name, avatar_path, updated_at) on public.diji_profiles to authenticated;
grant select, insert, update, delete on public.diji_newsletters, public.diji_subscribers to authenticated;
grant select on public.diji_post_analytics to authenticated;
grant select, insert, update, delete on public.diji_site_settings to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('diji-post-media', 'diji-post-media', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "diji public reads post media" on storage.objects for select to anon, authenticated using (bucket_id = 'diji-post-media');
create policy "diji users upload to own media folder" on storage.objects for insert to authenticated with check (bucket_id = 'diji-post-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "diji users update own media" on storage.objects for update to authenticated using (bucket_id = 'diji-post-media' and owner_id = (select auth.uid()::text)) with check (bucket_id = 'diji-post-media' and owner_id = (select auth.uid()::text));
create policy "diji users delete own media" on storage.objects for delete to authenticated using (bucket_id = 'diji-post-media' and (owner_id = (select auth.uid()::text) or (select private.diji_current_role()) = 'admin'));
