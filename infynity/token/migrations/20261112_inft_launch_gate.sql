-- INFYNITY fixed-supply proposal and fail-closed release gate.
-- No minting, trading, balances or payments are created by this migration.
create table if not exists private.uhz_inft_launch_policy (
  singleton boolean primary key default true check (singleton),
  target_supply numeric(30,0) not null default 10000000 check (target_supply = 10000000),
  treasury_liquidity_pct integer not null default 45,
  creators_ecosystem_pct integer not null default 25,
  strategic_reserve_pct integer not null default 15,
  infrastructure_pct integer not null default 10,
  founder_pct integer not null default 5,
  tokenomics_approved boolean not null default false,
  multisig_verified boolean not null default false,
  independent_audit_passed boolean not null default false,
  testnet_checks_passed boolean not null default false,
  regulatory_review_complete boolean not null default false,
  reserve_reconciled boolean not null default false,
  payments_compliance_approved boolean not null default false,
  launch_authorized boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint uhz_inft_allocations_sum check (
    treasury_liquidity_pct+creators_ecosystem_pct+strategic_reserve_pct+infrastructure_pct+founder_pct=100
  ),
  constraint uhz_inft_allocations_fixed check (
    treasury_liquidity_pct=45 and creators_ecosystem_pct=25 and strategic_reserve_pct=15
    and infrastructure_pct=10 and founder_pct=5
  ),
  constraint uhz_inft_no_unsafe_approval check (
    not launch_authorized or (
      tokenomics_approved and multisig_verified and independent_audit_passed
      and testnet_checks_passed and regulatory_review_complete
      and reserve_reconciled and payments_compliance_approved
    )
  )
);
alter table private.uhz_inft_launch_policy enable row level security;
revoke all on private.uhz_inft_launch_policy from public, anon, authenticated;
insert into private.uhz_inft_launch_policy(singleton) values (true)
on conflict (singleton) do nothing;

-- Never conflate issuance with planned supply. Actual issuance stays at 0 until verified on-chain.
alter table private.uhz_infinito_config
  add constraint uhz_inft_issued_cap_10m check (issued_units <= 10000000);

-- Non-exposed, internal guard used in all finance write controls.
create or replace function private.uhz_inft_launch_enabled() returns boolean
language sql stable security definer set search_path=''
as $fn$
 select coalesce((
  select l.launch_authorized and l.tokenomics_approved and l.multisig_verified
    and l.independent_audit_passed and l.testnet_checks_passed
    and l.regulatory_review_complete and l.reserve_reconciled
    and l.payments_compliance_approved
    and b.smart_contract_verified and b.liquidity_verified
    and b.payment_provider_verified and b.legal_review_complete
    and b.official_contract_address is not null
    and b.network_chain_id=137 and b.token_symbol='INFT'
    and b.market_price_mxn is not null
    and b.market_price_verified_at > now() - interval '3 minutes'
    and f.token_address=b.official_contract_address
    and f.treasury_address is not null
    and i.issued_units > 0 and i.issued_units<=l.target_supply
  from private.uhz_inft_launch_policy l
  cross join private.uhz_inft_coin_bridge_policy b
  cross join private.uhz_fin_config f
  cross join private.uhz_infinito_config i
  where l.singleton and b.singleton and i.config_id=1 and f.id=1
 ),false);
$fn$;
revoke execute on function private.uhz_inft_launch_enabled() from public,anon,authenticated;

create or replace function private.uhz_inft_block_financial_writes() returns trigger
language plpgsql security definer set search_path=''
as $fn$
begin
  if new.kind in ('deposit_inft','withdraw_inft','buy_inft','sell_inft','coins_to_inft','inft_to_coins') then
    if tg_op='INSERT' or new.status not in ('cancelled','rejected') then
      if not private.uhz_inft_launch_enabled() then
        raise exception using errcode='P0001',
          message='INFYNITY aún no está autorizado: contrato, tesorería, suministro, auditoría, liquidez y cumplimiento pendientes.';
      end if;
    end if;
  end if;
  return new;
end
$fn$;
revoke execute on function private.uhz_inft_block_financial_writes() from public,anon,authenticated;
create trigger uhz_inft_launch_filter_transactions
before insert or update on private.uhz_fin_requests
for each row execute function private.uhz_inft_block_financial_writes();

create or replace function private.uhz_inft_block_config_activation() returns trigger
language plpgsql security definer set search_path=''
as $fn$
begin
  if not private.uhz_inft_launch_enabled() then
    raise exception using errcode='P0001',
      message='No puedes activar la economía INFT: faltan auditoría, tesorería, suministro verificado, revisión legal y autorización de lanzamiento.';
  end if;
  return new;
end
$fn$;
revoke execute on function private.uhz_inft_block_config_activation() from public,anon,authenticated;
create trigger uhz_inft_launch_filter_market
before update on private.uhz_infinito_config
for each row when (new.public_trading_enabled or new.deposits_enabled)
execute function private.uhz_inft_block_config_activation();
create trigger uhz_inft_launch_filter_bridge
before update on private.uhz_inft_coin_bridge_policy
for each row when (new.fiat_to_inft_enabled or new.inft_to_coin_enabled)
execute function private.uhz_inft_block_config_activation();

-- Preserve existing API contract while exposing proposal and reason for disabled controls.
create or replace function public.uhz_inft_coin_status() returns jsonb
language plpgsql stable security definer set search_path=''
as $fn$
declare p private.uhz_inft_coin_bridge_policy%rowtype;
        l private.uhz_inft_launch_policy%rowtype;
        ready boolean := false;
begin
 select * into p from private.uhz_inft_coin_bridge_policy where singleton=true;
 select * into l from private.uhz_inft_launch_policy where singleton=true;
 ready := private.uhz_inft_launch_enabled();
 return jsonb_build_object(
  'ok',true,'symbol','INFT','network','Polygon PoS','chain_id',137,
  'flow',jsonb_build_array('MXN_TO_INFT','INFT_TO_COINS'),
  'fiat_to_inft_ready',ready and coalesce(p.fiat_to_inft_enabled,false),
  'inft_to_coins_ready',ready and coalesce(p.inft_to_coin_enabled,false),
  'contract_verified',coalesce(p.smart_contract_verified,false),
  'liquidity_verified',coalesce(p.liquidity_verified,false),
  'market_quotation_available',
     (p.market_price_mxn is not null and p.market_price_verified_at>now()-interval '3 minutes'),
  'inft_price_mxn',case when p.market_price_mxn is not null and p.market_price_verified_at>now()-interval '3 minutes'
     then p.market_price_mxn else null end,
  'coin_reference_mxn',1,'coin_bonus',0,
  'target_supply_proposed',coalesce(l.target_supply,10000000),
  'supply_issued_confirmed',false,
  'launch_authorized',coalesce(l.launch_authorized,false),
  'technical_and_compliance_gate_passed',ready,
  'tokenomics_status','propuesta pendiente de auditoría y despliegue',
  'allocation_percentages',jsonb_build_object(
      'tesoreria_y_liquidez',l.treasury_liquidity_pct,
      'creadores_y_ecosistema',l.creators_ecosystem_pct,
      'reserva_estrategica',l.strategic_reserve_pct,
      'infraestructura',l.infrastructure_pct,'equipo_fundador',l.founder_pct),
  'reason',case when ready then
     'Economía autorizada por controles; operaciones solo si su ruta particular está habilitada.'
   else
     'INFYNITY está en pre-lanzamiento: emisión máxima propuesta de 10 millones. Compras, conversiones y retiros siguen bloqueados hasta contrato, tesorería, auditoría, liquidez, conciliación y revisión legal.'
   end,
  'updated_at',greatest(p.updated_at,l.updated_at)
 );
end
$fn$;
-- Existing public EXECUTE permissions remain unchanged for the preexisting function.
