-- Delta Dash server-side download resolver semantics
-- Rerunnable documentation migration for the Edge Function download flow.
-- Official release rows should store a durable release file URL or share link in dd_version_files.file_url.
-- mediafire_quickkey is optional metadata used by the server-side resolver when MediaFire-backed downloads need a fresh direct URL.

comment on column dd_version_files.file_url is
  'Canonical stored release file URL or share link. MediaFire-backed files are resolved server-side at download time.';

comment on column dd_version_files.mediafire_quickkey is
  'Optional MediaFire quickkey used by the server-side download resolver.';
