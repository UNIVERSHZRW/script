-- Real custody bookkeeping and manual reconciliation. No simulated balances.
create table private.uhz_fin_config (
 id integer primary key default 1 check(id=1),
 bank_name text not null default '', bank_holder text not null default '', bank_clabe text not null default '',
 token_address text, treasury_address text, token_decimals integer not null default 18 check(token_decimals between 0 and 18),
 fee_bps integer not null default 0 check(fee_bps between 0 and 1000),
 cash_reserve numeric(28,8) not null default 0 check(cash_reserve>=0),
 updated_at timestamptz not null default now()
);
insert into private.uhz_fin_config(id) values(1);
create table private.uhz_fin_prices (
 id bigint generated always as identity primary key, price_mxn numeric(28,8) not null check(price_mxn>0 and price_mxn<=10000000),
 coins_per_inft numeric(28,8) not null check(coins_per_inft>0 and coins_per_inft<=1000000000),
 reason text not null check(length(reason) between 12 and 800), source text not null default 'Mesa UNIVERSHZRW',
 created_by uuid not null, created_at timestamptz not null default now()
);
create table private.uhz_fin_wallets (
 user_id uuid not null, asset text not null check(asset in ('MXN','INFT')),
 available numeric(28,8) not null default 0 check(available>=0), reserved numeric(28,8) not null default 0 check(reserved>=0),
 primary key(user_id,asset), updated_at timestamptz not null default now()
);
create table private.uhz_fin_requests (
 id uuid primary key default gen_random_uuid(), user_id uuid not null, request_key uuid not null,
 folio text not null unique default ('INFT-'||to_char(clock_timestamp(),'YYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 kind text not null check(kind in ('deposit_mxn','withdraw_mxn','deposit_inft','withdraw_inft','buy_inft','sell_inft','coins_to_inft','inft_to_coins')),
 status text not null default 'requested' check(status in ('requested','quoted','review','processing','completed','rejected','cancelled')),
 amount numeric(28,8) not null check(amount>0 and amount<=1000000),
 method text not null default 'transfer' check(method in ('transfer','card','crypto','balance')),
 debit_asset text, credit_asset text, debit_amount numeric(28,8), credit_amount numeric(28,8), fee_amount numeric(28,8) not null default 0,
 price_id bigint references private.uhz_fin_prices(id), quote_expires_at timestamptz,
 payer_reference text not null default '', operator_reference text, payment_link text,
 proof_path text, proof_sha256 text, crypto_hash text, wallet_address text,
 destination_encrypted bytea, destination_last4 text, note text not null default '', admin_note text not null default '',
 reviewed_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,request_key)
);
create index uhz_fin_request_user_recent on private.uhz_fin_requests(user_id,created_at desc);
create index uhz_fin_request_pending on private.uhz_fin_requests(status,created_at) where status in ('requested','quoted','review','processing');
create table private.uhz_fin_journal (
 id bigint generated always as identity primary key, user_id uuid not null, request_id uuid not null references private.uhz_fin_requests(id),
 asset text not null check(asset in ('MXN','INFT','COIN')), delta_available numeric(28,8) not null default 0,
 delta_reserved numeric(28,8) not null default 0, event text not null, created_at timestamptz not null default now()
);
create index uhz_fin_journal_user_recent on private.uhz_fin_journal(user_id,id desc);
create table private.uhz_fin_proofs (
 proof_key text primary key, request_id uuid not null unique references private.uhz_fin_requests(id),
 metadata jsonb not null, created_at timestamptz not null default now()
);
create table private.uhz_fin_audit (
 id bigint generated always as identity primary key, actor uuid not null, request_id uuid, event text not null, payload jsonb not null,
 previous_hash text not null, event_hash text not null unique, created_at timestamptz not null default now()
);
create index uhz_fin_audit_request on private.uhz_fin_audit(request_id,id desc);
create table private.uhz_fin_wallet_links (
 user_id uuid primary key, address text not null unique check(address ~ '^0x[0-9a-f]{40}$'), created_at timestamptz not null default now()
);
create table private.uhz_fin_challenges (
 user_id uuid primary key, nonce uuid not null, message text not null, expires_at timestamptz not null
);
alter table private.uhz_fin_config enable row level security;
alter table private.uhz_fin_prices enable row level security;
alter table private.uhz_fin_wallets enable row level security;
alter table private.uhz_fin_requests enable row level security;
alter table private.uhz_fin_journal enable row level security;
alter table private.uhz_fin_proofs enable row level security;
alter table private.uhz_fin_audit enable row level security;
alter table private.uhz_fin_wallet_links enable row level security;
alter table private.uhz_fin_challenges enable row level security;
revoke all on private.uhz_fin_config,private.uhz_fin_prices,private.uhz_fin_wallets,private.uhz_fin_requests,private.uhz_fin_journal,private.uhz_fin_proofs,private.uhz_fin_audit,private.uhz_fin_wallet_links,private.uhz_fin_challenges from public,anon,authenticated;

do $$begin
 if not exists(select 1 from vault.secrets where name='uhz_finance_payout_key') then
  perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'uhz_finance_payout_key','AES-256 protection for payout instructions; server access only');
 end if;
end$$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('uhz-finance-proofs','uhz-finance-proofs',false,2097152,array['image/jpeg','image/png','image/webp','application/pdf']) on conflict(id) do nothing;

create function private.uhz_fin_immutable() returns trigger language plpgsql set search_path='' as $$begin raise exception 'El registro es inmutable; registra una operación de corrección.';end$$;
create trigger uhz_fin_journal_immutable before update or delete on private.uhz_fin_journal for each row execute function private.uhz_fin_immutable();
create trigger uhz_fin_prices_immutable before update or delete on private.uhz_fin_prices for each row execute function private.uhz_fin_immutable();
create trigger uhz_fin_audit_immutable before update or delete on private.uhz_fin_audit for each row execute function private.uhz_fin_immutable();
create trigger uhz_fin_proofs_immutable before update or delete on private.uhz_fin_proofs for each row execute function private.uhz_fin_immutable();

create function private.uhz_fin_admin(p_actor uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.admin_users a join auth.users u on u.id=a.user_id where a.user_id=p_actor and a.enabled and a.role='owner' and u.raw_app_meta_data->>'uhz_role'='superadmin');
$$;
create function private.uhz_fin_actor(p_actor uuid,p_session uuid) returns void language plpgsql stable security definer set search_path='' as $$begin
 if not exists(select 1 from auth.users u join auth.sessions s on s.user_id=u.id
 where u.id=p_actor and s.id=p_session and u.email_confirmed_at is not null and u.deleted_at is null
 and (u.banned_until is null or u.banned_until<=now()) and (s.not_after is null or s.not_after>now())
 and not coalesce((u.raw_app_meta_data->>'uhz_password_reset_required')::boolean,false))
 or exists(select 1 from private.uhz_member_controls c where c.user_id=p_actor and c.state<>'active')
 then raise exception 'Inicia sesión con una cuenta activa y verificada.' using errcode='42501'; end if;
end$$;
create function private.uhz_fin_coins(p_actor uuid) returns bigint language sql stable security definer set search_path='' as $$
 select coalesce(sum(coins_delta),0)::bigint from (select coins_delta from public.community_coin_ledger where user_id=p_actor union all select coins_delta from private.community_coin_journal where user_id=p_actor) x;
$$;
create function private.uhz_fin_log(p_actor uuid,p_request uuid,p_event text,p_payload jsonb) returns text language plpgsql security definer set search_path='' as $$
declare prev text; h text; t timestamptz:=clock_timestamp();begin
 perform pg_advisory_xact_lock(hashtextextended('uhz-fin-audit',0));
 select event_hash into prev from private.uhz_fin_audit order by id desc limit 1;prev:=coalesce(prev,repeat('0',64));
 h:=encode(extensions.digest(convert_to(jsonb_build_object('actor',p_actor,'request',p_request,'event',p_event,'data',p_payload,'previous',prev,'at',t)::text,'UTF8'),'sha256'),'hex');
 insert into private.uhz_fin_audit(actor,request_id,event,payload,previous_hash,event_hash,created_at) values(p_actor,p_request,p_event,p_payload,prev,h,t);return h;
end$$;
create function private.uhz_fin_post(p_user uuid,p_request uuid,p_asset text,p_available numeric,p_reserved numeric,p_event text) returns void language plpgsql security definer set search_path='' as $$begin
 if p_asset='COIN' then
  if p_reserved<>0 or p_available<>trunc(p_available) or abs(p_available)>1000 or p_available=0 then raise exception 'La operación admite de 1 a 1000 Coins.';end if;
  perform pg_advisory_xact_lock(hashtextextended('uhz-eco:'||p_user::text,0));
  if private.uhz_fin_coins(p_user)+p_available<0 then raise exception 'Coins insuficientes.';end if;
  insert into public.community_coin_ledger(user_id,event_type,coins_delta,note) values(p_user,'manual_adjustment',p_available::integer,'INFYNITY / PMC · '||p_event||' · '||p_request::text);
 else
  insert into private.uhz_fin_wallets(user_id,asset) values(p_user,p_asset) on conflict do nothing;
  update private.uhz_fin_wallets set available=available+p_available,reserved=reserved+p_reserved,updated_at=now() where user_id=p_user and asset=p_asset;
 end if;
 insert into private.uhz_fin_journal(user_id,request_id,asset,delta_available,delta_reserved,event) values(p_user,p_request,p_asset,p_available,p_reserved,p_event);
end$$;

create function private.uhz_fin_api(p_actor uuid,p_session uuid,p_action text,p jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
#variable_conflict use_column
declare
 cfg private.uhz_fin_config%rowtype; pr private.uhz_fin_prices%rowtype; r private.uhz_fin_requests%rowtype;
 is_admin boolean; amount numeric; fee numeric; net numeric; amount_inft numeric; liability numeric; coin_units bigint; balance numeric;
 operation text; decision text; dest jsonb; key_value text; hash_value text; request_id uuid; client_key uuid; nonce uuid; message text; status_value text;
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
   'config',jsonb_build_object('token_address',cfg.token_address,'treasury_address',cfg.treasury_address,'token_decimals',cfg.token_decimals,'fee_bps',cfg.fee_bps,'coin_limit',1000),
   'wallet_address',(select address from private.uhz_fin_wallet_links where user_id=p_actor),
   'requests',coalesce((select jsonb_agg(to_jsonb(q) order by q.created_at desc) from (select id,folio,kind,status,amount::text,method,debit_asset,credit_asset,debit_amount::text,credit_amount::text,fee_amount::text,price_id,quote_expires_at,payer_reference,operator_reference,payment_link,proof_path is not null as has_proof,crypto_hash,wallet_address,destination_last4,note,admin_note,created_at,updated_at from private.uhz_fin_requests where user_id=p_actor order by created_at desc limit 100)q),'[]'),
   'journal',coalesce((select jsonb_agg(to_jsonb(q) order by q.id desc) from (select id,request_id,asset,delta_available::text,delta_reserved::text,event,created_at from private.uhz_fin_journal where user_id=p_actor order by id desc limit 100)q),'[]'));
 end if;
 if p_action='admin_dashboard' then
  return jsonb_build_object('ok',true,'config',to_jsonb(cfg),'prices',coalesce((select jsonb_agg(to_jsonb(q) order by q.id desc) from (select * from private.uhz_fin_prices order by id desc limit 60)q),'[]'),
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
 if p_action='wallet_challenge' then
  nonce:=gen_random_uuid();message:='UNIVERSHZRW / INFYNITY'||chr(10)||'Vincular cartera para la cuenta '||p_actor::text||chr(10)||'Nonce: '||nonce::text||chr(10)||'Esta firma no autoriza transferencias.';
  insert into private.uhz_fin_challenges(user_id,nonce,message,expires_at) values(p_actor,nonce,message,now()+interval '5 minutes') on conflict(user_id) do update set nonce=excluded.nonce,message=excluded.message,expires_at=excluded.expires_at;
  return jsonb_build_object('ok',true,'nonce',nonce,'message',message);
 end if;
 if p_action='challenge_data' then return (select jsonb_build_object('ok',true,'nonce',c.nonce,'message',c.message) from private.uhz_fin_challenges c where c.user_id=p_actor and c.expires_at>now() and c.nonce=(p->>'nonce')::uuid);end if;
 if p_action='wallet_bind_verified' then
  perform 1 from private.uhz_fin_challenges where user_id=p_actor and nonce=(p->>'nonce')::uuid and expires_at>now() for update;
  if not found or (p->>'address') !~ '^0x[0-9a-f]{40}$' then raise exception 'Firma caducada o dirección inválida.';end if;
  if exists(select 1 from private.uhz_fin_requests where user_id=p_actor and kind in ('deposit_inft','withdraw_inft') and status in ('review','processing')) then raise exception 'Finaliza las operaciones de esta cartera antes de sustituirla.';end if;
  insert into private.uhz_fin_wallet_links(user_id,address) values(p_actor,p->>'address') on conflict(user_id) do update set address=excluded.address,created_at=now();
  delete from private.uhz_fin_challenges where user_id=p_actor;
  perform private.uhz_fin_log(p_actor,null,'wallet_linked',jsonb_build_object('address',p->>'address'));
  return jsonb_build_object('ok',true);
 end if;

 -- All monetary mutations serialize on the singleton reserve row; the existing
 -- Coins lock is shared with content unlocks, preventing concurrent overspend.
 select * into cfg from private.uhz_fin_config where id=1 for update;
 perform pg_advisory_xact_lock(hashtextextended('uhz-eco:'||p_actor::text,0));
 if p_action='admin_config' then
  if length(coalesce(p->>'bank_name',''))>100 or length(coalesce(p->>'bank_holder',''))>160 then raise exception 'Datos bancarios demasiado largos.';end if;
  if coalesce(p->>'bank_clabe','')<>'' and (p->>'bank_clabe') !~ '^[0-9]{18}$' then raise exception 'La CLABE debe contener 18 dígitos.';end if;
  if coalesce(p->>'token_address','')<>'' and (p->>'token_address') !~ '^0x[0-9a-fA-F]{40}$' then raise exception 'Contrato inválido.';end if;
  if coalesce(p->>'treasury_address','')<>'' and (p->>'treasury_address') !~ '^0x[0-9a-fA-F]{40}$' then raise exception 'Tesorería inválida.';end if;
  if exists(select 1 from private.uhz_fin_wallets where asset='INFT' and available+reserved>0) and (lower(coalesce(p->>'token_address',''))<>coalesce(cfg.token_address,'') or lower(coalesce(p->>'treasury_address',''))<>coalesce(cfg.treasury_address,'')) then raise exception 'No se puede sustituir la custodia con saldos INFT activos.';end if;
  update private.uhz_fin_config set bank_name=trim(p->>'bank_name'),bank_holder=trim(p->>'bank_holder'),bank_clabe=trim(p->>'bank_clabe'),token_address=nullif(lower(p->>'token_address'),''),treasury_address=nullif(lower(p->>'treasury_address'),''),token_decimals=coalesce((p->>'token_decimals')::integer,token_decimals),fee_bps=(p->>'fee_bps')::integer,updated_at=now() where id=1;
  perform private.uhz_fin_log(p_actor,null,'configuration_updated',jsonb_build_object('bank_last4',right(p->>'bank_clabe',4),'token',p->>'token_address','fee_bps',p->>'fee_bps'));
  return jsonb_build_object('ok',true);
 end if;
 if p_action='admin_price' then
  if coalesce(length(trim(p->>'reason')),0)<12 then raise exception 'Explica el motivo de la cotización.';end if;
  insert into private.uhz_fin_prices(price_mxn,coins_per_inft,reason,created_by) values((p->>'price_mxn')::numeric,(p->>'coins_per_inft')::numeric,trim(p->>'reason'),p_actor) returning * into pr;
  perform private.uhz_fin_log(p_actor,null,'price_published',jsonb_build_object('price_id',pr.id,'price_mxn',pr.price_mxn,'coins_per_inft',pr.coins_per_inft,'reason',pr.reason));return jsonb_build_object('ok',true,'price_id',pr.id);
 end if;
 if p_action='create_request' then
  operation:=p->>'kind';amount:=(p->>'amount')::numeric;client_key:=(p->>'request_key')::uuid;
  if amount is null or amount<=0 or amount>1000000 or amount<>round(amount,8) or client_key is null then raise exception 'Importe o identificador inválido.';end if;
  if operation in ('deposit_mxn','withdraw_mxn','buy_inft') and amount<>round(amount,2) then raise exception 'Los pesos admiten dos decimales.';end if;
  if operation='coins_to_inft' and (amount<>trunc(amount) or amount>1000) then raise exception 'Introduce de 1 a 1000 Coins.';end if;
  select * into r from private.uhz_fin_requests q where q.user_id=p_actor and q.request_key=client_key;
  if r.id is not null then return jsonb_build_object('ok',true,'id',r.id,'folio',r.folio,'status',r.status,'duplicate',true);end if;
  if (select count(*) from private.uhz_fin_requests where user_id=p_actor and created_at>now()-interval '1 day')>=40 then raise exception 'Alcanzaste el límite diario de solicitudes.';end if;
  if length(coalesce(p->>'reference',''))>160 or length(coalesce(p->>'note',''))>800 then raise exception 'Referencia o nota demasiado larga.';end if;
  dest:=null;
  if operation='withdraw_mxn' then
   if (p->>'clabe') !~ '^[0-9]{18}$' or length(trim(coalesce(p->>'holder','')))<4 or length(coalesce(p->>'holder',''))>160 then raise exception 'Revisa el titular y la CLABE de destino.';end if;
   select decrypted_secret into key_value from vault.decrypted_secrets where name='uhz_finance_payout_key';
   if key_value is null then raise exception 'No se pudo proteger la cuenta de destino.';end if;
   dest:=jsonb_build_object('holder',trim(p->>'holder'),'clabe',p->>'clabe','bank',left(coalesce(p->>'bank',''),100));
  end if;
  insert into private.uhz_fin_requests(user_id,request_key,kind,amount,method,payer_reference,note,wallet_address,destination_encrypted,destination_last4)
  values(p_actor,client_key,operation,amount,coalesce(p->>'method','transfer'),coalesce(p->>'reference',''),coalesce(p->>'note',''),
    case when operation in ('withdraw_inft','deposit_inft') then (select address from private.uhz_fin_wallet_links where user_id=p_actor) else null end,
    case when dest is not null then extensions.pgp_sym_encrypt(dest::text,key_value,'cipher-algo=aes256') else null end,case when dest is not null then right(p->>'clabe',4) else null end) returning * into r;
  if operation in ('withdraw_inft','deposit_inft') and r.wallet_address is null then raise exception 'Vincula primero tu cartera mediante una firma.';end if;
  if operation in ('deposit_mxn','deposit_inft') then
   update private.uhz_fin_requests set status='review' where id=r.id;
  elsif operation in ('withdraw_mxn','withdraw_inft') then
   operation:=case when operation='withdraw_mxn' then 'MXN' else 'INFT' end;
   perform private.uhz_fin_post(p_actor,r.id,operation,-amount,amount,'funds_reserved');
   update private.uhz_fin_requests set status='review',debit_asset=operation,debit_amount=amount where id=r.id;
  elsif pr.id is not null then
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
 if p_action='attach_crypto_hash' then
  if r.kind<>'deposit_inft' or r.status not in ('review','requested') or coalesce(p->>'crypto_hash','') !~ '^0x[0-9a-fA-F]{64}$' then raise exception 'Transferencia inválida.';end if;
  update private.uhz_fin_requests set crypto_hash=lower(p->>'crypto_hash'),updated_at=now() where id=r.id;
  perform private.uhz_fin_log(p_actor,r.id,'transaction_attached',jsonb_build_object('hash',lower(p->>'crypto_hash')));return jsonb_build_object('ok',true);
 end if;
 if p_action='attach_proof' then
  if r.status not in ('review','requested') or r.kind not in ('deposit_mxn','deposit_inft') then raise exception 'Esta operación no admite comprobantes.';end if;
  if coalesce(p->>'path','') not like p_actor::text||'/'||r.id::text||'/%' or (p->>'sha256') !~ '^[0-9a-f]{64}$' then raise exception 'Comprobante inválido.';end if;
  update private.uhz_fin_requests set proof_path=p->>'path',proof_sha256=p->>'sha256',payer_reference=left(coalesce(p->>'reference',payer_reference),160),crypto_hash=nullif(p->>'crypto_hash',''),updated_at=now() where id=r.id;
  perform private.uhz_fin_log(p_actor,r.id,'proof_attached',jsonb_build_object('sha256',p->>'sha256'));return jsonb_build_object('ok',true);
 end if;
 if p_action='confirm' then
  if r.status='review' then return jsonb_build_object('ok',true,'duplicate',true);end if;
  if r.status<>'quoted' or r.quote_expires_at<now() or r.credit_amount is null or r.credit_amount<=0 then raise exception 'Solicita una cotización vigente antes de confirmar.';end if;
  if r.credit_asset='COIN' and r.credit_amount>1000 then raise exception 'El canje admite hasta 1000 Coins por operación.';end if;
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
   if r.status not in ('requested','quoted') or pr.id is null then raise exception 'Publica una cotización y revisa el estado de la solicitud.';end if;
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
  else
   if cfg.token_address is null or cfg.treasury_address is null or coalesce(p->>'chain_verified','')<>'true' or (p->>'token_address') is distinct from cfg.token_address or (p->>'treasury_address') is distinct from cfg.treasury_address or p->>'observed_at' is null or (p->>'observed_at')::timestamptz<now()-interval '2 minutes' or (p->>'observed_at')::timestamptz>now()+interval '30 seconds' then raise exception 'Verifica el contrato y la reserva en blockchain antes de liquidar.';end if;
   amount_inft:=(p->>'reserve_inft')::numeric;
   if amount_inft is null or amount_inft<0 then raise exception 'Reserva no verificada.';end if;
   if r.kind in ('deposit_inft','withdraw_inft') then
    if (p->>'transfer_inft')::numeric is distinct from r.amount or coalesce(p->>'crypto_hash','') !~ '^0x[0-9a-fA-F]{64}$' then raise exception 'El comprobante no coincide con la cantidad solicitada.';end if;
    insert into private.uhz_fin_proofs(proof_key,request_id,metadata) values('137:'||lower(p->>'crypto_hash'),r.id,jsonb_build_object('hash',p->>'crypto_hash','amount',r.amount,'block',p->>'block'));
    if r.kind='deposit_inft' then perform private.uhz_fin_post(r.user_id,r.id,'INFT',r.amount,0,'crypto_deposit_confirmed');else perform private.uhz_fin_post(r.user_id,r.id,'INFT',0,-r.amount,'crypto_withdrawal_settled');end if;
   else
    if r.debit_asset<>'COIN' then perform private.uhz_fin_post(r.user_id,r.id,r.debit_asset,0,-r.debit_amount,'exchange_settled');end if;
    if r.credit_asset='MXN' then
     select coalesce(sum(available+reserved),0) into liability from private.uhz_fin_wallets where asset='MXN';
     if liability+r.credit_amount>cfg.cash_reserve then raise exception 'La mesa no tiene reserva en pesos suficiente para esta cotización.';end if;
    end if;
    perform private.uhz_fin_post(r.user_id,r.id,r.credit_asset,r.credit_amount,0,'exchange_received');
   end if;
   select coalesce(sum(available+reserved),0) into liability from private.uhz_fin_wallets where asset='INFT';
   if liability>amount_inft then raise exception 'La operación excede la reserva INFT verificada.';end if;
  end if;
  update private.uhz_fin_requests set status='completed',reviewed_by=p_actor,operator_reference=coalesce(nullif(p->>'external_reference',''),p->>'crypto_hash'),crypto_hash=coalesce(nullif(p->>'crypto_hash',''),crypto_hash),admin_note=left(coalesce(p->>'note',''),800),updated_at=now() where id=r.id;
  hash_value:=private.uhz_fin_log(p_actor,r.id,'settled',jsonb_build_object('kind',r.kind,'amount',r.amount,'debit',r.debit_amount,'credit',r.credit_amount,'price_id',r.price_id));
  return jsonb_build_object('ok',true,'folio',r.folio,'receipt_hash',hash_value);
 end if;
 raise exception 'Acción no reconocida.';
end$$;

create function public.uhz_finance(p_actor uuid,p_session uuid,p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.uhz_fin_api(p_actor,p_session,p_action,p_payload)$$;
revoke all on function public.uhz_finance(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.uhz_finance(uuid,uuid,text,jsonb) to service_role;
revoke all on function private.uhz_fin_api(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function private.uhz_fin_api(uuid,uuid,text,jsonb) to service_role;
grant usage on schema private to service_role;
revoke all on function private.uhz_fin_admin(uuid),private.uhz_fin_actor(uuid,uuid),private.uhz_fin_coins(uuid),private.uhz_fin_log(uuid,uuid,text,jsonb),private.uhz_fin_post(uuid,uuid,text,numeric,numeric,text),private.uhz_fin_immutable() from public,anon,authenticated;

-- Only published quotes, aggregate settled activity and public chain addresses.
-- No account, request, payment reference or proof leaves this function.
create function public.uhz_finance_market() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('source','Mesa UNIVERSHZRW','price',(select jsonb_build_object('id',id,'price_mxn',price_mxn::text,'coins_per_inft',coins_per_inft::text,'reason',reason,'created_at',created_at) from private.uhz_fin_prices order by id desc limit 1),
 'prices',coalesce((select jsonb_agg(to_jsonb(q) order by q.id) from (select id,price_mxn::text,coins_per_inft::text,reason,created_at from private.uhz_fin_prices order by id desc limit 180)q),'[]'),
 'config',(select jsonb_build_object('token_address',token_address,'treasury_address',treasury_address,'token_decimals',token_decimals,'fee_bps',fee_bps) from private.uhz_fin_config where id=1),
 'settled_count_24h',(select count(*) from private.uhz_fin_requests where status='completed' and kind in ('buy_inft','sell_inft') and updated_at>now()-interval '24 hours'),
 'settled_inft_24h',(select coalesce(sum(case kind when 'buy_inft' then credit_amount else amount end),0)::text from private.uhz_fin_requests where status='completed' and kind in ('buy_inft','sell_inft') and updated_at>now()-interval '24 hours'));
$$;
revoke all on function public.uhz_finance_market() from public;
grant execute on function public.uhz_finance_market() to anon,authenticated,service_role;
