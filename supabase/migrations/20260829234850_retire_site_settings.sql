-- Site identity, visitor copy, and feature availability are now deployment constants.
-- Preserve the retired rows as a recovery snapshot, but remove all application-role access.
revoke all privileges on table public.site_settings from anon, authenticated;

comment on table public.site_settings is
  'Retired recovery snapshot. Site settings are fixed in src/services/settings.ts.';
