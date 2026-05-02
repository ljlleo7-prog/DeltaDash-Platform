-- Economy system: dd_fund_pool, dd_economy_events, award_mod_contribution RPC
-- Rerunnable. Scoped to dd_* objects.

create table if not exists dd_fund_pool (
  id integer primary key default 1 check (id = 1),
  balance numeric not null default 0 check (balance >= 0),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

insert into dd_fund_pool (id, balance) values (1, 0) on conflict (id) do nothing;

create table if not exists dd_economy_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('version_sale', 'mod_sale', 'developer_payout', 'contribution_award', 'tax')),
  amount numeric not null,
  user_id uuid references auth.users(id) on delete set null,
  version_id uuid references dd_version_list(id) on delete set null,
  mod_id uuid references dd_mods(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc', now())
);

alter table dd_fund_pool enable row level security;
alter table dd_economy_events enable row level security;

drop policy if exists "public read dd_fund_pool" on dd_fund_pool;
create policy "public read dd_fund_pool" on dd_fund_pool for select using (true);

drop policy if exists "admin read dd_economy_events" on dd_economy_events;
create policy "admin read dd_economy_events" on dd_economy_events
  for select to authenticated using (public.dd_is_release_admin());

create or replace function public.award_mod_contribution(p_mod_id uuid, p_tokens integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_mod dd_mods%rowtype;
  v_author_wallet_id uuid;
  v_pool_balance numeric;
begin
  if not public.dd_is_release_admin() then
    return jsonb_build_object('success', false, 'message', 'Admin only');
  end if;

  if p_tokens <= 0 then
    return jsonb_build_object('success', false, 'message', 'Token amount must be positive');
  end if;

  select * into v_mod from dd_mods where id = p_mod_id and token_price = 0;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Mod not found or not free');
  end if;

  select balance into v_pool_balance from dd_fund_pool where id = 1 for update;
  if coalesce(v_pool_balance, 0) < p_tokens then
    return jsonb_build_object('success', false, 'message', 'Insufficient fund pool balance');
  end if;

  if v_mod.author_id is not null then
    select id into v_author_wallet_id from public.wallets where user_id = v_mod.author_id;
    if v_author_wallet_id is not null then
      update public.wallets set token_balance = token_balance + p_tokens, updated_at = now() where id = v_author_wallet_id;
      insert into public.ledger_entries (wallet_id, amount, currency, operation_type, description)
      values (v_author_wallet_id, p_tokens, 'TOKEN', 'CONTRIBUTION_AWARD', 'Contribution award for mod: ' || p_mod_id::text);
    end if;
  end if;

  update dd_fund_pool set balance = balance - p_tokens, updated_at = now() where id = 1;

  insert into dd_economy_events (event_type, amount, user_id, mod_id)
  values ('contribution_award', p_tokens, v_mod.author_id, p_mod_id);

  update dd_mods set is_official_pick = true where id = p_mod_id;

  return jsonb_build_object('success', true, 'awarded_tokens', p_tokens);
end;
$$;

grant execute on function public.award_mod_contribution(uuid, integer) to authenticated;
