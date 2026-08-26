-- Remove the newsletter feature and its stored data.
-- Push subscriptions are a separate feature and intentionally remain untouched.

drop table if exists public.newsletter_campaigns;
drop table if exists public.newsletter_subscribers;

-- These objects belong to the original schema and may exist in databases rebuilt
-- from the complete migration history.
drop table if exists public.diji_newsletters;
drop table if exists public.diji_subscribers;
drop type if exists public.diji_newsletter_status;

alter table if exists public.ad_units
  drop column if exists newsletter_enabled;

delete from public.site_settings
where key in (
  'module_newsletter',
  'newsletter_description',
  'newsletter_description_en',
  'newsletter_enabled',
  'newsletter_last_daily_send',
  'newsletter_title',
  'newsletter_title_en',
  'show_subscriber_count'
);
