-- Mod marketplace: extend dd_mods, add dd_user_mod_licenses, purchase_mod_license RPC
-- Rerunnable. Scoped to dd_* objects.

alter table dd_mods
  add column if not exists token_price integer not null default 0 check (token_price >= 0 and token_price <= 100),
  add column if not exists sold_count integer not null default 0,
  add column if not exists is_official_pick boolean not null default false;

-- Rename file_url to download_url if not already done (idempotent via column existence check)
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'dd_mods' and column_name = 'file_url')
     and not exists (select 1 from information_schema.columns where table_name = 'dd_mods' and column_name = 'download_url') then
    alter table dd_mods rename column file_url to download_url;
  end if;
end;
$$;

create table if not exists dd_user_mod_licenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mod_id uuid not null references dd_mods(id) on delete cascade,
  price_paid_tokens integer not null default 0 check (price_paid_tokens >= 0),
  created_at timestamp with time zone not null default timezone('utc', now()),
  unique (user_id, mod_id)
);

alter table dd_user_mod_licenses enable row level security;

drop policy if exists "user read dd_user_mod_licenses" on dd_user_mod_licenses;
create policy "user read dd_user_mod_licenses" on dd_user_mod_licenses
  for select to authenticated using (auth.uid() = user_id or public.dd_is_release_admin());

create or replace function public.purchase_mod_license(p_mod_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_mod dd_mods%rowtype;
  v_wallet_id uuid;
  v_balance numeric;
  v_already_owned boolean := false;
  v_author_wallet_id uuid;
  v_fund_share integer;
  v_author_share integer;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'message', 'Not authenticated');
  end if;

  select * into v_mod from dd_mods where id = p_mod_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Mod not found');
  end if;

  select exists(select 1 from dd_user_mod_licenses where user_id = v_user_id and mod_id = p_mod_id)
    into v_already_owned;

  if v_already_owned or v_mod.token_price = 0 then
    return jsonb_build_object('success', true, 'already_owned', v_already_owned, 'charged_tokens', 0, 'download_url', v_mod.download_url);
  end if;

  select id, token_balance into v_wallet_id, v_balance
  from public.wallets where user_id = v_user_id for update;

  if v_wallet_id is null then
    return jsonb_build_object('success', false, 'message', 'Wallet not found');
  end if;

  if coalesce(v_balance, 0) < v_mod.token_price then
    return jsonb_build_object('success', false, 'message', 'Insufficient tokens');
  end if;

  update public.wallets set token_balance = token_balance - v_mod.token_price, updated_at = now() where id = v_wallet_id;

  insert into public.ledger_entries (wallet_id, amount, currency, operation_type, description)
  values (v_wallet_id, -v_mod.token_price, 'TOKEN', 'MARKET_ENTRY', 'Mod purchase: ' || p_mod_id::text);

  -- 70% to author, 30% to fund pool
  v_author_share := floor(v_mod.token_price * 0.7);
  v_fund_share := v_mod.token_price - v_author_share;

  update dd_fund_pool set balance = balance + v_fund_share, updated_at = now() where id = 1;
  insert into dd_economy_events (event_type, amount, user_id, mod_id) values ('tax', v_fund_share, v_user_id, p_mod_id);

  if v_mod.author_id is not null then
    select id into v_author_wallet_id from public.wallets where user_id = v_mod.author_id;
    if v_author_wallet_id is not null then
      update public.wallets set token_balance = token_balance + v_author_share, updated_at = now() where id = v_author_wallet_id;
      insert into public.ledger_entries (wallet_id, amount, currency, operation_type, description)
      values (v_author_wallet_id, v_author_share, 'TOKEN', 'MOD_SALE', 'Mod sale: ' || p_mod_id::text);
    end if;
  end if;

  insert into dd_economy_events (event_type, amount, user_id, mod_id) values ('mod_sale', v_mod.token_price, v_user_id, p_mod_id);

  insert into dd_user_mod_licenses (user_id, mod_id, price_paid_tokens) values (v_user_id, p_mod_id, v_mod.token_price);

  update dd_mods set sold_count = sold_count + 1 where id = p_mod_id;

  return jsonb_build_object('success', true, 'already_owned', false, 'charged_tokens', v_mod.token_price, 'download_url', v_mod.download_url);
end;
$$;

grant execute on function public.purchase_mod_license(uuid) to authenticated;
