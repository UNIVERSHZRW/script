import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {validClabe,paymentLink,fileType,safePayload,decimalUnits,toMorse,validateTransfer,isInftSymbol} from '../core.mjs';
import {verifyMessage} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
const req=createRequire(import.meta.url);
let runtime;try{runtime=req.resolve('@electric-sql/pglite').replace(/\/dist\/index\.(cjs|js)$/,'');}catch{runtime=process.env.PGLITE_ROOT||'/workspace/scratch/49d43893f946/collaboration-update/test-runtime/node_modules/@electric-sql/pglite';}
const {PGlite}=req(runtime);const {pgcrypto}=req(runtime+'/dist/contrib/pgcrypto.cjs');
let db;const owner='10000000-0000-4000-8000-000000000001',alice='10000000-0000-4000-8000-000000000002',bob='10000000-0000-4000-8000-000000000003';
const session=u=>u.replace('10000000','20000000');const call=async(u,a,p={})=>(await db.query('select private.uhz_fin_api($1,$2,$3,$4) as data',[u,session(u),a,p])).rows[0].data;
const make=async(kind,amount,rest={})=>call(alice,'create_request',{kind,amount,request_key:crypto.randomUUID(),...rest});
test('validation: real CLABE checksum, hosted checkout, amounts, upload signatures, Morse',()=>{
 assert.equal(validClabe('032180000118359719'),true);assert.equal(validClabe('032180000118359718'),false);
 assert.equal(paymentLink('https://mpago.la/abc'),true);assert.equal(paymentLink('https://mercadopago.com.mx.attacker.example/pay'),false);assert.equal(paymentLink('javascript:alert(1)'),false);
 assert.equal(fileType(new TextEncoder().encode('<html>')), '');assert.equal(fileType(new TextEncoder().encode('%PDF-1.7')),'application/pdf');
 assert.deepEqual(safePayload({payload:{id:'a',chain_verified:true,reserve_inft:'100',user_id:'foreign'}}),{id:'a'});
 assert.equal(decimalUnits('1.23456789',18),1234567890000000000n);assert.throws(()=>decimalUnits('1.1',0));assert.throws(()=>decimalUnits('1e9',18));
 assert.equal(toMorse('INFT'),'.. -. ..-. -');
 assert.equal(isInftSymbol('0x'+'494e4654'.padEnd(64,'0')),true);assert.equal(isInftSymbol('0x'+'55534443'.padEnd(64,'0')),false);
});
test('wallet signatures bind to the exact one-time account message',async()=>{
 const account=privateKeyToAccount('0x'+'1'.repeat(64));const message='UNIVERSHZRW / INFYNITY\nAccount fixture / nonce '+crypto.randomUUID();const signature=await account.signMessage({message});
 assert.equal(await verifyMessage({address:account.address,message,signature}),true);assert.equal(await verifyMessage({address:account.address,message:message+'changed',signature}),false);
});
test('Polygon proof checks token, direction, exact amount, finality, canonical block and request time',()=>{
 const cfg={token_address:'0x'+'1'.repeat(40),treasury_address:'0x'+'2'.repeat(40),token_decimals:18};
 const r={kind:'deposit_inft',wallet_address:'0x'+'3'.repeat(40),amount:'1',created_at:new Date().toISOString()};const tx='0x'+'a'.repeat(64),blockhash='0x'+'b'.repeat(64);
 const canonical={hash:blockhash,timestamp:'0x'+Math.floor(Date.now()/1000).toString(16)};
 const topic=x=>'0x'+x.slice(2).padStart(64,'0');
 const receipt={transactionHash:tx,status:'0x1',blockNumber:'0x100',blockHash:blockhash,logs:[{address:cfg.token_address,topics:['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',topic(r.wallet_address),topic(cfg.treasury_address)],data:'0x'+(10n**18n).toString(16)}]};
 assert.equal(validateTransfer(receipt,canonical,cfg,r,tx,512n),10n**18n);
 assert.throws(()=>validateTransfer(receipt,canonical,cfg,{...r,amount:'2'},tx,512n),/importe/);
 assert.throws(()=>validateTransfer(receipt,canonical,cfg,{...r,kind:'withdraw_inft'},tx,512n),/importe/);
 assert.throws(()=>validateTransfer(receipt,canonical,cfg,r,tx,300n),/128/);
 assert.throws(()=>validateTransfer(receipt,{...canonical,hash:'0x0'},cfg,r,tx,512n),/Revalida/);
 assert.throws(()=>validateTransfer(receipt,{...canonical,timestamp:'0x1'},cfg,r,tx,512n),/anterior/);
 assert.throws(()=>validateTransfer({...receipt,logs:receipt.logs.map(l=>({...l,removed:true}))},canonical,cfg,r,tx,512n),/importe/);
});
test('database: balances, authorization, replay, quotes, encryption and immutable audit',async t=>{
 db=new PGlite({extensions:{pgcrypto}});await db.exec(`create schema private;create schema auth;create schema vault;create schema storage;create schema extensions;create extension pgcrypto with schema extensions;create role anon;create role authenticated;create role service_role;grant usage on schema public,private to authenticated,service_role;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz default now(),deleted_at timestamptz,banned_until timestamptz,raw_app_meta_data jsonb default '{}');
 create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz);
 create table private.admin_users(user_id uuid,enabled boolean default true,role text);
 create table private.uhz_member_controls(user_id uuid,state text);
 create table public.community_coin_ledger(id bigint generated always as identity,user_id uuid,event_type text,coins_delta int check(coins_delta between -1000 and 1000 and coins_delta<>0),note text,created_at timestamptz default now());
 create table private.community_coin_journal(user_id uuid,coins_delta int);
 create table vault.secrets(id uuid default gen_random_uuid(),name text,secret text);
 create view vault.decrypted_secrets as select name,secret as decrypted_secret from vault.secrets;
 create function vault.create_secret(p_secret text,p_name text,p_desc text) returns uuid language sql as $$insert into vault.secrets(secret,name) values(p_secret,p_name) returning id$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
 await db.exec(await readFile(new URL('../schema.sql',import.meta.url),'utf8'));
 for(const u of [owner,alice,bob]){await db.query('insert into auth.users(id,email,raw_app_meta_data) values($1,$2,$3)',[u,u+'@example.test',u===owner?{uhz_role:'superadmin'}:{}]);await db.query('insert into auth.sessions(id,user_id) values($1,$2)',[session(u),u]);}
 await db.query("insert into private.admin_users(user_id,role) values($1,'owner')",[owner]);
 await t.test('anonymous and authenticated roles cannot invoke service-only financial RPC',async()=>{
  const acl=(await db.query("select has_function_privilege('anon','public.uhz_finance(uuid,uuid,text,jsonb)','EXECUTE') as anon,has_function_privilege('authenticated','public.uhz_finance(uuid,uuid,text,jsonb)','EXECUTE') as member")).rows[0];assert.equal(acl.anon,false);assert.equal(acl.member,false);
  await assert.rejects(()=>call(alice,'admin_dashboard'),/exclusivo/);await assert.rejects(()=>db.query('select private.uhz_fin_api($1,$2,\'dashboard\',\'{}\')',[alice,session(bob)]),/activa/);
 });
 await call(owner,'admin_config',{bank_name:'Fixture Bank',bank_holder:'Fixture Owner',bank_clabe:'032180000118359719',token_address:'0x'+'1'.repeat(40),treasury_address:'0x'+'2'.repeat(40),token_decimals:18,fee_bps:0});
 let deposit;
 await t.test('requests are idempotent and isolated by account',async()=>{
  const key=crypto.randomUUID();deposit=await make('deposit_mxn','100.00',{request_key:key});const twice=await make('deposit_mxn','100.00',{request_key:key});assert.equal(deposit.id,twice.id);assert.equal(twice.duplicate,true);
  await assert.rejects(()=>call(bob,'request_detail',{id:deposit.id}),/no encontrada/);
  assert.equal((await call(alice,'dashboard')).wallets.length,0);
 });
 await t.test('a deposit requires evidence and owner reconciliation, then credits once',async()=>{
  await assert.rejects(()=>call(owner,'admin_review',{id:deposit.id,decision:'complete',verified:true,external_reference:'BANK-TEST-001'}),/comprobante/);
  await call(alice,'attach_proof',{id:deposit.id,path:alice+'/'+deposit.id+'/test.pdf',sha256:'a'.repeat(64)});
  await call(owner,'admin_review',{id:deposit.id,decision:'complete',verified:true,external_reference:'BANK-TEST-001'});
  await call(owner,'admin_review',{id:deposit.id,decision:'complete',verified:true,external_reference:'BANK-TEST-001'});
  assert.equal((await call(alice,'dashboard')).wallets.find(x=>x.asset==='MXN').available,'100.00000000');
  const dup=await make('deposit_mxn','100');await call(alice,'attach_proof',{id:dup.id,path:alice+'/'+dup.id+'/test.pdf',sha256:'b'.repeat(64)});
  await assert.rejects(()=>call(owner,'admin_review',{id:dup.id,decision:'complete',verified:true,external_reference:'BANK-TEST-001'}),/unique constraint/);
 });
 await t.test('withdrawals reserve actual balances, encrypt CLABE and release on cancellation',async()=>{
  const r=await make('withdraw_mxn','25',{holder:'Fixture Alice',bank:'Fixture',clabe:'032180000118359719'});
  let d=await call(alice,'dashboard');assert.equal(d.wallets[0].available,'75.00000000');assert.equal(d.wallets[0].reserved,'25.00000000');
  const member=await call(alice,'request_detail',{id:r.id});assert.equal(member.request.destination,null);assert.equal(member.request.destination_encrypted,undefined);
  const admin=await call(owner,'admin_detail',{id:r.id});assert.equal(admin.request.destination.clabe,'032180000118359719');
  const raw=(await db.query('select encode(destination_encrypted,\'hex\') as v from private.uhz_fin_requests where id=$1',[r.id])).rows[0].v;assert.ok(!raw.includes(Buffer.from('032180000118359719').toString('hex')));
  await assert.rejects(()=>make('withdraw_mxn','90',{holder:'Fixture Alice',clabe:'032180000118359719'}),/check constraint/);
  await call(alice,'cancel',{id:r.id});d=await call(alice,'dashboard');assert.equal(d.wallets[0].available,'100.00000000');assert.equal(d.wallets[0].reserved,'0.00000000');
 });
 await call(owner,'admin_price',{price_mxn:'10',coins_per_inft:'100',reason:'Fixture quote for isolated database validation only.'});
 await t.test('a quote holds no money until confirmed and cannot overdraw',async()=>{
  const r=await make('buy_inft','30');assert.equal(r.status,'quoted');assert.equal((await call(alice,'dashboard')).wallets[0].available,'100.00000000');
  await call(alice,'confirm',{id:r.id});await call(alice,'confirm',{id:r.id});assert.equal((await call(alice,'dashboard')).wallets[0].available,'70.00000000');
  const excessive=await make('buy_inft','80');await assert.rejects(()=>call(alice,'confirm',{id:excessive.id}),/check constraint/);
  await assert.rejects(()=>call(owner,'admin_review',{id:r.id,decision:'complete',verified:true}),/reserva en blockchain/);
  const chain={chain_verified:true,token_address:'0x'+'1'.repeat(40),treasury_address:'0x'+'2'.repeat(40),observed_at:new Date().toISOString(),reserve_inft:'2'};
  await assert.rejects(()=>call(owner,'admin_review',{id:r.id,decision:'complete',verified:true,...chain}),/reserva INFT/);
  await call(owner,'admin_review',{id:r.id,decision:'complete',verified:true,...chain,reserve_inft:'3'});
  const d=await call(alice,'dashboard');assert.equal(d.wallets.find(x=>x.asset==='INFT').available,'3.00000000');assert.equal(d.wallets.find(x=>x.asset==='MXN').reserved,'0.00000000');
 });
 await t.test('Coins conversion uses the existing ledger and refunds only once',async()=>{
  await db.query("insert into public.community_coin_ledger(user_id,event_type,coins_delta,note) values($1,'manual_adjustment',200,'fixture')",[alice]);
  const r=await make('coins_to_inft','100');await call(alice,'confirm',{id:r.id});assert.equal((await call(alice,'dashboard')).coins,100);
  await call(owner,'admin_review',{id:r.id,decision:'reject',note:'Fixture cancellation'});await call(owner,'admin_review',{id:r.id,decision:'reject'});assert.equal((await call(alice,'dashboard')).coins,200);
 });
 await t.test('audit, price and journal cannot be edited or deleted',async()=>{
  await assert.rejects(()=>db.exec('delete from private.uhz_fin_journal'),/inmutable/);await assert.rejects(()=>db.exec('update private.uhz_fin_prices set price_mxn=999'),/inmutable/);await assert.rejects(()=>db.exec('delete from private.uhz_fin_audit'),/inmutable/);
  const a=(await db.query('select * from private.uhz_fin_audit order by id')).rows;for(let i=1;i<a.length;i++)assert.equal(a[i].previous_hash,a[i-1].event_hash);
 });
 await t.test('revoked sessions and restricted users cannot read their balances',async()=>{
  await db.query('delete from auth.sessions where user_id=$1',[bob]);await assert.rejects(()=>call(bob,'dashboard'),/activa/);
  await db.query("insert into private.uhz_member_controls(user_id,state) values($1,'suspended')",[alice]);await assert.rejects(()=>call(alice,'dashboard'),/activa/);
 });
 await db.close();
});
