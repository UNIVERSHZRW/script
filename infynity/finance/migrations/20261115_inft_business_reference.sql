-- Internal valuation and allocation estimates based on published operating data
-- and reconciled product sales. No entries are posted to withdrawable wallets.
begin;
set local lock_timeout = '5s';

-- Keep the published business methodology stable for comparable historical cuts.
-- Source: /inversionistas/api/valoracion (methodology_version = 1.0).
create view private.uhz_fin_valuation_v1 with (security_invoker = true) as
select snapshot_date, captured_at, methodology_version, accounts_auth, resources, products,
  18600 as assets_mxn, -3900 as adjustments_mxn,
  least(1050, accounts_auth::bigint * 35)::integer as accounts_mxn,
  least(840, resources::bigint * 12)::integer as resources_mxn,
  least(450, products::bigint * 15)::integer as products_mxn,
  14700 + least(1050, accounts_auth::bigint * 35)
    + least(840, resources::bigint * 12) + least(450, products::bigint * 15) as value_mxn
from public.uhz_valuation_snapshots
where published and methodology_version = '1.0'
  and accounts_auth >= 0 and resources >= 0 and products >= 0;

create table private.uhz_fin_business_terms (
  id bigint generated always as identity primary key,
  unit_base bigint not null check (unit_base between 1 and 10000000),
  basis_reference text not null check (length(basis_reference) between 8 and 200),
  share_bps integer check (share_bps between 0 and 10000),
  terms_reference text check (length(terms_reference) between 8 and 200),
  recorded_by uuid not null,
  created_at timestamptz not null default now(),
  check (share_bps is null or terms_reference is not null)
);

create table private.uhz_fin_product_sales (
  id bigint generated always as identity primary key,
  product text not null check (product in ('coins', 'plan')),
  method text not null check (method in ('mercado_pago', 'spei')),
  reference text not null check (length(reference) between 6 and 160),
  gross_mxn numeric(14,2) not null check (gross_mxn > 0),
  costs_mxn numeric(14,2) not null check (costs_mxn >= 0),
  pool_mxn numeric(14,2) not null check (pool_mxn >= 0 and pool_mxn <= greatest(gross_mxn - costs_mxn, 0)),
  terms_id bigint references private.uhz_fin_business_terms(id),
  recorded_by uuid not null,
  created_at timestamptz not null default now(),
  reversed_at timestamptz,
  reversal_reason text check (length(reversal_reason) between 8 and 400),
  unique (method, reference),
  check ((reversed_at is null) = (reversal_reason is null))
);

create table private.uhz_fin_product_allocations (
  sale_id bigint references private.uhz_fin_product_sales(id) on delete restrict,
  user_id uuid,
  units bigint not null check (units >= 1),
  amount_mxn numeric(14,2) not null check (amount_mxn > 0),
  primary key (sale_id, user_id)
);
create index uhz_fin_product_allocations_user on private.uhz_fin_product_allocations(user_id, sale_id desc);

alter table private.uhz_fin_business_terms enable row level security;
alter table private.uhz_fin_product_sales enable row level security;
alter table private.uhz_fin_product_allocations enable row level security;
revoke all on private.uhz_fin_valuation_v1, private.uhz_fin_business_terms, private.uhz_fin_product_sales,
  private.uhz_fin_product_allocations from public, anon, authenticated, service_role;

create trigger uhz_fin_business_terms_immutable before update or delete on private.uhz_fin_business_terms
  for each row execute function private.uhz_fin_immutable();
create trigger uhz_fin_product_allocations_immutable before update or delete on private.uhz_fin_product_allocations
  for each row execute function private.uhz_fin_immutable();

create function private.uhz_fin_business(p_actor uuid, p_session uuid, p_action text, p jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  terms private.uhz_fin_business_terms%rowtype;
  sale private.uhz_fin_product_sales%rowtype;
  latest private.uhz_fin_valuation_v1%rowtype;
  previous private.uhz_fin_valuation_v1%rowtype;
  holdings numeric;
  reference_units bigint;
  unit_base bigint;
  share_bps integer;
  basis_reference text;
  terms_reference text;
  product_code text;
  payment_method text;
  payment_reference text;
  gross numeric(14,2);
  costs numeric(14,2);
  pool numeric(14,2);
  sale_id bigint;
  reason text;
begin
  perform private.uhz_fin_actor(p_actor, p_session);
  if p_action like 'admin_%' and not private.uhz_fin_admin(p_actor) then
    raise exception 'Acceso exclusivo de administración.' using errcode = '42501';
  end if;
  if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text) > 16000 then
    raise exception 'Solicitud inválida.';
  end if;

  if p_action in ('business', 'admin_business') then
    select * into terms from private.uhz_fin_business_terms order by id desc limit 1;
    select * into latest from private.uhz_fin_valuation_v1 order by snapshot_date desc limit 1;
    select * into previous from private.uhz_fin_valuation_v1
      where snapshot_date < latest.snapshot_date order by snapshot_date desc limit 1;
    select coalesce((
      select w.available + w.reserved from private.uhz_fin_wallets w
      where w.user_id = p_actor and w.asset = 'INFT'
    ), 0) into holdings;
    if terms.unit_base >= (private.uhz_fin_inventory()->>'assigned')::numeric then
      reference_units := terms.unit_base;
    end if;

    return jsonb_build_object(
      'ok', true,
      'valuation', case when latest.snapshot_date is not null then to_jsonb(latest) end,
      'previous', case when previous.snapshot_date is not null then to_jsonb(previous) end,
      'history', coalesce((select jsonb_agg(to_jsonb(points) order by snapshot_date)
        from (select * from private.uhz_fin_valuation_v1 order by snapshot_date desc limit 90) points), '[]'::jsonb),
      'unit_base', reference_units,
      'holding_units', holdings::text,
      'eligible_units', trunc(holdings)::text,
      'unit_value_mxn', round(latest.value_mxn::numeric / reference_units, 8)::text,
      'holding_value_mxn', round(holdings * latest.value_mxn / reference_units, 2)::text,
      'holding_change_mxn', round(holdings * (latest.value_mxn - previous.value_mxn) / reference_units, 2)::text,
      'share_bps', terms.share_bps,
      'allocation_total_mxn', (select coalesce(sum(a.amount_mxn), 0)::text
        from private.uhz_fin_product_allocations a
        join private.uhz_fin_product_sales s on s.id = a.sale_id
        where a.user_id = p_actor and s.reversed_at is null),
      'allocations', coalesce((select jsonb_agg(to_jsonb(entries) order by id desc)
        from (
          select s.id, s.product, s.created_at, s.reversed_at, a.units, a.amount_mxn::text
          from private.uhz_fin_product_allocations a
          join private.uhz_fin_product_sales s on s.id = a.sale_id
          where a.user_id = p_actor order by a.sale_id desc limit 30
        ) entries), '[]'::jsonb)
    ) || case when p_action = 'admin_business' then jsonb_build_object(
      'terms', case when terms.id is not null then to_jsonb(terms) - 'recorded_by' end,
      'sales', coalesce((select jsonb_agg(to_jsonb(recent) order by id desc)
        from (select id, product, method, reference, gross_mxn, costs_mxn, pool_mxn, created_at, reversed_at
          from private.uhz_fin_product_sales order by id desc limit 50) recent), '[]'::jsonb)
    ) else '{}'::jsonb end;
  end if;

  -- Freeze the valuation terms and wallet position while reconciling a payment.
  -- This uses the same lock as the existing finance settlement path.
  perform 1 from private.uhz_fin_config where id = 1 for update;

  if p_action = 'admin_business_terms' then
    basis_reference := trim(coalesce(p->>'basis_reference', ''));
    terms_reference := nullif(trim(coalesce(p->>'terms_reference', '')), '');
    if coalesce(p->>'unit_base', '') !~ '^[1-9][0-9]{0,7}$'
      or length(basis_reference) not between 8 and 200
      or (coalesce(p->>'share_bps', '') <> '' and p->>'share_bps' !~ '^[0-9]{1,5}$') then
      raise exception 'Registra un número entero de unidades y el documento que lo sustenta.';
    end if;
    unit_base := (p->>'unit_base')::bigint;
    share_bps := nullif(p->>'share_bps', '')::integer;
    if unit_base > 10000000 or (share_bps is not null and
        (share_bps > 10000 or coalesce(length(terms_reference), 0) not between 8 and 200)) then
      raise exception 'Revisa la base de unidades y las condiciones documentadas del reparto.';
    end if;
    if unit_base < (private.uhz_fin_inventory()->>'assigned')::numeric then
      raise exception 'La base de referencia debe cubrir las unidades que ya están asignadas.';
    end if;
    select * into terms from private.uhz_fin_business_terms order by id desc limit 1;
    if terms.unit_base = unit_base and terms.basis_reference = basis_reference
      and terms.share_bps is not distinct from share_bps
      and terms.terms_reference is not distinct from terms_reference then
      return jsonb_build_object('ok', true, 'id', terms.id, 'duplicate', true);
    end if;
    insert into private.uhz_fin_business_terms(unit_base, basis_reference, share_bps, terms_reference, recorded_by)
    values (unit_base, basis_reference, share_bps, terms_reference, p_actor) returning * into terms;
    perform private.uhz_fin_log(p_actor, null, 'business_terms_registered',
      jsonb_build_object('terms_id', terms.id, 'unit_base', terms.unit_base, 'share_bps', terms.share_bps));
    return jsonb_build_object('ok', true, 'id', terms.id);
  end if;

  if p_action = 'admin_business_sale' then
    product_code := p->>'product';
    payment_method := p->>'method';
    payment_reference := lower(trim(coalesce(p->>'external_reference', '')));
    if coalesce(product_code, '') not in ('coins', 'plan')
      or coalesce(payment_method, '') not in ('mercado_pago', 'spei')
      or length(payment_reference) not between 6 and 160
      or p->>'verified' is distinct from 'true'
      or coalesce(p->>'gross_mxn', '') !~ '^[0-9]{1,10}(\.[0-9]{1,2})?$'
      or coalesce(p->>'costs_mxn', '') !~ '^[0-9]{1,10}(\.[0-9]{1,2})?$' then
      raise exception 'Confirma la venta, su referencia de pago, el cobro y los costos en pesos.';
    end if;
    gross := (p->>'gross_mxn')::numeric;
    costs := (p->>'costs_mxn')::numeric;
    if gross <= 0 then raise exception 'El importe cobrado debe ser mayor que cero.'; end if;

    select * into sale from private.uhz_fin_product_sales s
      where s.method = payment_method and s.reference = payment_reference;
    if found then
      if sale.product <> product_code or sale.gross_mxn <> gross or sale.costs_mxn <> costs then
        raise exception 'Esa referencia ya corresponde a una venta con otros datos.';
      end if;
      return jsonb_build_object('ok', true, 'id', sale.id, 'duplicate', true);
    end if;

    select * into terms from private.uhz_fin_business_terms order by id desc limit 1;
    pool := trunc(greatest(gross - costs, 0) * coalesce(terms.share_bps, 0) / 10000, 2);
    insert into private.uhz_fin_product_sales(product, method, reference, gross_mxn, costs_mxn, pool_mxn, terms_id, recorded_by)
    values (product_code, payment_method, payment_reference, gross, costs, pool, terms.id, p_actor)
    returning * into sale;

    if pool > 0 then
      with eligible as (
        select w.user_id, trunc(w.available + w.reserved)::bigint as units
        from private.uhz_fin_wallets w where w.asset = 'INFT' and w.available + w.reserved >= 1
      ), split as (
        select user_id, units, trunc(pool * units / sum(units) over (), 2) as amount from eligible
      )
      insert into private.uhz_fin_product_allocations(sale_id, user_id, units, amount_mxn)
      select sale.id, user_id, units, amount from split where amount > 0;
    end if;
    perform private.uhz_fin_log(p_actor, null, 'product_sale_reconciled',
      jsonb_build_object('sale_id', sale.id, 'product', sale.product, 'gross_mxn', gross, 'costs_mxn', costs, 'pool_mxn', pool));
    return jsonb_build_object('ok', true, 'id', sale.id);
  end if;

  if p_action = 'admin_business_reverse' then
    reason := trim(coalesce(p->>'reason', ''));
    if coalesce(p->>'sale_id', '') !~ '^[1-9][0-9]{0,17}$' or length(reason) not between 8 and 400 then
      raise exception 'Indica el folio de la venta y el motivo de la reversión.';
    end if;
    sale_id := (p->>'sale_id')::bigint;
    select * into sale from private.uhz_fin_product_sales where id = sale_id;
    if not found then raise exception 'Venta no encontrada.'; end if;
    if sale.reversed_at is not null then return jsonb_build_object('ok', true, 'duplicate', true); end if;
    update private.uhz_fin_product_sales set reversed_at = now(), reversal_reason = reason where id = sale.id;
    perform private.uhz_fin_log(p_actor, null, 'product_sale_reversed', jsonb_build_object('sale_id', sale.id, 'reason', reason));
    return jsonb_build_object('ok', true);
  end if;

  raise exception 'Acción no reconocida.';
end;
$$;
revoke all on function private.uhz_fin_business(uuid, uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function private.uhz_fin_business(uuid, uuid, text, jsonb) to service_role;

-- Preserve the existing exchange/deposit implementation and its service-only entry point.
create or replace function public.uhz_finance(p_actor uuid, p_session uuid, p_action text, p_payload jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
  select case
    when p_action = 'business' or p_action like 'admin_business%'
      then private.uhz_fin_business(p_actor, p_session, p_action, p_payload)
    when p_action in ('dashboard', 'admin_dashboard')
      then private.uhz_fin_api(p_actor, p_session, p_action, p_payload) || jsonb_build_object('business',
        private.uhz_fin_business(p_actor, p_session, case when p_action = 'dashboard' then 'business' else 'admin_business' end, '{}'))
    else private.uhz_fin_api(p_actor, p_session, p_action, p_payload)
  end;
$$;
revoke all on function public.uhz_finance(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.uhz_finance(uuid, uuid, text, jsonb) to service_role;
notify pgrst, 'reload schema';

commit;
