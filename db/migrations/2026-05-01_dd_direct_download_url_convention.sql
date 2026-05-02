-- Delta Dash direct download URL convention
-- Rerunnable documentation migration for the emergency direct-link mode.
-- Official release rows should store the final direct download URL in dd_version_files.file_url.
-- mediafire_quickkey remains internal-only metadata.

comment on column dd_version_files.file_url is
  'Canonical direct download URL for the release file.';

comment on column dd_version_files.mediafire_quickkey is
  'Optional internal MediaFire quickkey for administrators.';

-- Helper query for manual cleanup in the Supabase SQL editor:
-- Find release rows that still appear to use MediaFire share pages instead of direct download URLs.
--
-- select id, version_id, file_url, mediafire_quickkey
-- from dd_version_files
-- where file_url ilike '%mediafire.com/%';
