-- Delta Dash Platform MVP schema

create table if not exists dd_version_list (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  title jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  status text not null check (status in ('stable', 'beta', 'experimental')),
  summary jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  changelog jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists dd_branch_map (
  id uuid primary key default gen_random_uuid(),
  parent_version_id uuid references dd_version_list(id) on delete cascade,
  child_version_id uuid not null references dd_version_list(id) on delete cascade,
  relation_type text not null default 'branch' check (relation_type in ('branch', 'fork', 'experimental')),
  created_at timestamp with time zone not null default timezone('utc', now()),
  unique (parent_version_id, child_version_id)
);

create table if not exists dd_version_files (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references dd_version_list(id) on delete cascade,
  label jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  file_type text not null check (file_type in ('rules', 'cards', 'driver_pack', 'bundle')),
  file_url text not null,
  size_label text not null default '',
  created_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists dd_mods (
  id uuid primary key default gen_random_uuid(),
  name jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  description jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  base_version_id uuid references dd_version_list(id) on delete set null,
  tags jsonb not null default '[]'::jsonb,
  compatibility jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null default '',
  file_url text not null,
  created_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists dd_forks (
  id uuid primary key default gen_random_uuid(),
  name jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  base_version_id uuid references dd_version_list(id) on delete set null,
  changes jsonb not null default '[]'::jsonb,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null default '',
  created_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists dd_fork_files (
  id uuid primary key default gen_random_uuid(),
  fork_id uuid not null references dd_forks(id) on delete cascade,
  label jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  file_type text not null check (file_type in ('rules', 'cards', 'driver_pack', 'bundle')),
  file_url text not null,
  size_label text not null default '',
  created_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists dd_threads (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  content jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  linked_version_id uuid references dd_version_list(id) on delete set null,
  linked_mod_id uuid references dd_mods(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null default '',
  created_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists dd_rule_sections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  content jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  sort_order integer not null default 0,
  related_section_ids text[] not null default '{}',
  created_at timestamp with time zone not null default timezone('utc', now())
);

alter table dd_version_list enable row level security;
alter table dd_branch_map enable row level security;
alter table dd_version_files enable row level security;
alter table dd_mods enable row level security;
alter table dd_forks enable row level security;
alter table dd_fork_files enable row level security;
alter table dd_threads enable row level security;
alter table dd_rule_sections enable row level security;

create or replace function public.dd_is_release_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and exists (
        select 1
        from unnest(coalesce(tester_programs, '{}')) as program
        where lower(trim(program)) in ('deltadash', 'developer')
      )
  );
$$;

create policy "public read dd_version_list" on dd_version_list for select using (true);
create policy "public read dd_branch_map" on dd_branch_map for select using (true);
create policy "public read dd_version_files" on dd_version_files for select using (true);
create policy "public read dd_mods" on dd_mods for select using (true);
create policy "public read dd_forks" on dd_forks for select using (true);
create policy "public read dd_fork_files" on dd_fork_files for select using (true);
create policy "public read dd_threads" on dd_threads for select using (true);
create policy "public read dd_rule_sections" on dd_rule_sections for select using (true);

create policy "admin write dd_version_list" on dd_version_list for all to authenticated using (public.dd_is_release_admin()) with check (public.dd_is_release_admin());
create policy "admin write dd_branch_map" on dd_branch_map for all to authenticated using (public.dd_is_release_admin()) with check (public.dd_is_release_admin());
create policy "admin write dd_version_files" on dd_version_files for all to authenticated using (public.dd_is_release_admin()) with check (public.dd_is_release_admin());

create policy "authenticated write dd_mods" on dd_mods for insert to authenticated with check (true);
create policy "authenticated write dd_forks" on dd_forks for insert to authenticated with check (true);
create policy "authenticated write dd_fork_files" on dd_fork_files for insert to authenticated with check (true);
create policy "authenticated write dd_threads" on dd_threads for insert to authenticated with check (true);

-- Existing public.profiles stays authoritative and is intentionally not created or modified here.
-- Existing string rows should be backfilled into jsonb objects like {"zh": "...", "en": "..."} before rollout.
-- Shared SSO should continue using the existing geeksproductionstudio.com Supabase project/session cookies.
-- Storage buckets to create:
--   dd-official-releases (public read, admin write via matching storage policies)
--   dd-mods (public or signed)
--   dd-forks (public or signed)
