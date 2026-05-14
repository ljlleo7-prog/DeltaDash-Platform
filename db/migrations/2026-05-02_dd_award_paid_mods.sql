-- Allow awarding any mod (not just free ones), but apply a price penalty.
-- Effective award = floor(p_tokens * 100 / (100 + token_price))
-- e.g. free mod: 100% of p_tokens; price=100: 50% of p_tokens.
-- Rerunnable via create or replace.

create or replace function public.award_mod_contribution(p_mod_id uuid, p_tokens integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mod dd_mods%rowtype;
  v_author_wallet_id uuid;
  v_pool_balance numeric;
  v_effective_tokens integer;
begin
  if not public.dd_is_release_admin() then
    return jsonb_build_object('success', false, 'message', 'Admin only');
  end if;

  if p_tokens <= 0 then
    return jsonb_build_object('success', false, 'message', 'Token amount must be positive');
  end if;

  select * into v_mod from dd_mods where id = p_mod_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Mod not found');
  end if;

  -- Price penalty: higher price = smaller effective award
  -- free (0): 100%, price=50: ~67%, price=100: 50%
  v_effective_tokens := floor(p_tokens::numeric * 100 / (100 + v_mod.token_price));

  if v_effective_tokens <= 0 then
    return jsonb_build_object('success', false, 'message', 'Effective award rounds to zero after price penalty');
  end if;

  select balance into v_pool_balance from dd_fund_pool where id = 1 for update;
  if coalesce(v_pool_balance, 0) < v_effective_tokens then
    return jsonb_build_object('success', false, 'message', 'Insufficient fund pool balance');
  end if;

  if v_mod.author_id is not null then
    select id into v_author_wallet_id from public.wallets where user_id = v_mod.author_id;
    if v_author_wallet_id is not null then
      update public.wallets
        set token_balance = token_balance + v_effective_tokens, updated_at = now()
        where id = v_author_wallet_id;
      insert into public.ledger_entries (wallet_id, amount, currency, operation_type, description)
        values (v_author_wallet_id, v_effective_tokens, 'TOKEN', 'CONTRIBUTION_AWARD',
          'Contribution award for mod: ' || p_mod_id::text);
    end if;
  end if;

  update dd_fund_pool set balance = balance - v_effective_tokens, updated_at = now() where id = 1;

  insert into dd_economy_events (event_type, amount, user_id, mod_id)
    values ('contribution_award', v_effective_tokens, v_mod.author_id, p_mod_id);

  update dd_mods set is_official_pick = true where id = p_mod_id;

  return jsonb_build_object('success', true, 'awarded_tokens', v_effective_tokens,
    'price_penalty_applied', v_mod.token_price > 0);
end;
$$;

grant execute on function public.award_mod_contribution(uuid, integer) to authenticated;
