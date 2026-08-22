create table public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  issue_number bigint generated always as identity unique,
  subject text not null check (char_length(subject) between 4 and 160),
  preview_text text not null default '' check (char_length(preview_text) <= 240),
  content text not null check (char_length(content) >= 20),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sent', 'cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count integer not null default 0 check (recipient_count >= 0),
  open_count integer not null default 0 check (open_count >= 0),
  click_count integer not null default 0 check (click_count >= 0),
  unsubscribe_count integer not null default 0 check (unsubscribe_count >= 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'scheduled' or scheduled_at is not null),
  check (status <> 'sent' or sent_at is not null)
);

create index newsletter_campaigns_status_schedule_idx on public.newsletter_campaigns (status, scheduled_at);
create index newsletter_campaigns_created_at_idx on public.newsletter_campaigns (created_at desc);

alter table public.newsletter_campaigns enable row level security;
revoke all on table public.newsletter_campaigns from anon, authenticated;
grant select, insert, update, delete on table public.newsletter_campaigns to service_role;
grant usage, select on sequence public.newsletter_campaigns_issue_number_seq to service_role;
