begin;

alter table if exists public.wallets enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'wallets'
      and policyname = 'users read own wallet for deltadash'
  ) then
    create policy "users read own wallet for deltadash"
      on public.wallets
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

commit;
