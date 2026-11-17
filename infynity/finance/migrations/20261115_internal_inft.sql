-- Switch INFYNITY to the private account ledger without rewriting existing balances or history.
begin;
set local lock_timeout = '5s';
lock table private.uhz_fin_config, private.uhz_fin_wallets, private.uhz_fin_requests in access exclusive mode;

do $$
begin
 if exists (select 1 from private.uhz_fin_config where token_address is not null or treasury_address is not null)
    or exists (select 1 from private.uhz_fin_wallets where asset='INFT' and available+reserved>0)
    or exists (select 1 from private.uhz_fin_requests
      where kind in ('deposit_inft','withdraw_inft') and status in ('requested','quoted','review','processing')) then
  raise exception 'Revisa los saldos y las operaciones externas antes de migrar INFYNITY.';
 end if;
end;
$$;

alter table private.uhz_fin_config add constraint uhz_fin_internal_custody
  check (token_address is null and treasury_address is null);
alter table private.uhz_fin_requests add constraint uhz_fin_internal_operations
  check (kind not in ('deposit_inft','withdraw_inft') or status in ('completed','rejected','cancelled'));

-- Called under the existing finance configuration lock for reservations and settlement.
-- A confirmed conversion consumes inventory until it is settled or cancelled.
create function private.uhz_fin_inventory() returns jsonb
language sql stable set search_path='' as $$
  with position as (
    select 10000000::numeric as cap,
      (select coalesce(sum(available+reserved),0) from private.uhz_fin_wallets where asset='INFT') as assigned,
      (select coalesce(sum(credit_amount),0) from private.uhz_fin_requests
        where kind in ('buy_inft','coins_to_inft') and status in ('review','processing')) as pending
  )
  select jsonb_build_object('cap',cap::text,'assigned',assigned::text,'pending',pending::text,
    'available',(cap-assigned-pending)::text) from position;
$$;
revoke all on function private.uhz_fin_inventory() from public,anon,authenticated;

create or replace function private.uhz_fin_api(p_actor uuid,p_session uuid,p_action text,p jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_column
declare
 cfg private.uhz_fin_config%rowtype; pr private.uhz_fin_prices%rowtype; r private.uhz_fin_requests%rowtype;
 is_admin boolean; amount numeric; liability numeric; committed numeric;
 operation text; decision text; dest jsonb; key_value text; hash_value text; request_id uuid; client_key uuid; status_value text;
begin
 perform private.uhz_fin_actor(p_actor,p_session);is_admin:=private.uhz_fin_admin(p_actor);
 if p_action like 'admin_%' and not is_admin then raise exception 'Acceso exclusivo de administración.' using errcode='42501';end if;
 if jsonb_typeof(p)<>'object' or octet_length(p::text)>16000 then raise exception 'Solicitud inválida.';end if;
 select * into cfg from private.uhz_fin_config where id=1;
 select * into pr from private.uhz_fin_prices order by id desc limit 1;

 if p_action='dashboard' then
  return jsonb_build_object('ok',true,'admin',is_admin,'coins',greatest(private.uhz_fin_coins(p_actor),0),
   'wallets',coalesce((select jsonb_agg(to_jsonb(w)) from (select asset,available::text,reserved::text from private.uhz_fin_wallets where user_id=p_actor)w),'[]'),
   'price',case when pr.id is null then null else jsonb_build_object('id',pr.id,'price_mxn',pr.price_mxn::text,'coins_per_inft',pr.coins_per_inft::text,'reason',pr.reason,'source',pr.source,'created_at',pr.created_at) end,
   'prices',coalesce((select jsonb_agg(to_jsonb(q) order by q.id) from (select id,price_mxn::text,coins_per_inft::text,reason,source,created_at from private.uhz_fin_prices order by id desc limit 180)q),'[]'),
   'bank',jsonb_build_object('name',cfg.bank_name,'holder',cfg.bank_holder,'clabe',cfg.bank_clabe),
   'config',jsonb_build_object('mode','internal','fee_bps',cfg.fee_bps,'coin_limit',1000),
   'inventory',private.uhz_fin_inventory(),
   'requests',coalesce((select jsonb_agg(to_jsonb(q) order by q.created_at desc) from (select id,folio,kind,status,amount::text,method,debit_asset,credit_asset,debit_amount::text,credit_amount::text,fee_amount::text,price_id,quote_expires_at,payer_reference,operator_reference,payment_link,proof_path is not null as has_proof,crypto_hash,wallet_address,destination_last4,note,admin_note,created_at,updated_at from private.uhz_fin_requests where user_id=p_actor order by created_at desc limit 100)q),'[]'),
   'journal',coalesce((select jsonb_agg(to_jsonb(q) order by q.id desc) from (select id,request_id,asset,delta_available::text,delta_reserved::text,event,created_at from private.uhz_fin_journal where user_id=p_actor order by id desc limit 100)q),'[]'));
 end if;
 if p_action='admin_dashboard' then
  return jsonb_build_object('ok',true,'config',to_jsonb(cfg)-array['token_address','treasury_address','token_decimals'],'inventory',private.uhz_fin_inventory(),'prices',coalesce((select jsonb_agg(to_jsonb(q) order by q.id desc) from (select * from private.uhz_fin_prices order by id desc limit 60)q),'[]'),
   'requests',coalesce((select jsonb_agg(to_jsonb(q) order by q.created_at desc) from (select r.id,r.user_id,u.email,r.folio,r.kind,r.status,r.amount::text,r.method,r.debit_asset,r.credit_asset,r.debit_amount::text,r.credit_amount::text,r.fee_amount::text,r.payer_reference,r.operator_reference,r.payment_link,r.proof_path is not null as has_proof,r.crypto_hash,r.wallet_address,r.destination_last4,r.note,r.admin_note,r.created_at,r.updated_at from private.uhz_fin_requests r join auth.users u on u.id=r.user_id order by r.created_at desc limit 150)q),'[]'),
   'liabilities',coalesce((select jsonb_agg(to_jsonb(q)) from (select asset,sum(available+reserved)::text as total,sum(reserved)::text as reserved from private.uhz_fin_wallets group by asset)q),'[]'),
   'audit',coalesce((select jsonb_agg(to_jsonb(q) order by q.id desc) from (select id,request_id,event,previous_hash,event_hash,created_at from private.uhz_fin_audit order by id desc limit 70)q),'[]'));
 end if;
 if p_action='request_detail' or p_action='admin_detail' then
  select * into r from private.uhz_fin_requests where id=(p->>'id')::uuid and (user_id=p_actor or (p_action='admin_detail' and is_admin));
  if r.id is null then raise exception 'Operación no encontrada.';end if;
  dest:=null;
  if p_action='admin_detail' and r.destination_encrypted is not null then
   select decrypted_secret into key_value from vault.decrypted_secrets where name='uhz_finance_payout_key';
   dest:=extensions.pgp_sym_decrypt(r.destination_encrypted,key_value)::jsonb;
   perform private.uhz_fin_log(p_actor,r.id,'destination_viewed','{}');
  end if;
  return jsonb_build_object('ok',true,'request',(to_jsonb(r)-'destination_encrypted')||jsonb_build_object('destination',dest),'receipt',(select jsonb_build_object('hash',event_hash,'previous_hash',previous_hash,'created_at',created_at) from private.uhz_fin_audit where request_id=r.id order by id desc limit 1));
 end if;
 -- All monetary mutations serialize on the singleton reserve row; the existing
 -- Coins lock is shared with content unlocks, preventing concurrent overspend.
 select * into cfg from private.uhz_fin_config where id=1 for update;
 perform pg_advisory_xact_lock(hashtextextended('uhz-eco:'||p_actor::text,0));
 if p_action='admin_config' then
  if length(coalesce(p->>'bank_name',''))>100 or length(coalesce(p->>'bank_holder',''))>160 then raise exception 'Datos bancarios demasiado largos.';end if;
  if coalesce(p->>'bank_clabe','')<>'' and (p->>'bank_clabe') !~ '^[0-9]{18}$' then raise exception 'La CLABE debe contener 18 dígitos.';end if;
  if coalesce(p->>'token_address','')<>'' or coalesce(p->>'treasury_address','')<>'' then
   raise exception 'INFYNITY opera con saldo interno de UniversHZRW.';
  end if;
  update private.uhz_fin_config set bank_name=trim(p->>'bank_name'),bank_holder=trim(p->>'bank_holder'),bank_clabe=trim(p->>'bank_clabe'),fee_bps=(p->>'fee_bps')::integer,updated_at=now() where id=1;
  perform private.uhz_fin_log(p_actor,null,'configuration_updated',jsonb_build_object('bank_last4',right(p->>'bank_clabe',4),'fee_bps',p->>'fee_bps','mode','internal'));
  return jsonb_build_object('ok',true);
 end if;
 if p_action='admin_price' then
  if coalesce(length(trim(p->>'reason')),0)<12 then raise exception 'Explica el motivo de la cotización.';end if;
  insert into private.uhz_fin_prices(price_mxn,coins_per_inft,reason,created_by) values((p->>'price_mxn')::numeric,(p->>'coins_per_inft')::numeric,trim(p->>'reason'),p_actor) returning * into pr;
  perform private.uhz_fin_log(p_actor,null,'price_published',jsonb_build_object('price_id',pr.id,'price_mxn',pr.price_mxn,'coins_per_inft',pr.coins_per_inft,'reason',pr.reason));return jsonb_build_object('ok',true,'price_id',pr.id);
 end if;
 if p_action='create_request' then
  operation:=p->>'kind';amount:=(p->>'amount')::numeric;client_key:=(p->>'request_key')::uuid;
  if coalesce(operation,'') not in ('deposit_mxn','withdraw_mxn','buy_inft','sell_inft','coins_to_inft','inft_to_coins') then
   raise exception 'Esta operación no está disponible. INFYNITY usa saldo interno.';
  end if;
  if operation='deposit_mxn' and coalesce(p->>'method','transfer') not in ('transfer','card') then
   raise exception 'Elige un método de depósito en pesos.';
  end if;
  if operation not in ('deposit_mxn','withdraw_mxn') and pr.id is null then
   raise exception 'La mesa aún debe publicar la cotización de INFT.';
  end if;
  if amount is null or amount<=0 or amount>1000000 or amount<>round(amount,8) or client_key is null then raise exception 'Importe o identificador inválido.';end if;
  if operation in ('deposit_mxn','withdraw_mxn','buy_inft') and amount<>round(amount,2) then raise exception 'Los pesos admiten dos decimales.';end if;
  if operation='coins_to_inft' and (amount<>trunc(amount) or amount>1000) then raise exception 'Introduce de 1 a 1000 Coins.';end if;
  select * into r from private.uhz_fin_requests q where q.user_id=p_actor and q.request_key=client_key;
  if r.id is not null then return jsonb_build_object('ok',true,'id',r.id,'folio',r.folio,'status',r.status,'duplicate',true);end if;
  if (select count(*) from private.uhz_fin_requests where user_id=p_actor and created_at>now()-interval '1 day')>=40 then raise exception 'Alcanzaste el límite diario de solicitudes.';end if;
  if length(coalesce(p->>'reference',''))>160 or length(coalesce(p->>'note',''))>800 then raise exception 'Referencia o nota demasiado larga.';end if;
  dest:=null;
  if operation='withdraw_mxn' then
   if coalesce(p->>'clabe','') !~ '^[0-9]{18}$' or length(trim(coalesce(p->>'holder','')))<4 or length(coalesce(p->>'holder',''))>160 then raise exception 'Revisa el titular y la CLABE de destino.';end if;
   select decrypted_secret into key_value from vault.decrypted_secrets where name='uhz_finance_payout_key';
   if key_value is null then raise exception 'No se pudo proteger la cuenta de destino.';end if;
   dest:=jsonb_build_object('holder',trim(p->>'holder'),'clabe',p->>'clabe','bank',left(coalesce(p->>'bank',''),100));
  end if;
  insert into private.uhz_fin_requests(user_id,request_key,kind,amount,method,payer_reference,note,destination_encrypted,destination_last4)
  values(p_actor,client_key,operation,amount,case operation when 'deposit_mxn' then coalesce(p->>'method','transfer') when 'withdraw_mxn' then 'transfer' else 'balance' end,coalesce(p->>'reference',''),coalesce(p->>'note',''),
    case when dest is not null then extensions.pgp_sym_encrypt(dest::text,key_value,'cipher-algo=aes256') else null end,case when dest is not null then right(p->>'clabe',4) else null end) returning * into r;
  if operation='deposit_mxn' then
   update private.uhz_fin_requests set status='review' where id=r.id;
  elsif operation='withdraw_mxn' then
   perform private.uhz_fin_post(p_actor,r.id,'MXN',-amount,amount,'funds_reserved');
   update private.uhz_fin_requests set status='review',debit_asset='MXN',debit_amount=amount where id=r.id;
  else
   update private.uhz_fin_requests set status='quoted',price_id=pr.id,quote_expires_at=now()+interval '10 minutes',
    debit_asset=case kind when 'buy_inft' then 'MXN' when 'coins_to_inft' then 'COIN' else 'INFT' end,
    credit_asset=case kind when 'sell_inft' then 'MXN' when 'inft_to_coins' then 'COIN' else 'INFT' end,
    debit_amount=amount,
    credit_amount=case kind when 'buy_inft' then trunc(amount/pr.price_mxn*(1-cfg.fee_bps/10000.0),8) when 'sell_inft' then trunc(amount*pr.price_mxn*(1-cfg.fee_bps/10000.0),2) when 'coins_to_inft' then trunc(amount/pr.coins_per_inft*(1-cfg.fee_bps/10000.0),8) when 'inft_to_coins' then trunc(amount*pr.coins_per_inft*(1-cfg.fee_bps/10000.0),0) end,
    fee_amount=round(amount*cfg.fee_bps/10000.0,8) where id=r.id;
  end if;
  perform private.uhz_fin_log(p_actor,r.id,'request_created',jsonb_build_object('kind',r.kind,'amount',amount,'folio',r.folio));
  select * into r from private.uhz_fin_requests where id=r.id;
  return jsonb_build_object('ok',true,'id',r.id,'folio',r.folio,'status',r.status);
 end if;

 request_id:=(p->>'id')::uuid;
 select * into r from private.uhz_fin_requests where id=request_id and (user_id=p_actor or (p_action like 'admin_%' and is_admin)) for update;
 if r.id is null then raise exception 'Operación no encontrada.';end if;
 if p_action='attach_proof' then
  if r.status not in ('review','requested') or r.kind<>'deposit_mxn' then raise exception 'Esta operación no admite comprobantes.';end if;
  if coalesce(p->>'path','') not like p_actor::text||'/'||r.id::text||'/%' or (p->>'sha256') !~ '^[0-9a-f]{64}$' then raise exception 'Comprobante inválido.';end if;
  update private.uhz_fin_requests set proof_path=p->>'path',proof_sha256=p->>'sha256',payer_reference=left(coalesce(p->>'reference',payer_reference),160),updated_at=now() where id=r.id;
  perform private.uhz_fin_log(p_actor,r.id,'proof_attached',jsonb_build_object('sha256',p->>'sha256'));return jsonb_build_object('ok',true);
 end if;
 if p_action='confirm' then
  if r.status='review' then return jsonb_build_object('ok',true,'duplicate',true);end if;
  if r.status<>'quoted' or r.quote_expires_at<now() or r.credit_amount is null or r.credit_amount<=0 then raise exception 'Solicita una cotización vigente antes de confirmar.';end if;
  if r.credit_asset='COIN' and r.credit_amount>1000 then raise exception 'El canje admite hasta 1000 Coins por operación.';end if;
  if r.credit_asset='INFT' and r.credit_amount>(private.uhz_fin_inventory()->>'available')::numeric then
   raise exception 'La cantidad supera el saldo INFT disponible para asignar.';
  end if;
  if r.credit_asset='MXN' then
   select coalesce(sum(available+reserved),0) into liability from private.uhz_fin_wallets where asset='MXN';
   select coalesce(sum(credit_amount),0) into committed from private.uhz_fin_requests
    where kind='sell_inft' and status in ('review','processing');
   if liability+committed+r.credit_amount>cfg.cash_reserve then
    raise exception 'La mesa no tiene reserva en pesos suficiente para esta cotización.';
   end if;
  end if;
  perform private.uhz_fin_post(p_actor,r.id,r.debit_asset,-r.debit_amount,case when r.debit_asset='COIN' then 0 else r.debit_amount end,'funds_reserved');
  update private.uhz_fin_requests set status='review',updated_at=now() where id=r.id;
  perform private.uhz_fin_log(p_actor,r.id,'quote_confirmed',jsonb_build_object('price_id',r.price_id,'debit',r.debit_amount,'credit',r.credit_amount));return jsonb_build_object('ok',true);
 end if;
 if p_action='cancel' or (p_action='admin_review' and p->>'decision'='reject') then
  if p_action='cancel' and r.status='processing' then raise exception 'La operación está en proceso de liquidación.';end if;
  if r.status in ('completed','rejected','cancelled') then return jsonb_build_object('ok',true,'duplicate',true);end if;
  if r.status in ('review','processing') and r.debit_asset is not null then perform private.uhz_fin_post(r.user_id,r.id,r.debit_asset,r.debit_amount,case when r.debit_asset='COIN' then 0 else -r.debit_amount end,'reservation_released');end if;
  status_value:=case when p_action='cancel' then 'cancelled' else 'rejected' end;
  update private.uhz_fin_requests set status=status_value,admin_note=case when is_admin then left(coalesce(p->>'note',''),800) else admin_note end,updated_at=now() where id=r.id;
  perform private.uhz_fin_log(p_actor,r.id,status_value,'{}');return jsonb_build_object('ok',true);
 end if;
 if p_action='admin_review' then
  decision:=p->>'decision';
  if r.status='completed' then return jsonb_build_object('ok',true,'duplicate',true);end if;
  if r.status in ('cancelled','rejected') then raise exception 'La solicitud ya fue cerrada.';end if;
  if decision='payment_link' then
   if r.kind<>'deposit_mxn' or r.method<>'card' or (p->>'payment_link') !~ '^https://([a-z0-9-]+\.)?(mercadopago\.com\.mx|mercadopago\.com|mpago\.la)/' then raise exception 'Usa un enlace de pago HTTPS de Mercado Pago.';end if;
   update private.uhz_fin_requests set payment_link=p->>'payment_link',admin_note=left(coalesce(p->>'note',''),800),updated_at=now() where id=r.id;return jsonb_build_object('ok',true);
  end if;
  if decision='requote' then
   if r.kind not in ('buy_inft','sell_inft','coins_to_inft','inft_to_coins') or r.status not in ('requested','quoted') or pr.id is null then raise exception 'Publica una cotización y revisa el estado de la solicitud.';end if;
   update private.uhz_fin_requests set status='quoted',price_id=pr.id,quote_expires_at=now()+interval '10 minutes',debit_asset=case kind when 'buy_inft' then 'MXN' when 'coins_to_inft' then 'COIN' else 'INFT' end,credit_asset=case kind when 'sell_inft' then 'MXN' when 'inft_to_coins' then 'COIN' else 'INFT' end,debit_amount=amount,
    credit_amount=case kind when 'buy_inft' then trunc(amount/pr.price_mxn*(1-cfg.fee_bps/10000.0),8) when 'sell_inft' then trunc(amount*pr.price_mxn*(1-cfg.fee_bps/10000.0),2) when 'coins_to_inft' then trunc(amount/pr.coins_per_inft*(1-cfg.fee_bps/10000.0),8) when 'inft_to_coins' then trunc(amount*pr.coins_per_inft*(1-cfg.fee_bps/10000.0),0) end,fee_amount=round(amount*cfg.fee_bps/10000.0,8),updated_at=now() where id=r.id;
   return jsonb_build_object('ok',true);
  end if;
  if decision='processing' then
   if r.status<>'review' then raise exception 'La solicitud debe estar confirmada.';end if;
   update private.uhz_fin_requests set status='processing',reviewed_by=p_actor,updated_at=now() where id=r.id;return jsonb_build_object('ok',true);
  end if;
  if decision<>'complete' or r.status not in ('review','processing') then raise exception 'Revisa el estado antes de liquidar.';end if;
  if p->>'verified' is distinct from 'true' then raise exception 'Confirma la conciliación del comprobante.';end if;
  if r.kind in ('deposit_mxn','withdraw_mxn') then
   key_value:=trim(coalesce(p->>'external_reference',''));
   if length(key_value)<8 or length(key_value)>160 then raise exception 'Registra la referencia bancaria o de pago completa.';end if;
   if r.kind='deposit_mxn' and r.proof_path is null then raise exception 'Adjunta el comprobante para la conciliación.';end if;
   insert into private.uhz_fin_proofs(proof_key,request_id,metadata) values('MXN:'||lower(key_value),r.id,jsonb_build_object('reference',key_value,'amount',r.amount));
   if r.kind='deposit_mxn' then
    if cfg.bank_clabe='' and r.method<>'card' then raise exception 'Registra primero la cuenta receptora.';end if;
    perform private.uhz_fin_post(r.user_id,r.id,'MXN',r.amount,0,'deposit_confirmed');update private.uhz_fin_config set cash_reserve=cash_reserve+r.amount where id=1;
   else
    perform private.uhz_fin_post(r.user_id,r.id,'MXN',0,-r.debit_amount,'withdrawal_settled');update private.uhz_fin_config set cash_reserve=cash_reserve-r.debit_amount where id=1;
   end if;
  elsif r.kind in ('buy_inft','sell_inft','coins_to_inft','inft_to_coins') then
   if r.debit_asset<>'COIN' then perform private.uhz_fin_post(r.user_id,r.id,r.debit_asset,0,-r.debit_amount,'exchange_settled');end if;
   if r.credit_asset='MXN' then
    select coalesce(sum(available+reserved),0) into liability from private.uhz_fin_wallets where asset='MXN';
    if liability+r.credit_amount>cfg.cash_reserve then raise exception 'La mesa no tiene reserva en pesos suficiente para esta cotización.';end if;
   end if;
   if r.credit_asset='INFT' and (private.uhz_fin_inventory()->>'available')::numeric<0 then
    raise exception 'La operación excede el límite interno de unidades INFT.';
   end if;
   perform private.uhz_fin_post(r.user_id,r.id,r.credit_asset,r.credit_amount,0,'exchange_received');
  else
   raise exception 'Esta operación no está disponible. INFYNITY usa saldo interno.';
  end if;
  update private.uhz_fin_requests set status='completed',reviewed_by=p_actor,operator_reference=nullif(p->>'external_reference',''),admin_note=left(coalesce(p->>'note',''),800),updated_at=now() where id=r.id;
  hash_value:=private.uhz_fin_log(p_actor,r.id,'settled',jsonb_build_object('kind',r.kind,'amount',r.amount,'debit',r.debit_amount,'credit',r.credit_amount,'price_id',r.price_id));
  return jsonb_build_object('ok',true,'folio',r.folio,'receipt_hash',hash_value);
 end if;
 raise exception 'Acción no reconocida.';
end$$;

-- Public quotes and aggregate inventory only.
create or replace function public.uhz_finance_market() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('source','Mesa UNIVERSHZRW','price',(select jsonb_build_object('id',id,'price_mxn',price_mxn::text,'coins_per_inft',coins_per_inft::text,'reason',reason,'created_at',created_at) from private.uhz_fin_prices order by id desc limit 1),
 'prices',coalesce((select jsonb_agg(to_jsonb(q) order by q.id) from (select id,price_mxn::text,coins_per_inft::text,reason,created_at from private.uhz_fin_prices order by id desc limit 180)q),'[]'),
 'config',(select jsonb_build_object('mode','internal','fee_bps',fee_bps) from private.uhz_fin_config where id=1),
 'inventory',private.uhz_fin_inventory(),
 'settled_count_24h',(select count(*) from private.uhz_fin_requests where status='completed' and kind in ('buy_inft','sell_inft') and updated_at>now()-interval '24 hours'),
 'settled_inft_24h',(select coalesce(sum(case kind when 'buy_inft' then credit_amount else amount end),0)::text from private.uhz_fin_requests where status='completed' and kind in ('buy_inft','sell_inft') and updated_at>now()-interval '24 hours'));
$$;

commit;
