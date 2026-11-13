-- UNIVERSHZRW header account summary: no fake balances, session-scoped and read-only.
-- Does not enable transfers, blockchain minting, withdrawals or payment flows.
create or replace function public.uhz_header_account_summary()
returns jsonb
language plpgsql
stable security definer
set search_path=''
as $fn$
declare
  member uuid;
  coin_data jsonb;
  plan_name text;
  platform_inft_available numeric := 0;
  platform_inft_reserved numeric := 0;
begin
  member := private.community_check_member(); -- verified, active user & live auth.sessions check
  if member is null then
    raise exception 'Inicia sesión para consultar tus saldos' using errcode='42501';
  end if;
  coin_data := private.community_my_coins_v2();
  select coalesce(m.plan,'free')
    into plan_name
    from public.community_memberships m
    where m.user_id=member and m.status='active'
      and m.expires_at>now()
      and (m.begins_at is null or m.begins_at<=now())
    order by m.updated_at desc
    limit 1;
  select coalesce(sum(w.available),0),coalesce(sum(w.reserved),0)
    into platform_inft_available,platform_inft_reserved
    from private.uhz_fin_wallets w
    where w.user_id=member and w.asset='INFT';
  return jsonb_build_object(
    'ok',true,
    'plan',coalesce(plan_name,'free'),
    'coins_balance',greatest(coalesce((coin_data->>'balance')::numeric,0),0),
    'coins_type','internal_points',
    'inft_platform_available',greatest(platform_inft_available,0),
    'inft_platform_reserved',greatest(platform_inft_reserved,0),
    'inft_scope','platform_ledger_only',
    'inft_includes_external_wallet',false,
    'inft_trading_enabled',false,
    'checked_at',now()
  );
end
$fn$;
revoke all on function public.uhz_header_account_summary() from public,anon;
grant execute on function public.uhz_header_account_summary() to authenticated;
comment on function public.uhz_header_account_summary() is 'Authenticated compact header balances and active plan; INFT figures only reflect internal platform ledger, not on-chain external wallets.';
