-- Delta Dash publication management migration
-- Manual editor-run file for publication lifecycle, MediaFire metadata, and release visibility controls.
-- Safe scope: dd_* tables/policies/functions plus public.dd_is_release_admin().

alter table dd_version_list
  add column if not exists official_release_at timestamp with time zone,
  add column if not exists withdrawn_at timestamp with time zone;

alter table dd_version_files
  add column if not exists mediafire_quickkey text;

create or replace function public.dd_is_release_visible(
  p_official_release_at timestamp with time zone,
  p_withdrawn_at timestamp with time zone
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_withdrawn_at is null
    and (
      p_official_release_at is null
      or p_official_release_at <= timezone('utc', now())
    );
$$;

drop policy if exists "public read dd_version_list" on dd_version_list;
create policy "public read dd_version_list" on dd_version_list
for select
using (
  public.dd_is_release_visible(official_release_at, withdrawn_at)
  or public.dd_is_release_admin()
);
