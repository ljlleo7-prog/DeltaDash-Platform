-- Patch purchase_release_license to add 30/70 economy split on version sales.
-- Rerunnable via create or replace. Scoped to dd_* objects and public.wallets/ledger_entries.

create or replace function public.purchase_release_license(p_version_id uuid, p_file_id uuid)
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
  v_already_owned boolean := false;
  v_best_transition_price integer;
  v_dev record;
  v_dev_count integer;
  v_dev_share integer;
  v_fund_share integer;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'message', 'Not authenticated');
  end if;

  select * into v_file from dd_version_files where id = p_file_id and version_id = p_version_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Release file not found');
  end if;

  select exists(select 1 from dd_user_version_licenses where user_id = v_user_id and version_id = p_version_id)
    into v_already_owned;

  if v_already_owned then
    insert into dd_download_attempts (user_id, version_id, file_id, charged_tokens, status, metadata)
    values (v_user_id, p_version_id, p_file_id, 0, 'started',
      jsonb_build_object('delivery_mode', 'redeem', 'access_mode', 'redownload', 'file_url', v_file.file_url))
    returning id into v_started_attempt_id;
    return jsonb_build_object('success', true, 'already_owned', true, 'charged_tokens', 0,
      'attempt_id', v_started_attempt_id, 'mediafire_quickkey', v_file.mediafire_quickkey, 'file_url', v_file.file_url);
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
    -- Best price: min of first_purchase and any transition price from owned versions
    select coalesce(
      (select min(tp.token_price)
       from dd_version_transition_prices tp
       join dd_user_version_licenses ul on ul.version_id = tp.from_version_id and ul.user_id = v_user_id
       where tp.to_version_id = p_version_id),
      (select first_purchase_token_price from dd_version_list where id = p_version_id)
    ) into v_price;

    if v_price is null then
      return jsonb_build_object('success', false, 'message', 'Release version not found');
    end if;

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
    values (v_wallet_id, -v_price, 'TOKEN', 'MARKET_ENTRY',
      'Delta Dash download: ' || p_version_id::text || ':' || p_file_id::text);

    -- Economy split: 70% fund pool, 30% split equally among APPROVED developers
    if v_price > 0 then
      v_fund_share := floor(v_price * 0.7);
      update dd_fund_pool set balance = balance + v_fund_share, updated_at = now() where id = 1;
      insert into dd_economy_events (event_type, amount, user_id, version_id)
      values ('version_sale', v_price, v_user_id, p_version_id);

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
          values (v_dev.wid, v_dev_share, 'TOKEN', 'DEVELOPER_PAYOUT', 'Version sale payout: ' || p_version_id::text);
          insert into dd_economy_events (event_type, amount, user_id, version_id)
          values ('developer_payout', v_dev_share, v_dev.uid, p_version_id);
        end loop;
      end if;
    end if;
  end if;

  insert into dd_download_attempts (user_id, version_id, file_id, charged_tokens, status, metadata)
  values (v_user_id, p_version_id, p_file_id, v_price, 'started',
    jsonb_build_object('delivery_mode',
      case when nullif(trim(coalesce(v_file.mediafire_quickkey, '')), '') is null then 'public' else 'mediafire' end,
      'file_url', v_file.file_url))
  returning id into v_started_attempt_id;

  insert into dd_user_version_licenses (user_id, version_id, acquired_via, price_paid_tokens, purchase_download_attempt_id)
  values (v_user_id, p_version_id, 'first_purchase', v_price, v_started_attempt_id);

  return jsonb_build_object('success', true, 'already_owned', false, 'charged_tokens', v_price,
    'attempt_id', v_started_attempt_id, 'mediafire_quickkey', v_file.mediafire_quickkey, 'file_url', v_file.file_url);
end;
$$;

grant execute on function public.purchase_release_license(uuid, uuid) to authenticated;
