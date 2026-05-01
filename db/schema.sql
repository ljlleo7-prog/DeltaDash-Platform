-- Delta Dash Platform MVP schema
-- Authoritative snapshot only.
-- For manual environment updates, create and run a new rerunnable file under db/migrations/.
-- Migration files must stay scoped to dd-owned objects plus public.dd_is_release_admin().

create table if not exists dd_version_list (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  title jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  status text not null check (status in ('stable', 'beta', 'experimental')),
  summary jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  changelog jsonb not null default '[]'::jsonb,
  first_purchase_token_price integer not null default 0 check (first_purchase_token_price >= 0),
  official_release_at timestamp with time zone,
  withdrawn_at timestamp with time zone,
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

create table if not exists dd_version_transition_prices (
  id uuid primary key default gen_random_uuid(),
  from_version_id uuid not null references dd_version_list(id) on delete cascade,
  to_version_id uuid not null references dd_version_list(id) on delete cascade,
  transition_type text not null check (transition_type in ('upgrade', 'fallback')),
  token_price integer not null default 0 check (token_price >= 0),
  created_at timestamp with time zone not null default timezone('utc', now()),
  unique (from_version_id, to_version_id, transition_type),
  check (from_version_id <> to_version_id)
);

create table if not exists dd_version_files (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references dd_version_list(id) on delete cascade,
  label jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  file_type text not null check (file_type in ('rules', 'cards', 'driver_pack', 'bundle')),
  file_url text not null,
  mediafire_quickkey text,
  size_label text not null default '',
  created_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists dd_user_version_licenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version_id uuid not null references dd_version_list(id) on delete cascade,
  acquired_via text not null check (acquired_via in ('first_purchase', 'transition_purchase', 'admin_grant')),
  source_version_id uuid references dd_version_list(id) on delete set null,
  price_paid_tokens integer not null default 0 check (price_paid_tokens >= 0),
  purchase_download_attempt_id uuid references dd_download_attempts(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  unique (user_id, version_id)
);

create table if not exists dd_download_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version_id uuid not null references dd_version_list(id) on delete cascade,
  file_id uuid not null references dd_version_files(id) on delete cascade,
  charged_tokens integer not null default 0 check (charged_tokens >= 0),
  status text not null check (status in ('started', 'succeeded', 'failed')),
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc', now())
);

create index if not exists dd_download_attempts_user_created_at_idx
  on dd_download_attempts (user_id, created_at desc);

create index if not exists dd_download_attempts_user_created_at_idx
  on dd_download_attempts (user_id, created_at desc);

create index if not exists dd_user_version_licenses_user_version_idx
  on dd_user_version_licenses (user_id, version_id);

create index if not exists dd_threads_created_at_idx
  on dd_threads (created_at desc);

create index if not exists dd_threads_linked_version_idx
  on dd_threads (linked_version_id);

create index if not exists dd_threads_linked_mod_idx
  on dd_threads (linked_mod_id);

create index if not exists dd_thread_replies_thread_created_idx
  on dd_thread_replies (thread_id, created_at asc);

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
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  status text not null default 'published' check (status in ('published', 'hidden', 'locked'))
);

create table if not exists dd_thread_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references dd_threads(id) on delete cascade,
  content jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null default '',
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  status text not null default 'published' check (status in ('published', 'hidden'))
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
alter table dd_version_transition_prices enable row level security;
alter table dd_version_files enable row level security;
alter table dd_user_version_licenses enable row level security;
alter table dd_download_attempts enable row level security;
alter table dd_mods enable row level security;
alter table dd_forks enable row level security;
alter table dd_fork_files enable row level security;
alter table dd_threads enable row level security;
alter table dd_thread_replies enable row level security;
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
      and upper(trim(coalesce(developer_status, ''))) = 'APPROVED'
  );
$$;

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

create or replace function public.redeem_release_download(
  p_version_id uuid,
  p_file_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_file dd_version_files%rowtype;
  v_wallet_id uuid;
  v_balance numeric;
  v_price integer := 0;
  v_started_attempt_id uuid;
  v_exempt boolean := false;
begin
  if v_user_id is null then
    return jsonb_build_object(
      'success', false,
      'message', 'Not authenticated'
    );
  end if;

  select *
  into v_file
  from dd_version_files
  where id = p_file_id
    and version_id = p_version_id;

  if not found then
    return jsonb_build_object(
      'success', false,
      'message', 'Release file not found'
    );
  end if;

  select exists (
    select 1
    from public.profiles
    where id = v_user_id
      and (
        upper(trim(coalesce(developer_status, ''))) = 'APPROVED'
        or exists (
          select 1
          from unnest(coalesce(tester_programs, '{}'::text[])) as tester_program
          where lower(trim(tester_program)) = 'deltadash'
        )
      )
  ) into v_exempt;

  if not v_exempt then
    select first_purchase_token_price
    into v_price
    from dd_version_list
    where id = p_version_id;

    if v_price is null then
      return jsonb_build_object(
        'success', false,
        'message', 'Release version not found'
      );
    end if;

    select id, token_balance
    into v_wallet_id, v_balance
    from public.wallets
    where user_id = v_user_id
    for update;

    if v_wallet_id is null then
      return jsonb_build_object(
        'success', false,
        'message', 'Wallet not found'
      );
    end if;

    if coalesce(v_balance, 0) < v_price then
      return jsonb_build_object(
        'success', false,
        'message', 'Insufficient tokens'
      );
    end if;

    update public.wallets
    set token_balance = token_balance - v_price,
        updated_at = now()
    where id = v_wallet_id;

    insert into public.ledger_entries (
      wallet_id,
      amount,
      currency,
      operation_type,
      description
    ) values (
      v_wallet_id,
      -v_price,
      'TOKEN',
      'MARKET_ENTRY',
      'Delta Dash download: ' || p_version_id::text || ':' || p_file_id::text
    );
  end if;

  insert into dd_download_attempts (
    user_id,
    version_id,
    file_id,
    charged_tokens,
    status,
    metadata
  ) values (
    v_user_id,
    p_version_id,
    p_file_id,
    v_price,
    'started',
    jsonb_build_object(
      'delivery_mode', case when nullif(trim(coalesce(v_file.mediafire_quickkey, '')), '') is null then 'public' else 'mediafire' end,
      'file_url', v_file.file_url
    )
  )
  returning id into v_started_attempt_id;

  return jsonb_build_object(
    'success', true,
    'message', 'Download redeemed',
    'attempt_id', v_started_attempt_id,
    'charged_tokens', v_price,
    'mediafire_quickkey', v_file.mediafire_quickkey,
    'file_url', v_file.file_url
  );
end;
$$;

create policy "public read dd_version_list" on dd_version_list for select using (
  public.dd_is_release_visible(official_release_at, withdrawn_at)
  or public.dd_is_release_admin()
);
create policy "public read dd_branch_map" on dd_branch_map for select using (true);
create policy "public read dd_version_transition_prices" on dd_version_transition_prices for select using (true);
create policy "public read dd_version_files" on dd_version_files for select using (true);
create policy "public read dd_mods" on dd_mods for select using (true);
create policy "public read dd_forks" on dd_forks for select using (true);
create policy "public read dd_fork_files" on dd_fork_files for select using (true);
create policy "public read dd_threads" on dd_threads for select using (status = 'published');
create policy "public read dd_thread_replies" on dd_thread_replies for select using (status = 'published');
create policy "public read dd_rule_sections" on dd_rule_sections for select using (true);
create policy "user read dd_download_attempts" on dd_download_attempts for select to authenticated using (auth.uid() = user_id or public.dd_is_release_admin());

create policy "admin write dd_version_list" on dd_version_list for all to authenticated using (public.dd_is_release_admin()) with check (public.dd_is_release_admin());
create policy "admin write dd_branch_map" on dd_branch_map for all to authenticated using (public.dd_is_release_admin()) with check (public.dd_is_release_admin());
create policy "admin write dd_version_transition_prices" on dd_version_transition_prices for all to authenticated using (public.dd_is_release_admin()) with check (public.dd_is_release_admin());
create policy "admin write dd_version_files" on dd_version_files for all to authenticated using (public.dd_is_release_admin()) with check (public.dd_is_release_admin());
create policy "authenticated insert dd_download_attempts" on dd_download_attempts for insert to authenticated with check (auth.uid() = user_id);

grant execute on function public.redeem_release_download(uuid, uuid) to authenticated;

create policy "authenticated write dd_mods" on dd_mods for insert to authenticated with check (true);
create policy "authenticated write dd_forks" on dd_forks for insert to authenticated with check (true);
create policy "authenticated write dd_fork_files" on dd_fork_files for insert to authenticated with check (true);
create policy "authenticated write dd_threads" on dd_threads for insert to authenticated with check (auth.uid() = author_id and status = 'published');
create policy "authenticated insert dd_thread_replies" on dd_thread_replies for insert to authenticated with check (auth.uid() = author_id and status = 'published');

-- Existing public.profiles stays authoritative and is intentionally not created or modified here.
-- Existing string rows should be backfilled into jsonb objects like {"zh": "...", "en": "..."} before rollout.
-- Shared SSO should continue using the existing geeksproductionstudio.com Supabase project/session cookies.
-- Storage buckets to create:
--   dd-official-releases (public read, admin write via matching storage policies)
--   dd-mods (public or signed)
--   dd-forks (public or signed)
