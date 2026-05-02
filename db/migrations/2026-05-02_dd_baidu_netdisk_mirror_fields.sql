-- Delta Dash optional Baidu Netdisk mirror fields
-- Rerunnable migration for exposing approved post-redeem share-link download options.

alter table dd_version_files
  add column if not exists baidu_netdisk_url text,
  add column if not exists baidu_extraction_code text;

comment on column dd_version_files.file_url is
  'Primary approved release file URL or share link exposed to entitled downloaders after purchase/redeem.';

comment on column dd_version_files.mediafire_quickkey is
  'Optional MediaFire quickkey metadata retained for diagnostics or future resolver workflows.';

comment on column dd_version_files.baidu_netdisk_url is
  'Optional Baidu Netdisk mirror URL exposed to entitled downloaders after purchase/redeem.';

comment on column dd_version_files.baidu_extraction_code is
  'Optional Baidu Netdisk extraction code shown with the Baidu mirror after purchase/redeem.';
