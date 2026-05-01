-- Delta Dash unified download migration
-- Manual editor-run file for all download-related schema, RLS, and RPC changes.
-- Safe scope: dd_* tables/policies/functions plus public.dd_is_release_admin().
-- This file is intended to be runnable by itself after the base Delta Dash schema migration.
-- It supersedes the earlier partial 2026-04-28_add_dd_download_redemption.sql migration.

alter table dd_version_files
  add column if not exists mediafire_quickkey text;

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

alter table dd_download_attempts enable row level security;

drop policy if exists "user read dd_download_attempts" on dd_download_attempts;
drop policy if exists "authenticated insert dd_download_attempts" on dd_download_attempts;

create policy "user read dd_download_attempts" on dd_download_attempts
for select to authenticated
using (auth.uid() = user_id or public.dd_is_release_admin());

create policy "authenticated insert dd_download_attempts" on dd_download_attempts
for insert to authenticated
with check (auth.uid() = user_id);

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

create index if not exists dd_user_version_licenses_user_version_idx
  on dd_user_version_licenses (user_id, version_id);

alter table dd_user_version_licenses enable row level security;

drop policy if exists "user read dd_user_version_licenses" on dd_user_version_licenses;

create policy "user read dd_user_version_licenses" on dd_user_version_licenses
for select to authenticated
using (auth.uid() = user_id or public.dd_is_release_admin());

create or replace function public.purchase_release_license(
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
  v_existing_license dd_user_version_licenses%rowtype;
  v_wallet_id uuid;
  v_balance numeric;
  v_first_price integer := 0;
  v_best_transition_price integer;
  v_best_source_version_id uuid;
  v_price integer := 0;
  v_acquired_via text := 'first_purchase';
  v_attempt_id uuid;
  v_exempt boolean := false;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'message', 'Not authenticated');
  end if;

  select *
  into v_file
  from dd_version_files
  where id = p_file_id
    and version_id = p_version_id;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Release file not found');
  end if;

  select *
  into v_existing_license
  from dd_user_version_licenses
  where user_id = v_user_id
    and version_id = p_version_id;

  if found then
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
      0,
      'started',
      jsonb_build_object(
        'delivery_mode',
        case when nullif(trim(coalesce(v_file.mediafire_quickkey, '')), '') is null then 'public' else 'mediafire' end,
        'access_mode', 'download'
      )
    )
    returning id into v_attempt_id;

    return jsonb_build_object(
      'success', true,
      'message', 'Already owned',
      'attempt_id', v_attempt_id,
      'charged_tokens', 0,
      'already_owned', true,
      'mediafire_quickkey', v_file.mediafire_quickkey,
      'file_url', v_file.file_url
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

  select first_purchase_token_price
  into v_first_price
  from dd_version_list
  where id = p_version_id;

  if v_first_price is null then
    return jsonb_build_object('success', false, 'message', 'Release version not found');
  end if;

  select transition.token_price, transition.from_version_id
  into v_best_transition_price, v_best_source_version_id
  from dd_version_transition_prices transition
  join dd_user_version_licenses license
    on license.version_id = transition.from_version_id
   and license.user_id = v_user_id
  where transition.to_version_id = p_version_id
  order by transition.token_price asc, transition.created_at asc
  limit 1;

  if v_best_transition_price is not null and v_best_transition_price < v_first_price then
    v_price := v_best_transition_price;
    v_acquired_via := 'transition_purchase';
  else
    v_price := v_first_price;
    v_best_source_version_id := null;
    v_acquired_via := 'first_purchase';
  end if;

  if v_exempt then
    v_price := 0;
  end if;

  if v_price > 0 then
    select id, token_balance
    into v_wallet_id, v_balance
    from public.wallets
    where user_id = v_user_id
    for update;

    if v_wallet_id is null then
      return jsonb_build_object('success', false, 'message', 'Wallet not found');
    end if;

    if coalesce(v_balance, 0) < v_price then
      return jsonb_build_object('success', false, 'message', 'Insufficient tokens');
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
      'Delta Dash license purchase: ' || p_version_id::text
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
      'delivery_mode',
      case when nullif(trim(coalesce(v_file.mediafire_quickkey, '')), '') is null then 'public' else 'mediafire' end,
      'access_mode', 'purchase'
    )
  )
  returning id into v_attempt_id;

  insert into dd_user_version_licenses (
    user_id,
    version_id,
    acquired_via,
    source_version_id,
    price_paid_tokens,
    purchase_download_attempt_id
  ) values (
    v_user_id,
    p_version_id,
    case when v_exempt then 'admin_grant' else v_acquired_via end,
    v_best_source_version_id,
    v_price,
    v_attempt_id
  );

  return jsonb_build_object(
    'success', true,
    'message', 'License purchased',
    'attempt_id', v_attempt_id,
    'charged_tokens', v_price,
    'already_owned', false,
    'mediafire_quickkey', v_file.mediafire_quickkey,
    'file_url', v_file.file_url
  );
end;
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
  v_attempt_id uuid;
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

  if not exists (
    select 1
    from dd_user_version_licenses
    where user_id = v_user_id
      and version_id = p_version_id
  ) then
    return jsonb_build_object(
      'success', false,
      'message', 'License not found'
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
    0,
    'started',
    jsonb_build_object(
      'delivery_mode',
      case when nullif(trim(coalesce(v_file.mediafire_quickkey, '')), '') is null then 'public' else 'mediafire' end,
      'access_mode', 'download',
      'file_url', v_file.file_url
    )
  )
  returning id into v_attempt_id;

  return jsonb_build_object(
    'success', true,
    'message', 'Download redeemed',
    'attempt_id', v_attempt_id,
    'charged_tokens', 0,
    'already_owned', true,
    'mediafire_quickkey', v_file.mediafire_quickkey,
    'file_url', v_file.file_url
  );
end;
$$;

grant execute on function public.purchase_release_license(uuid, uuid) to authenticated;
grant execute on function public.redeem_release_download(uuid, uuid) to authenticated;
