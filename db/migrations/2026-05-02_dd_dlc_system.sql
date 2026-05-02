-- DLC system: dd_dlc_list, dd_dlc_files, dd_user_dlc_licenses, purchase_dlc_license RPC
-- Rerunnable. Scoped to dd_* objects and public.dd_is_release_admin().

create table if not exists dd_dlc_list (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  title jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  description jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  supported_version_ids uuid[] not null default '{}',
  first_purchase_token_price integer not null default 0 check (first_purchase_token_price >= 0),
  status text not null default 'active' check (status in ('active', 'withdrawn')),
  official_release_at timestamp with time zone,
  withdrawn_at timestamp with time zone,
  sold_count integer not null default 0,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists dd_dlc_files (
  id uuid primary key default gen_random_uuid(),
  dlc_id uuid not null references dd_dlc_list(id) on delete cascade,
  label jsonb not null default jsonb_build_object('zh', '', 'en', ''),
  file_url text not null,
  size_label text not null default '',
  created_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists dd_user_dlc_licenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dlc_id uuid not null references dd_dlc_list(id) on delete cascade,
  price_paid_tokens integer not null default 0 check (price_paid_tokens >= 0),
  acquired_via text not null default 'first_purchase' check (acquired_via in ('first_purchase', 'admin_grant')),
  created_at timestamp with time zone not null default timezone('utc', now()),
  unique (user_id, dlc_id)
);

alter table dd_dlc_list enable row level security;
alter table dd_dlc_files enable row level security;
alter table dd_user_dlc_licenses enable row level security;

drop policy if exists "public read dd_dlc_list" on dd_dlc_list;
create policy "public read dd_dlc_list" on dd_dlc_list
  for select using (withdrawn_at is null or public.dd_is_release_admin());

drop policy if exists "admin write dd_dlc_list" on dd_dlc_list;
create policy "admin write dd_dlc_list" on dd_dlc_list
  for all to authenticated using (public.dd_is_release_admin()) with check (public.dd_is_release_admin());

drop policy if exists "public read dd_dlc_files" on dd_dlc_files;
create policy "public read dd_dlc_files" on dd_dlc_files
  for select using (true);

drop policy if exists "admin write dd_dlc_files" on dd_dlc_files;
create policy "admin write dd_dlc_files" on dd_dlc_files
  for all to authenticated using (public.dd_is_release_admin()) with check (public.dd_is_release_admin());

drop policy if exists "user read dd_user_dlc_licenses" on dd_user_dlc_licenses;
create policy "user read dd_user_dlc_licenses" on dd_user_dlc_licenses
  for select to authenticated using (auth.uid() = user_id or public.dd_is_release_admin());

create or replace function public.purchase_dlc_license(p_dlc_id uuid, p_file_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_dlc dd_dlc_list%rowtype;
  v_file dd_dlc_files%rowtype;
  v_wallet_id uuid;
  v_balance numeric;
  v_price integer := 0;
  v_exempt boolean := false;
  v_already_owned boolean := false;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'message', 'Not authenticated');
  end if;

  select * into v_dlc from dd_dlc_list where id = p_dlc_id and withdrawn_at is null;
  if not found then
    return jsonb_build_object('success', false, 'message', 'DLC not found');
  end if;

  select * into v_file from dd_dlc_files where id = p_file_id and dlc_id = p_dlc_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'DLC file not found');
  end if;

  select exists(select 1 from dd_user_dlc_licenses where user_id = v_user_id and dlc_id = p_dlc_id)
    into v_already_owned;

  if v_already_owned then
    return jsonb_build_object('success', true, 'already_owned', true, 'charged_tokens', 0, 'file_url', v_file.file_url);
  end if;

  select exists(
    select 1 from public.profiles
    where id = v_user_id
      and (
        upper(trim(coalesce(developer_status, ''))) = 'APPROVED'
        or exists (select 1 from unnest(coalesce(tester_programs, '{}'::text[])) as tp where lower(trim(tp)) = 'deltadash')
      )
  ) into v_exempt;

  if not v_exempt then
    v_price := v_dlc.first_purchase_token_price;

    select id, token_balance into v_wallet_id, v_balance
    from public.wallets where user_id = v_user_id for update;

    if v_wallet_id is null then
      return jsonb_build_object('success', false, 'message', 'Wallet not found');
    end if;

    if coalesce(v_balance, 0) < v_price then
      return jsonb_build_object('success', false, 'message', 'Insufficient tokens');
    end if;

    update public.wallets set token_balance = token_balance - v_price, updated_at = now() where id = v_wallet_id;

    insert into public.ledger_entries (wallet_id, amount, currency, operation_type, description)
    values (v_wallet_id, -v_price, 'TOKEN', 'MARKET_ENTRY', 'Delta Dash DLC: ' || p_dlc_id::text);

    -- Economy split: 70% to fund pool, 30% to developers
    if v_price > 0 then
      update dd_fund_pool set balance = balance + floor(v_price * 0.7), updated_at = now() where id = 1;

      insert into dd_economy_events (event_type, amount, user_id, mod_id)
      values ('version_sale', v_price, v_user_id, null);

      declare
        v_dev record;
        v_dev_count integer;
        v_dev_share integer;
      begin
        select count(*) into v_dev_count
        from public.profiles where upper(trim(coalesce(developer_status, ''))) = 'APPROVED';

        if v_dev_count > 0 then
          v_dev_share := floor(v_price * 0.3 / v_dev_count);
          for v_dev in
            select p.id as uid, w.id as wid
            from public.profiles p
            join public.wallets w on w.user_id = p.id
            where upper(trim(coalesce(p.developer_status, ''))) = 'APPROVED'
          loop
            update public.wallets set token_balance = token_balance + v_dev_share, updated_at = now() where id = v_dev.wid;
            insert into public.ledger_entries (wallet_id, amount, currency, operation_type, description)
            values (v_dev.wid, v_dev_share, 'TOKEN', 'DEVELOPER_PAYOUT', 'DLC sale payout: ' || p_dlc_id::text);
            insert into dd_economy_events (event_type, amount, user_id) values ('developer_payout', v_dev_share, v_dev.uid);
          end loop;
        end if;
      end;
    end if;
  end if;

  insert into dd_user_dlc_licenses (user_id, dlc_id, price_paid_tokens, acquired_via)
  values (v_user_id, p_dlc_id, v_price, 'first_purchase');

  update dd_dlc_list set sold_count = sold_count + 1, updated_at = now() where id = p_dlc_id;

  return jsonb_build_object('success', true, 'already_owned', false, 'charged_tokens', v_price, 'file_url', v_file.file_url);
end;
$$;

grant execute on function public.purchase_dlc_license(uuid, uuid) to authenticated;
